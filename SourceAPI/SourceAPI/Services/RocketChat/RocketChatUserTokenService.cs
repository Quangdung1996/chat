using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using SourceAPI.Helpers.RocketChat;
using SourceAPI.Infrastructure.Proxy;
using SourceAPI.Models.RocketChat;
using SourceAPI.Models.RocketChat.DTOs;
using System;
using System.Threading.Tasks;

namespace SourceAPI.Services.RocketChat
{
    public interface IRocketChatUserTokenService
    {
        Task<AuthTokenDto> GetOrCreateUserTokenAsync(int userId, string username);
    }

    public class RocketChatUserTokenService : IRocketChatUserTokenService
    {
        private readonly IRocketChatPublicProxy _publicApi;
        private readonly IMemoryCache _cache;
        private readonly ILogger<RocketChatUserTokenService> _logger;
        private const string CACHE_KEY_PREFIX = "RocketChatUserToken_";
        private static readonly TimeSpan CACHE_DURATION = TimeSpan.FromHours(23); // Token valid 24h, cache 23h

        public RocketChatUserTokenService(
            IRocketChatPublicProxy publicApi,
            IMemoryCache cache,
            ILogger<RocketChatUserTokenService> logger)
        {
            _publicApi = publicApi;
            _cache = cache;
            _logger = logger;
        }

        public async Task<AuthTokenDto> GetOrCreateUserTokenAsync(int userId, string username)
        {
            try
            {
                // Check cache first
                string cacheKey = $"{CACHE_KEY_PREFIX}{userId}";
                
                if (_cache.TryGetValue(cacheKey, out AuthTokenDto cachedToken))
                {
                    // Verify token not expired
                    if (!cachedToken.IsExpired)
                    {
                        _logger.LogInformation($"Using cached token for user {userId}");
                        return cachedToken;
                    }
                    
                    _logger.LogInformation($"Cached token expired for user {userId}, refreshing...");
                }

                // Generate deterministic password from userId
                string password = RocketChatPasswordHelper.GeneratePasswordFromUserId(userId);

                // Login to get token
                _logger.LogInformation($"Logging in user {userId} ({username}) to get token");
                
                var loginRequest = new LoginRequest
                {
                    User = username,
                    Password = password
                };

                var loginResponse = await _publicApi.LoginAsync(loginRequest);

                if (loginResponse == null || string.IsNullOrEmpty(loginResponse.Data?.AuthToken))
                {
                    throw new Exception($"Failed to login user {userId}: No auth token returned");
                }

                // Create token DTO
                var token = new AuthTokenDto
                {
                    AuthToken = loginResponse.Data.AuthToken,
                    UserId = loginResponse.Data.UserId,
                    ExpiresAt = DateTime.UtcNow.AddHours(24) // Rocket.Chat default token expiry
                };

                // Cache token
                _cache.Set(cacheKey, token, new MemoryCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = CACHE_DURATION
                });

                _logger.LogInformation($"Successfully obtained and cached token for user {userId}");
                
                return token;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting token for user {userId}: {ex.Message}");
                throw;
            }
        }
    }
}

