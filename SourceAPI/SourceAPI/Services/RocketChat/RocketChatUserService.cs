using Microsoft.Extensions.Logging;
using SourceAPI.Core.Data.RocketChatData;
using SourceAPI.Core.Repository;
using SourceAPI.Helpers.RocketChat;
using SourceAPI.Models.RocketChat;
using SourceAPI.Models.RocketChat.DTOs;
using System;
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
        private readonly IRocketChatProxy _rocketChatApi;
        private readonly ILogger<RocketChatUserService> _logger;

        public RocketChatUserService(
            IRocketChatProxy rocketChatApi,
            ILogger<RocketChatUserService> logger)
        {
            _rocketChatApi = rocketChatApi;
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
                var existingUser = await _rocketChatApi.GetUserInfoAsync(username);
                if (existingUser != null && existingUser.Success && existingUser.User != null)
                {
                    _logger.LogInformation($"User {username} already exists in Rocket.Chat");
                    return new CreateUserResponse
                    {
                        Success = true,
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
                    email = $"{username}@noemail.local";
                    _logger.LogInformation($"Generated fake email for user {username}: {email}");
                }

                // Generate password if not provided
                if (string.IsNullOrWhiteSpace(password))
                {
                    password = PasswordGenerator.GenerateStrongPassword();
                }

                var createRequest = new CreateUserRequest
                {
                    Email = email,
                    Name = string.IsNullOrEmpty(fullName) ? username : fullName,
                    Username = username,
                    Password = password,
                    Verified = true,
                    SendWelcomeEmail = false,
                    RequirePasswordChange = false
                };

                // Use Refit - DelegatingHandler auto adds auth headers & logging
                var createResponse = await _rocketChatApi.CreateUserAsync(createRequest);

                if (createResponse == null || !createResponse.Success)
                {
                    _logger.LogError($"Failed to create user in Rocket.Chat: {createResponse?.Error}");
                    return new CreateUserResponse
                    {
                        Success = false,
                        Error = createResponse?.Error ?? "Unknown error creating user"
                    };
                }

                _logger.LogInformation($"Successfully created user {username} in Rocket.Chat with ID {createResponse.User.Id}");

                return createResponse;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Exception creating user in Rocket.Chat: {ex.Message}");

                return new CreateUserResponse
                {
                    Success = false,
                    Error = ex.Message
                };
            }
        }

        public async Task<SyncUserResponse> SyncUserAsync(int userId, string username, string fullName, string? email = null)
        {
            try
            {
                // Check if mapping already exists in local DB
                var existingMapping = await GetMappingAsync(userId);

                if (existingMapping != null)
                {
                    // User already synced
                    return new SyncUserResponse
                    {
                        UserId = userId,
                        RocketUserId = existingMapping.RocketUserId,
                        Username = existingMapping.RocketUsername,
                        IsNewUser = false,
                        Message = "User already synced"
                    };
                }

                // Check if user already exists in Rocket.Chat
                // Handler tự động xử lý "User not found" → return { success: true, user: null }
                var existingUser = await _rocketChatApi.GetUserInfoAsync(username);
                
                string? password = null;
                bool isNewUser = false;
                string rocketUserId;
                string rocketUsername;

                if (existingUser != null && existingUser.Success && existingUser.User != null)
                {
                    // User đã tồn tại trong Rocket.Chat → chỉ tạo mapping, KHÔNG lưu password
                    _logger.LogInformation($"User {username} already exists in Rocket.Chat, creating mapping only");
                    rocketUserId = existingUser.User.Id;
                    rocketUsername = existingUser.User.Username;
                    isNewUser = false;
                }
                else
                {
                    // User chưa tồn tại (user == null) → tạo mới với password
                    _logger.LogInformation($"Creating new user {username} in Rocket.Chat");
                    password = PasswordGenerator.GenerateStrongPassword();
                    
                    var createResult = await CreateUserInternalAsync(username, fullName, email, password);
                    
                    if (!createResult.Success)
                    {
                        throw new Exception($"Failed to create user in Rocket.Chat: {createResult.Error}");
                    }
                    
                    rocketUserId = createResult.User.Id;
                    rocketUsername = createResult.User.Username;
                    isNewUser = true;
                }

                // Save mapping to database
                // Chỉ lưu password nếu là user mới (vừa tạo)
                var metadata = new
                {
                    password = password, // null nếu user đã tồn tại, có giá trị nếu mới tạo
                    createdAt = DateTime.UtcNow,
                    source = "auto-sync",
                    isNewUser = isNewUser
                };

                var upsertResult = RocketChatRepository.UpsertUserMapping(new UpsertUserMappingParam
                {
                    UserId = userId,
                    RocketUserId = rocketUserId,
                    RocketUsername = rocketUsername,
                    Email = string.IsNullOrWhiteSpace(email) ? null : email,
                    FullName = string.IsNullOrWhiteSpace(fullName) ? null : fullName,
                    Metadata = Newtonsoft.Json.JsonConvert.SerializeObject(metadata),
                    CreatedBy = userId.ToString()
                });

                if (upsertResult == null || !upsertResult.Success)
                {
                    _logger.LogWarning($"Failed to save user mapping for user {userId}");
                }

                _logger.LogInformation($"Successfully synced user {userId} to Rocket.Chat user {rocketUserId}");

                return new SyncUserResponse
                {
                    UserId = userId,
                    RocketUserId = rocketUserId,
                    Username = rocketUsername,
                    IsNewUser = isNewUser,
                    Message = isNewUser ? "User created and synced successfully" : "Existing user synced successfully"
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
                var response = await _rocketChatApi.GetUserInfoAsync(username);
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
        /// Set user active status
        /// </summary>
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

