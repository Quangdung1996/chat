using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using SourceAPI.Models.RocketChat;
using SourceAPI.Models.RocketChat.DTOs;
using System;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace SourceAPI.Services.RocketChat
{
    /// <summary>
    /// T-01, T-02, T-03: RocketChat Authentication Service Implementation
    /// Handles login/logout, token caching with auto-refresh, and 401/timeout handling
    /// </summary>
    public class RocketChatAuthService : IRocketChatAuthService
    {
        private readonly HttpClient _httpClient;
        private readonly IMemoryCache _cache;
        private readonly RocketChatConfig _config;
        private readonly SemaphoreSlim _tokenRefreshLock = new(1, 1);

        private const string ADMIN_TOKEN_KEY = "RocketChat_AdminToken";
        private const string BOT_TOKEN_KEY = "RocketChat_BotToken";

        public RocketChatAuthService(
            IHttpClientFactory httpClientFactory,
            IMemoryCache cache,
            IOptions<RocketChatConfig> config)
        {
            _httpClient = httpClientFactory.CreateClient("RocketChat");
            _cache = cache;
            _config = config.Value;
        }

        /// <summary>
        /// Login to Rocket.Chat
        /// DoD: Gọi được login; xử lý 401/timeout; trả về token + userId
        /// </summary>
        public async Task<AuthTokenDto> LoginAsync(string username, string password)
        {
            var loginData = new
            {
                user = username,
                password = password
            };

            var content = new StringContent(
                JsonConvert.SerializeObject(loginData),
                Encoding.UTF8,
                "application/json"
            );

            try
            {
                var response = await _httpClient.PostAsync("/api/v1/login", content);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    throw new Exception($"Login failed: {response.StatusCode} - {errorContent}");
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                var loginResponse = JsonConvert.DeserializeObject<RocketChatLoginResponse>(responseContent);

                if (loginResponse == null || !loginResponse.Success)
                {
                    throw new Exception("Login failed: Invalid response from Rocket.Chat");
                }

                var token = new AuthTokenDto
                {
                    AuthToken = loginResponse.Data.AuthToken,
                    UserId = loginResponse.Data.UserId,
                    ExpiresAt = DateTime.UtcNow.AddSeconds(_config.TokenCacheTTL)
                };

                return token;
            }
            catch (HttpRequestException ex)
            {
                throw new Exception($"Network error during login: {ex.Message}", ex);
            }
            catch (TaskCanceledException ex)
            {
                throw new Exception("Login request timeout", ex);
            }
        }

        /// <summary>
        /// Logout from Rocket.Chat
        /// DoD: Gọi được logout; trả về success/fail
        /// </summary>
        public async Task<bool> LogoutAsync(string authToken, string userId)
        {
            try
            {
                var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/logout");
                request.Headers.Add("X-Auth-Token", authToken);
                request.Headers.Add("X-User-Id", userId);

                var response = await _httpClient.SendAsync(request);
                return response.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Get current valid token (login if needed)
        /// DoD: Lấy token; tự động login nếu chưa có
        /// </summary>
        public async Task<AuthTokenDto> GetTokenAsync()
        {
            return await GetAdminTokenAsync();
        }

        /// <summary>
        /// Validate if token is still valid
        /// DoD: Validate token; xử lý 401
        /// </summary>
        public async Task<bool> ValidateTokenAsync(string authToken, string userId)
        {
            try
            {
                var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/me");
                request.Headers.Add("X-Auth-Token", authToken);
                request.Headers.Add("X-User-Id", userId);

                var response = await _httpClient.SendAsync(request);
                return response.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// T-02: Get admin token with caching and auto-refresh
        /// DoD: Token cache với TTL; tự refresh khi hết hạn; thread-safe
        /// </summary>
        public async Task<AuthTokenDto> GetAdminTokenAsync()
        {
            return await GetCachedTokenAsync(
                ADMIN_TOKEN_KEY,
                _config.AdminUsername,
                _config.AdminPassword
            );
        }

        /// <summary>
        /// Get bot token with caching and auto-refresh
        /// </summary>
        public async Task<AuthTokenDto> GetBotTokenAsync()
        {
            return await GetCachedTokenAsync(
                BOT_TOKEN_KEY,
                _config.BotUsername,
                _config.BotPassword
            );
        }

        /// <summary>
        /// Force refresh admin token (bypass cache)
        /// Used by DelegatingHandler when receiving 401 Unauthorized
        /// </summary>
        public async Task<AuthTokenDto> RefreshAdminTokenAsync()
        {
            await _tokenRefreshLock.WaitAsync();
            try
            {
                // Remove from cache
                _cache.Remove(ADMIN_TOKEN_KEY);

                // Login to get new token
                var token = await LoginAsync(_config.AdminUsername, _config.AdminPassword);

                // Cache the new token
                var cacheOptions = new MemoryCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(_config.TokenCacheTTL)
                };
                _cache.Set(ADMIN_TOKEN_KEY, token, cacheOptions);

                return token;
            }
            finally
            {
                _tokenRefreshLock.Release();
            }
        }

        /// <summary>
        /// T-02: Thread-safe token caching with auto-refresh
        /// DoD: Thread-safe; cấu hình TTL qua appsettings
        /// </summary>
        private async Task<AuthTokenDto> GetCachedTokenAsync(string cacheKey, string username, string password)
        {
            // Try to get from cache first
            if (_cache.TryGetValue<AuthTokenDto>(cacheKey, out var cachedToken))
            {
                // Check if token is about to expire (refresh 1 hour before expiry)
                if (cachedToken.ExpiresAt > DateTime.UtcNow.AddHours(1))
                {
                    return cachedToken;
                }
            }

            // Lock to prevent multiple simultaneous logins
            await _tokenRefreshLock.WaitAsync();
            try
            {
                // Double-check after acquiring lock
                if (_cache.TryGetValue<AuthTokenDto>(cacheKey, out cachedToken))
                {
                    if (cachedToken.ExpiresAt > DateTime.UtcNow.AddHours(1))
                    {
                        return cachedToken;
                    }
                }

                // Login and cache new token
                var newToken = await LoginAsync(username, password);

                var cacheOptions = new MemoryCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(_config.TokenCacheTTL),
                    Priority = CacheItemPriority.High
                };

                _cache.Set(cacheKey, newToken, cacheOptions);

                return newToken;
            }
            finally
            {
                _tokenRefreshLock.Release();
            }
        }

        /// <summary>
        /// Clear all cached tokens
        /// </summary>
        public void ClearCache()
        {
            _cache.Remove(ADMIN_TOKEN_KEY);
            _cache.Remove(BOT_TOKEN_KEY);
        }
    }
}

