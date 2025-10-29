using Microsoft.Extensions.Logging;
using SourceAPI.Core.Data.RocketChatData;
using SourceAPI.Core.Repository;
using SourceAPI.Helpers.RocketChat;
using SourceAPI.Models.RocketChat;
using SourceAPI.Models.RocketChat.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SourceAPI.Services.RocketChat
{
    /// <summary>
    /// T-08: RocketChat User Service Implementation
    /// DoD: Gọi users.create; trả RocketUserId/Username; persist mapping; bắt lỗi có ngữ nghĩa
    /// Uses Database First pattern with Repository
    /// </summary>
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

        /// <summary>
        /// T-08: Create user in Rocket.Chat (public API - checks for duplicates)
        /// DoD: Gọi users.create; trả RocketUserId/Username
        /// </summary>
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

                // Check if user already exists
                // Handler tự động xử lý "User not found" → return { success: true, user: null }
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

                // User doesn't exist (user == null), create new one
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

        /// <summary>
        /// Internal method to create user without duplicate check
        /// Used by SyncUserAsync after it has already checked for duplicates
        /// </summary>
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

                // Set user as active after successful creation
                try
                {
                    //var setActiveRequest = new SetUserActiveStatusRequest
                    //{
                    //    UserId = createResponse.User.Id,
                    //    ActiveStatus = true
                    //};
                    //var activeResponse = await _adminApi.SetUserActiveStatusAsync(setActiveRequest);

                    //if (activeResponse != null && activeResponse.Success)
                    //{
                    //    _logger.LogInformation($"Successfully set user {username} as active in Rocket.Chat");
                    //}
                    //else
                    //{
                    //    _logger.LogWarning($"Failed to set user {username} as active: {activeResponse?.Error}");
                    //}
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, $"Error setting user {username} as active (user created successfully): {ex.Message}");
                }

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
                // Create or get existing user in Rocket.Chat
                // CreateUserAsync handles duplicate check internally
                // Generate deterministic password from userId + salt
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
                // Save mapping to database
                // Only save password if user was newly created
                var metadata = new
                {
                    password = createResult.IsExistingUser ? null : password, // Only save if newly created
                    createdAt = DateTime.UtcNow,
                    source = "auto-sync",
                    isNewUser = !createResult.IsExistingUser,
                    wasExistingInRocketChat = createResult.IsExistingUser
                };

                var insertResult = RocketChatRepository.InsertUserMapping(new UpsertUserMappingParam
                {
                    UserId = userId,
                    RocketUserId = createResult.User.Id,
                    RocketUsername = createResult.User.Username,
                    Email = string.IsNullOrWhiteSpace(email) ? null : email,
                    FullName = string.IsNullOrWhiteSpace(fullName) ? null : fullName,
                    Metadata = Newtonsoft.Json.JsonConvert.SerializeObject(metadata),
                    CreatedBy = userId.ToString()
                });

                if (insertResult == null || !insertResult.Success)
                {
                    _logger.LogWarning($"Failed to insert user mapping for user {userId}");
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

        /// <summary>
        /// Check if user exists by username
        /// </summary>
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

        /// <summary>
        /// Get mapping by internal user ID
        /// </summary>
        public async Task<UserRocketChatMapping?> GetMappingAsync(int userId)
        {
            try
            {
                var result = RocketChatRepository.GetUserMappingByUserId(userId);

                if (result == null)
                    return null;

                return new UserRocketChatMapping
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

        /// <summary>
        /// Get mapping by Rocket.Chat user ID
        /// </summary>
        public async Task<UserRocketChatMapping?> GetMappingByRocketUserIdAsync(string rocketUserId)
        {
            try
            {
                var result = RocketChatRepository.GetUserMappingByRocketUserId(rocketUserId);

                if (result == null)
                    return null;

                return new UserRocketChatMapping
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

        /// <summary>
        /// Get users directly from Rocket.Chat (for directory/contacts)
        /// </summary>
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
                    return false;

                // Update using Repository (re-upsert with new status)
                var upsertResult = RocketChatRepository.UpsertUserMapping(new UpsertUserMappingParam
                {
                    UserId = userId,
                    RocketUserId = mapping.RocketUserId,
                    RocketUsername = mapping.RocketUsername,
                    Email = string.IsNullOrWhiteSpace(mapping.Email) ? null : mapping.Email,
                    FullName = string.IsNullOrWhiteSpace(mapping.FullName) ? null : mapping.FullName,
                    CreatedBy = userId.ToString()
                });

                return upsertResult != null && upsertResult.Success;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating user {userId} active status: {ex.Message}");
                return false;
            }
        }
    }
}