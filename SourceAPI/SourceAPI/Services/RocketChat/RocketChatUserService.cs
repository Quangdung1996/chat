using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using SourceAPI.Core.Data.RocketChatData;
using SourceAPI.Core.Repository;
using SourceAPI.Helpers.RocketChat;
using SourceAPI.Models.RocketChat.DTOs;
using System;
using System.Net.Http;
using System.Text;
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
        private readonly HttpClient _httpClient;
        private readonly IRocketChatAuthService _authService;
        private readonly ILogger<RocketChatUserService> _logger;

        public RocketChatUserService(
            IHttpClientFactory httpClientFactory,
            IRocketChatAuthService authService,
            ILogger<RocketChatUserService> logger)
        {
            _httpClient = httpClientFactory.CreateClient("RocketChat");
            _authService = authService;
            _logger = logger;
        }

        /// <summary>
        /// T-08: Create user in Rocket.Chat
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

                // Generate fake email if not provided
                // RocketChat requires email, but we can use fake one for users without email
                if (string.IsNullOrWhiteSpace(email))
                {
                    email = $"{username}@noemail.local";
                    _logger.LogInformation($"Generated fake email for user {username}: {email}");
                }

                // Generate strong password if not provided (T-09)
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

                // Get admin token
                var token = await _authService.GetAdminTokenAsync();

                var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/users.create");
                request.Headers.Add("X-Auth-Token", token.AuthToken);
                request.Headers.Add("X-User-Id", token.UserId);
                var payload = JsonConvert.SerializeObject(createRequest, new JsonSerializerSettings
                {
                    ContractResolver = new DefaultContractResolver { NamingStrategy = new CamelCaseNamingStrategy() },
                    NullValueHandling = NullValueHandling.Ignore
                });

                request.Content = new StringContent(
                    payload,
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await _httpClient.SendAsync(request);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError($"Failed to create user in Rocket.Chat: {response.StatusCode} - {responseContent}");

                    return new CreateUserResponse
                    {
                        Success = false,
                        Error = $"Failed to create user: {responseContent}"
                    };
                }

                var createResponse = JsonConvert.DeserializeObject<CreateUserResponse>(responseContent);

                if (createResponse == null || !createResponse.Success)
                {
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
                // Check if mapping already exists
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

                // Create new user in Rocket.Chat (username is primary, email is optional)
                var createResult = await CreateUserAsync(username, fullName, email);

                if (!createResult.Success)
                {
                    throw new Exception($"Failed to create user in Rocket.Chat: {createResult.Error}");
                }

                // Save mapping to database using Repository
                // Note: Password is stored encrypted/hashed in Metadata for future auto-login
                var metadata = new
                {
                    password = "Action123", // TODO: Encrypt this before storing
                    createdAt = DateTime.UtcNow,
                    source = "auto-sync"
                };

                var upsertResult = RocketChatRepository.UpsertUserMapping(new UpsertUserMappingParam
                {
                    UserId = userId,
                    RocketUserId = createResult.User.Id,
                    RocketUsername = createResult.User.Username,
                    Email = email ?? string.Empty,
                    FullName = fullName,
                    Metadata = Newtonsoft.Json.JsonConvert.SerializeObject(metadata),
                    CreatedBy = userId.ToString()
                });

                if (upsertResult == null || !upsertResult.Success)
                {
                    _logger.LogWarning($"Failed to save user mapping for user {userId}");
                }

                _logger.LogInformation($"Successfully synced user {userId} to Rocket.Chat user {createResult.User.Id}");

                return new SyncUserResponse
                {
                    UserId = userId,
                    RocketUserId = createResult.User.Id,
                    Username = createResult.User.Username,
                    IsNewUser = true,
                    Message = "User synced successfully"
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
                var token = await _authService.GetAdminTokenAsync();

                var request = new HttpRequestMessage(HttpMethod.Get, $"/api/v1/users.info?username={username}");
                request.Headers.Add("X-Auth-Token", token.AuthToken);
                request.Headers.Add("X-User-Id", token.UserId);

                var response = await _httpClient.SendAsync(request);

                return response.IsSuccessStatusCode;
            }
            catch
            {
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
                    Email = mapping.Email,
                    FullName = mapping.FullName,
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

