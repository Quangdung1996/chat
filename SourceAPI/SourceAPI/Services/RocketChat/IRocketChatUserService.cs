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
        /// </summary>
        Task<CreateUserResponse> CreateUserAsync(string email, string fullName, string? username = null, string? password = null);

        /// <summary>
        /// Sync user from internal system to Rocket.Chat
        /// Creates user if not exists, updates if exists
        /// </summary>
        Task<SyncUserResponse> SyncUserAsync(int userId, string email, string fullName);

        /// <summary>
        /// Check if user exists in Rocket.Chat by username
        /// </summary>
        Task<bool> UserExistsAsync(string username);

        /// <summary>
        /// Get mapping for internal user ID
        /// </summary>
        Task<Data.Entities.UserRocketChatMapping?> GetMappingAsync(int userId);

        /// <summary>
        /// Get mapping by Rocket.Chat user ID
        /// </summary>
        Task<Data.Entities.UserRocketChatMapping?> GetMappingByRocketUserIdAsync(string rocketUserId);

        /// <summary>
        /// Update user active status
        /// </summary>
        Task<bool> SetUserActiveStatusAsync(int userId, bool isActive);
    }
}

