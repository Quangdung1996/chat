using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using SourceAPI.Infrastructure.Proxy;
using SourceAPI.Models.RocketChat;
using SourceAPI.Models.RocketChat.DTOs;
using SourceAPI.Services.RocketChat.Interfaces;
using System;
using System.Threading.Tasks;

namespace SourceAPI.Services.RocketChat
{
    public class RocketChatAutoLoginService : IRocketChatAutoLoginService
    {
        private readonly IRocketChatUserService _userService;
        private readonly IRocketChatAuthService _authService;
        private readonly RocketChatConfig _config;
        private readonly ILogger<RocketChatAutoLoginService> _logger;

        public RocketChatAutoLoginService(
            IRocketChatUserService userService,
            IRocketChatAuthService authService,
           IOptions<RocketChatConfig> config,
            ILogger<RocketChatAutoLoginService> logger)
        {
            _userService = userService;
            _authService = authService;
            _config = config.Value;
            _logger = logger;
        }

        public async Task<AuthTokenDto> GetLoginTokenAsync(int userId)
        {
            try
            {
                // Get user mapping
                var mapping = await _userService.GetUserMapping(userId);
                if (mapping == null)
                {
                    throw new Exception($"User {userId} is not synced to Rocket.Chat");
                }

                // Extract password from metadata
                string? password = null;
                if (!string.IsNullOrWhiteSpace(mapping.Metadata))
                {
                    try
                    {
                        var metadata = JsonConvert.DeserializeObject<dynamic>(mapping.Metadata);
                        password = metadata?.password?.ToString();
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to parse metadata for user {UserId}", userId);
                    }
                }

                if (string.IsNullOrWhiteSpace(password))
                {
                    throw new Exception($"Password not found in metadata for user {userId}. User needs to be re-synced.");
                }

                // Login to Rocket.Chat with stored credentials
                var token = await _authService.LoginAsync(mapping.RocketUsername, password);

                _logger.LogInformation("Generated auto-login token for user {UserId} - {Username}",
                    userId, mapping.RocketUsername);

                return token;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting login token for user {UserId}", userId);
                throw;
            }
        }

        public async Task<string> GetAutoLoginUrlAsync(int userId, string redirectPath = "/home")
        {
            try
            {
                var token = await GetLoginTokenAsync(userId);

                // Rocket.Chat supports resumeToken for auto-login
                var url = $"{_config.BaseUrl}{redirectPath}?resumeToken={token.AuthToken}";

                return url;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating auto-login URL for user {UserId}", userId);
                throw;
            }
        }
    }
}

