using SourceAPI.Models.RocketChat.DTOs;
using System.Threading.Tasks;

namespace SourceAPI.Services.RocketChat
{
    /// <summary>
    /// Service for auto-login users to Rocket.Chat
    /// </summary>
    public interface IRocketChatAutoLoginService
    {
        /// <summary>
        /// Get Rocket.Chat login token for a user
        /// Allows seamless login to Rocket.Chat without password
        /// </summary>
        Task<AuthTokenDto> GetLoginTokenAsync(int userId);

        /// <summary>
        /// Get Rocket.Chat iframe URL with auto-login token
        /// </summary>
        Task<string> GetAutoLoginUrlAsync(int userId, string redirectPath = "/home");
    }
}

