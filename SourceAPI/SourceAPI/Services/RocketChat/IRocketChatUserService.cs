using SourceAPI.Core.Data.RocketChatData;
using SourceAPI.Models.RocketChat.DTOs;
using System.Threading.Tasks;

namespace SourceAPI.Services.RocketChat
{
    /// <summary>
    /// T-08: RocketChat User Service Interface
    /// Handles user creation, sync, and mapping
    /// </summary>
    public interface IRocketChatUserService
    {
        /// <summary>
        /// Create user in Rocket.Chat
        /// Username is required (from OAuth2), email is optional
        /// </summary>
        Task<CreateUserResponse> CreateUserAsync(string username, string fullName, string? email = null, string? password = null);

        /// <summary>
        /// Sync user from internal system to Rocket.Chat
        /// Creates user if not exists, updates if exists
        /// Username is required (from OAuth2), email is optional
        /// </summary>
        Task<SyncUserResponse> SyncUserAsync(int userId, string username, string fullName, string? email = null);

        /// <summary>
        /// Check if user exists in Rocket.Chat by username
        /// </summary>
        Task<bool> UserExistsAsync(string username);

        /// <summary>
        /// Get mapping for internal user ID
        /// </summary>
        Task<UserRocketChatMapping?> GetMappingAsync(int userId);

        /// <summary>
        /// Get mapping by Rocket.Chat user ID
        /// </summary>
        Task<UserRocketChatMapping?> GetMappingByRocketUserIdAsync(string rocketUserId);

        /// <summary>
        /// Get users from Rocket.Chat directly (for directory/contacts)
        /// </summary>
        Task<System.Collections.Generic.List<DTOs.RocketChatUser>> GetRocketChatUsersAsync(int count = 100, int offset = 0);

        /// <summary>
        /// Update user active status
        /// </summary>
        Task<bool> SetUserActiveStatusAsync(int userId, bool isActive);
    }
}

