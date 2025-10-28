using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using SourceAPI.Data.Entities;
using SourceAPI.Helpers.RocketChat;
using SourceAPI.Models.RocketChat.DTOs;
using System;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace SourceAPI.Services.RocketChat
{
    /// <summary>
    /// T-08: RocketChat User Service Implementation
    /// DoD: Gọi users.create; trả RocketUserId/Username; persist mapping; bắt lỗi có ngữ nghĩa
    /// </summary>
    public class RocketChatUserService : IRocketChatUserService
    {
        private readonly HttpClient _httpClient;
        private readonly IRocketChatAuthService _authService;
        private readonly DbContext _dbContext; // Replace with your actual DbContext
        private readonly ILogger<RocketChatUserService> _logger;

        public RocketChatUserService(
            IHttpClientFactory httpClientFactory,
            IRocketChatAuthService authService,
            ILogger<RocketChatUserService> logger)
        {
            _httpClient = httpClientFactory.CreateClient("RocketChat");
            _authService = authService;
            _logger = logger;
            // TODO: Inject your DbContext here
            // _dbContext = dbContext;
        }

        /// <summary>
        /// T-08: Create user in Rocket.Chat
        /// DoD: Gọi users.create; trả RocketUserId/Username
        /// </summary>
        public async Task<CreateUserResponse> CreateUserAsync(
            string email,
            string fullName,
            string? username = null,
            string? password = null)
        {
            try
            {
                // Generate username if not provided (T-09)
                if (string.IsNullOrWhiteSpace(username))
                {
                    username = SlugHelper.GenerateUsername(fullName);

                    // Check for uniqueness and add suffix if needed
                    int suffix = 1;
                    while (await UserExistsAsync(username))
                    {
                        username = SlugHelper.GenerateUsername(fullName, suffix);
                        suffix++;

                        if (suffix > 100)
                        {
                            throw new Exception($"Unable to generate unique username for {fullName} after 100 attempts");
                        }
                    }
                }

                // Generate strong password if not provided (T-09)
                if (string.IsNullOrWhiteSpace(password))
                {
                    password = PasswordGenerator.GenerateStrongPassword();
                }

                var createRequest = new CreateUserRequest
                {
                    Email = email,
                    Name = fullName,
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
                request.Content = new StringContent(
                    JsonConvert.SerializeObject(createRequest),
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

        /// <summary>
        /// T-08: Sync user with Rocket.Chat
        /// DoD: persist mapping; bắt lỗi có ngữ nghĩa
        /// </summary>
        public async Task<SyncUserResponse> SyncUserAsync(int userId, string email, string fullName)
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

                // Create new user in Rocket.Chat
                var createResult = await CreateUserAsync(email, fullName);

                if (!createResult.Success)
                {
                    throw new Exception($"Failed to create user in Rocket.Chat: {createResult.Error}");
                }

                // Save mapping to database
                var mapping = new UserRocketChatMapping
                {
                    UserId = userId,
                    RocketUserId = createResult.User.Id,
                    RocketUsername = createResult.User.Username,
                    CreatedAt = DateTime.UtcNow,
                    LastSyncAt = DateTime.UtcNow,
                    IsActive = true
                };

                // TODO: Save to your DbContext
                // await _dbContext.Set<UserRocketChatMapping>().AddAsync(mapping);
                // await _dbContext.SaveChangesAsync();

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
            // TODO: Query from your DbContext
            // return await _dbContext.Set<UserRocketChatMapping>()
            //     .FirstOrDefaultAsync(m => m.UserId == userId && m.IsActive);
            
            await Task.CompletedTask;
            return null;
        }

        /// <summary>
        /// Get mapping by Rocket.Chat user ID
        /// </summary>
        public async Task<UserRocketChatMapping?> GetMappingByRocketUserIdAsync(string rocketUserId)
        {
            // TODO: Query from your DbContext
            // return await _dbContext.Set<UserRocketChatMapping>()
            //     .FirstOrDefaultAsync(m => m.RocketUserId == rocketUserId && m.IsActive);
            
            await Task.CompletedTask;
            return null;
        }

        /// <summary>
        /// Set user active status
        /// </summary>
        public async Task<bool> SetUserActiveStatusAsync(int userId, bool isActive)
        {
            try
            {
                var mapping = await GetMappingAsync(userId);
                if (mapping == null)
                    return false;

                mapping.IsActive = isActive;
                mapping.LastSyncAt = DateTime.UtcNow;

                // TODO: Update in your DbContext
                // await _dbContext.SaveChangesAsync();

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

