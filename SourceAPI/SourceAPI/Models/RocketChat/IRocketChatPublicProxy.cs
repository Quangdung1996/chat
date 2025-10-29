using Refit;
using SourceAPI.Models.RocketChat.DTOs;
using System.Threading.Tasks;

namespace SourceAPI.Models.RocketChat
{
    /// <summary>
    /// Refit interface for RocketChat REST API - Public Operations
    /// NO authentication required (no auth handler attached)
    /// Used for login, public endpoints, etc.
    /// </summary>
    public interface IRocketChatPublicProxy
    {
        /// <summary>
        /// Login to get auth token
        /// Public endpoint - no authentication required
        /// </summary>
        [Post("/api/v1/login")]
        Task<RocketChatLoginResponse> LoginAsync([Body] LoginRequest request);

        /// <summary>
        /// Logout (invalidate token)
        /// </summary>
        [Post("/api/v1/logout")]
        Task<ApiResponse> LogoutAsync();
    }
}

