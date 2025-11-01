using Microsoft.Extensions.Logging;
using SourceAPI.Core.Data.RocketChatData;
using SourceAPI.Core.Repository;
using SourceAPI.Helpers.RocketChat;
using SourceAPI.Infrastructure.Proxy;
using SourceAPI.Models.RocketChat.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SourceAPI.Services.RocketChat
{
    public class RocketChatUserService : IRocketChatUserService
    {
        private readonly IRocketChatAdminProxy _adminApi;
        private readonly ILogger<RocketChatUserService> _logger;

        public RocketChatUserService(
            IRocketChatAdminProxy adminApi,
            ILogger<RocketChatUserService> logger)
        {
            _adminApi = adminApi;
            _logger = logger;
        }

        public async Task<CreateUserResponse> CreateUserAsync(
            string username,
            string fullName,
            string? email = null,
            string? password = null)
        {
            try
            {
                // Validate username is required
                if (string.IsNullOrWhiteSpace(username))
                {
                    throw new ArgumentException("Username is required", nameof(username));
                }

                var existingUser = await _adminApi.GetUserInfoAsync(username);
                if (existingUser != null && existingUser.Success && existingUser.User != null)
                {
                    _logger.LogInformation($"User {username} already exists in Rocket.Chat");
                    return new CreateUserResponse
                    {
                        Success = true,
                        IsExistingUser = true,
                        User = new UserData
                        {
                            Active = true,
                            CreatedAt = existingUser.User.CreatedAt,
                            Email = email ?? existingUser.User.Email,
                            Id = existingUser.User.Id,
                            Name = existingUser.User.Name,
                            Username = existingUser.User.Username
                        }
                    };
                }


                return await CreateUserInternalAsync(username, fullName, email, password);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Exception creating user in Rocket.Chat: {ex.Message}");

                return new CreateUserResponse
                {
                    Success = false,
                    IsExistingUser = false,
                    Error = ex.Message
                };
            }
        }

        private async Task<CreateUserResponse> CreateUserInternalAsync(
            string username,
            string fullName,
            string? email = null,
            string? password = null)
        {
            try
            {
                // Generate fake email if not provided
                if (string.IsNullOrWhiteSpace(email))
                {
                    if (EmailValidator.IsValidEmail(username))
                    {
                        email = username;
                    }
                    else
                    {
                        email = $"{username}@noemail.local";
                        _logger.LogInformation($"Generated fake email for user {username}: {email}");
                    }
                }

                // Generate password if not provided
                // Use username-based deterministic password when userId not available
                if (string.IsNullOrWhiteSpace(password))
                {
                    password = RocketChatPasswordHelper.GeneratePasswordFromUsername(username);
                    _logger.LogInformation($"Password not provided, generating deterministic password from username for {username}");
                }

                var createRequest = new CreateUserRequest
                {
                    Email = email,
                    Name = string.IsNullOrEmpty(fullName) ? username : fullName,
                    Username = username.Replace("@", ""),
                    Password = password,
                    Verified = false,
                    SendWelcomeEmail = false,
                    RequirePasswordChange = false,
                    Active = true
                };

                // Use Refit - DelegatingHandler auto adds auth headers & logging
                var createResponse = await _adminApi.CreateUserAsync(createRequest);

                if (createResponse == null || !createResponse.Success)
                {
                    _logger.LogError($"Failed to create user in Rocket.Chat: {createResponse?.Error}");
                    return new CreateUserResponse
                    {
                        Success = false,
                        IsExistingUser = false,
                        Error = createResponse?.Error ?? "Unknown error creating user"
                    };
                }

                _logger.LogInformation($"Successfully created user {username} in Rocket.Chat with ID {createResponse.User.Id}");

                // Mark as newly created user
                createResponse.IsExistingUser = false;


                return createResponse;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Exception creating user in Rocket.Chat: {ex.Message}");

                return new CreateUserResponse
                {
                    Success = false,
                    IsExistingUser = false,
                    Error = ex.Message
                };
            }
        }

        public async Task<SyncUserResponse> SyncUserAsync(int userId, string username, string fullName, string? email = null)
        {
            try
            {
                // Check if already synced
                var existingMapping = await GetMappingAsync(userId);
                if (existingMapping != null)
                {
                    _logger.LogInformation($"User {userId} already synced, skipping");
                    return new SyncUserResponse
                    {
                        UserId = userId,
                        RocketUserId = existingMapping.RocketUserId,
                        Username = existingMapping.RocketUsername,
                        IsNewUser = false,
                        Message = "User already synced"
                    };
                }

                if (username == "tnguyen")
                {

                }
                var password = RocketChatPasswordHelper.GeneratePasswordFromUserId(userId);
                var createResult = await CreateUserAsync(username, fullName, email, password);

                if (!createResult.Success)
                {
                    throw new Exception($"Failed to create/get user in Rocket.Chat: {createResult.Error}");
                }

                if (createResult.IsExistingUser)
                {
                    return new SyncUserResponse
                    {
                        UserId = userId,
                        RocketUserId = createResult.User.Id,
                        Username = createResult.User.Username,
                        IsNewUser = false,
                        Message = "User already synced"
                    };
                }

                var metadata = new
                {
                    password = createResult.IsExistingUser ? null : password,
                    createdAt = DateTime.UtcNow,
                    source = "auto-sync",
                    isNewUser = !createResult.IsExistingUser,
                    wasExistingInRocketChat = createResult.IsExistingUser
                };

                // Insert user mapping to database
                var metadataJson = System.Text.Json.JsonSerializer.Serialize(metadata);
                var insertResult = RocketChatRepository.UpsertUserRocketMapping(
                    userId,
                    createResult.User.Id,
                    createResult.User.Username,
                    email ?? string.Empty,
                    fullName,
                    metadataJson
                );

                if (insertResult == null)
                {
                    _logger.LogError($"Failed to insert user mapping for user {userId}");
                    throw new Exception("Failed to save user mapping to database");
                }

                _logger.LogInformation($"Successfully synced user {userId} to Rocket.Chat user {createResult.User.Id}");

                return new SyncUserResponse
                {
                    UserId = userId,
                    RocketUserId = createResult.User.Id,
                    Username = createResult.User.Username,
                    IsNewUser = !createResult.IsExistingUser, // True if newly created, False if existed
                    Message = createResult.IsExistingUser
                        ? "Existing user synced successfully"
                        : "User created and synced successfully"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error syncing user {userId}: {ex.Message}");

                return new SyncUserResponse
                {
                    UserId = userId,
                    RocketUserId = string.Empty,
                    Username = string.Empty,
                    IsNewUser = false,
                    Message = $"Sync failed: {ex.Message}"
                };
            }
        }

        public async Task<bool> UserExistsAsync(string username)
        {
            try
            {
                // Use Refit - DelegatingHandler auto adds auth headers
                // Handler tự động xử lý "User not found" → return { success: true, user: null }
                var response = await _adminApi.GetUserInfoAsync(username);
                return response != null && response.Success && response.User != null;
            }
            catch (Exception ex)
            {
                // API error (not 404, not "User not found")
                _logger.LogError(ex, $"API error checking user {username}: {ex.Message}");
                return false;
            }
        }

        public async Task<RocketUserMapping?> GetMappingAsync(int userId)
        {
            try
            {
                var result = RocketChatRepository.GetUserMappingByUserId(userId);

                if (result == null)
                    return null;

                return new RocketUserMapping
                {
                    Id = result.Id,
                    UserId = result.UserId,
                    RocketUserId = result.RocketUserId,
                    RocketUsername = result.RocketUsername,
                    Email = result.Email,
                    FullName = result.FullName,
                    IsActive = result.IsActive,
                    CreatedAt = result.CreatedAt,
                    LastSyncAt = result.LastSyncAt,
                    Metadata = result.Metadata
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting mapping for user {userId}");
                return null;
            }
        }

        public async Task<RocketUserMapping?> GetMappingByRocketUserIdAsync(string rocketUserId)
        {
            try
            {
                var result = RocketChatRepository.GetUserMappingByRocketUserId(rocketUserId);

                if (result == null)
                    return null;

                return new RocketUserMapping
                {
                    Id = result.Id,
                    UserId = result.UserId,
                    RocketUserId = result.RocketUserId,
                    RocketUsername = result.RocketUsername,
                    Email = result.Email,
                    FullName = result.FullName,
                    IsActive = result.IsActive,
                    CreatedAt = result.CreatedAt,
                    LastSyncAt = result.LastSyncAt,
                    Metadata = result.Metadata
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting mapping for Rocket user {rocketUserId}");
                return null;
            }
        }

        public async Task<List<RocketChatUser>> GetRocketChatUsersAsync(int count = 100, int offset = 0)
        {
            try
            {
                var response = await _adminApi.GetUsersListAsync(count, offset);

                if (response == null || !response.Success || response.Users == null)
                {
                    _logger.LogWarning("Failed to get users from Rocket.Chat");
                    return new List<RocketChatUser>();
                }

                _logger.LogInformation($"Retrieved {response.Users.Count} users from Rocket.Chat");
                return response.Users;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting users from Rocket.Chat: {ex.Message}");
                return new List<RocketChatUser>();
            }
        }

        public async Task<bool> SetUserActiveStatusAsync(int userId, bool isActive)
        {
            try
            {
                // Get current mapping to ensure it exists
                var mapping = await GetMappingAsync(userId);
                if (mapping == null)
                {
                    _logger.LogWarning($"User mapping not found for user {userId}");
                    return false;
                }

                // Update using UPSERT (will update LastSyncAt and IsActive)
                var metadata = string.IsNullOrEmpty(mapping.Metadata) 
                    ? "{}" 
                    : mapping.Metadata;

                var updateResult = RocketChatRepository.UpsertUserRocketMapping(
                    userId,
                    mapping.RocketUserId,
                    mapping.RocketUsername,
                    mapping.Email ?? string.Empty,
                    mapping.FullName ?? string.Empty,
                    metadata
                );

                if (updateResult == null)
                {
                    _logger.LogError($"Failed to update user mapping for user {userId}");
                    return false;
                }

                _logger.LogInformation($"Updated user {userId} active status to {isActive}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating user {userId} active status: {ex.Message}");
                return false;
            }
        }
    }
}