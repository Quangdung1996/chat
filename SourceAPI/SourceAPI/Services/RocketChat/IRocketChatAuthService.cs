using SourceAPI.Models.RocketChat.DTOs;
using System.Threading.Tasks;

namespace SourceAPI.Services.RocketChat
{
    /// <summary>
    /// T-01: RocketChat Authentication Service Interface
    /// Handles login, logout, token management and validation
    /// </summary>
    public interface IRocketChatAuthService
    {
        /// <summary>
        /// Login to Rocket.Chat and get auth token
        /// </summary>
        Task<AuthTokenDto> LoginAsync(string username, string password);

        /// <summary>
        /// Logout from Rocket.Chat
        /// </summary>
        Task<bool> LogoutAsync(string authToken, string userId);

        /// <summary>
        /// Get current valid token (from cache or login)
        /// </summary>
        Task<AuthTokenDto> GetTokenAsync();

        /// <summary>
        /// Validate if token is still valid
        /// </summary>
        Task<bool> ValidateTokenAsync(string authToken, string userId);

        /// <summary>
        /// Get admin token (automatically handles caching and refresh)
        /// </summary>
        Task<AuthTokenDto> GetAdminTokenAsync();

        /// <summary>
        /// Get bot token (automatically handles caching and refresh)
        /// </summary>
        Task<AuthTokenDto> GetBotTokenAsync();

        /// <summary>
        /// Clear cached tokens
        /// </summary>
        void ClearCache();
    }
}

