using SourceAPI.Infrastructure.Proxy;
using SourceAPI.Models.RocketChat;
using SourceAPI.Models.RocketChat.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SourceAPI.Services.RocketChat
{
    /// <summary>
    /// T-17, T-18, T-19b: RocketChat Room Service Interface
    /// Handles creation and management of groups and channels
    /// </summary>
    public interface IRocketChatRoomService
    {
        /// <summary>
        /// T-17: Create private group
        /// DoD: Tạo group private; lưu RoomId/Name vào DB; tuỳ chọn readOnly hoạt động
        /// </summary>
        Task<CreateGroupResponse> CreateGroupAsync(CreateGroupRequest request);

        /// <summary>
        /// T-18: Create public channel
        /// DoD: Tạo channel public; lưu mapping; có thể join được
        /// </summary>
        Task<CreateGroupResponse> CreateChannelAsync(CreateGroupRequest request);

        /// <summary>
        /// Create direct message room (1-on-1 chat) as a specific user
        /// Returns existing DM if already exists
        /// </summary>
        Task<string> CreateDirectMessageAsync(int currentUserId, string targetUsername);

        /// <summary>
        /// T-20: Add members to room
        /// </summary>
        Task<bool> AddMemberAsync(string roomId, string rocketUserId, string roomType = "group");

        /// <summary>
        /// T-21: Remove member from room
        /// </summary>
        Task<bool> RemoveMemberAsync(string roomId, string rocketUserId, string roomType = "group");

        /// <summary>
        /// T-22: Add moderator role
        /// </summary>
        Task<bool> AddModeratorAsync(string roomId, string rocketUserId, string roomType = "group");

        /// <summary>
        /// T-22: Remove moderator role
        /// </summary>
        Task<bool> RemoveModeratorAsync(string roomId, string rocketUserId, string roomType = "group");

        /// <summary>
        /// T-22: Add owner role
        /// </summary>
        Task<bool> AddOwnerAsync(string roomId, string rocketUserId, string roomType = "group");

        /// <summary>
        /// T-23: Add multiple members with rate limiting
        /// </summary>
        Task<Dictionary<string, bool>> AddMembersBulkAsync(string roomId, List<string> rocketUserIds, string roomType = "group");

        /// <summary>
        /// T-26: Rename room
        /// </summary>
        Task<bool> RenameRoomAsync(string roomId, string newName, string roomType = "group");

        /// <summary>
        /// T-26: Archive room
        /// </summary>
        Task<bool> ArchiveRoomAsync(string roomId, string roomType = "group");

        /// <summary>
        /// T-26: Delete room
        /// </summary>
        Task<bool> DeleteRoomAsync(string roomId, string roomType = "group");

        /// <summary>
        /// T-25: Set room as announcement-only (readonly)
        /// </summary>
        Task<bool> SetAnnouncementModeAsync(string roomId, bool announcementOnly, string roomType = "group");

        /// <summary>
        /// T-25: Set room topic
        /// </summary>
        Task<bool> SetTopicAsync(string roomId, string topic, string roomType = "group");

        /// <summary>
        /// T-36b: Send message to room
        /// </summary>
        Task<string?> SendMessageAsync(string userId, string roomId, string text, string? alias = null);

        /// <summary>
        /// Get messages from room (real-time from Rocket.Chat)
        /// </summary>
        Task<List<RoomMessage>> GetRoomMessagesAsync(string roomId, string roomType = "group", int count = 50, int offset = 0);

        /// <summary>
        /// Get all rooms user is subscribed to
        /// </summary>
        Task<List<SubscriptionData>> GetUserRoomsAsync(int userId);

        /// <summary>
        /// Get all rooms user is subscribed to using Rocket.Chat token from header
        /// Direct authentication with Rocket.Chat without internal userId mapping
        /// </summary>
        Task<List<SubscriptionData>> GetUserRoomsByTokenAsync(string authToken, string rocketUserId);
    }
}

