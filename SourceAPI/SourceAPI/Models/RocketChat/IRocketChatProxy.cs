using Refit;
using SourceAPI.Models.RocketChat.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SourceAPI.Models.RocketChat
{
    /// <summary>
    /// Refit interface for RocketChat REST API
    /// Auto-generates HTTP client implementation
    /// </summary>
    public interface IRocketChatProxy
    {
        // =====================================================
        // Authentication
        // =====================================================

        [Post("/api/v1/login")]
        Task<RocketChatLoginResponse> LoginAsync([Body] LoginRequest request);

        [Post("/api/v1/logout")]
        Task<ApiResponse> LogoutAsync();

        // =====================================================
        // Users
        // =====================================================

        [Post("/api/v1/users.create")]
        Task<CreateUserResponse> CreateUserAsync([Body] CreateUserRequest request);

        [Get("/api/v1/users.info")]
        Task<UserInfoResponse> GetUserInfoAsync([Query] string username);

        [Get("/api/v1/users.info")]
        Task<UserInfoResponse> GetUserInfoByIdAsync([Query("userId")] string userId);

        // =====================================================
        // Rooms/Channels
        // =====================================================

        [Post("/api/v1/groups.create")]
        Task<CreateRoomResponse> CreatePrivateGroupAsync([Body] CreateRoomRequest request);

        [Post("/api/v1/channels.create")]
        Task<CreateRoomResponse> CreatePublicChannelAsync([Body] CreateRoomRequest request);

        [Get("/api/v1/groups.info")]
        Task<RoomInfoResponse> GetGroupInfoAsync([Query] string roomId);

        [Get("/api/v1/channels.info")]
        Task<RoomInfoResponse> GetChannelInfoAsync([Query] string roomId);

        [Post("/api/v1/groups.invite")]
        Task<ApiResponse> InviteToGroupAsync([Body] InviteMemberRequest request);

        [Post("/api/v1/channels.invite")]
        Task<ApiResponse> InviteToChannelAsync([Body] InviteMemberRequest request);

        [Post("/api/v1/groups.kick")]
        Task<ApiResponse> RemoveFromGroupAsync([Body] RemoveMemberRequest request);

        [Post("/api/v1/channels.kick")]
        Task<ApiResponse> RemoveFromChannelAsync([Body] RemoveMemberRequest request);

        [Post("/api/v1/groups.addModerator")]
        Task<ApiResponse> AddGroupModeratorAsync([Body] ModeratorRequest request);

        [Post("/api/v1/channels.addModerator")]
        Task<ApiResponse> AddChannelModeratorAsync([Body] ModeratorRequest request);

        // =====================================================
        // Messages
        // =====================================================

        [Post("/api/v1/chat.postMessage")]
        Task<PostMessageResponse> PostMessageAsync([Body] PostMessageRequest request);

        [Get("/api/v1/chat.getMessage")]
        Task<MessageResponse> GetMessageAsync([Query] string msgId);

        [Post("/api/v1/chat.delete")]
        Task<ApiResponse> DeleteMessageAsync([Body] DeleteMessageRequest request);
    }

    // =====================================================
    // Request/Response DTOs for Refit
    // =====================================================

    public class LoginRequest
    {
        public string User { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class CreateRoomRequest
    {
        public string Name { get; set; } = string.Empty;
        public List<string> Members { get; set; }
        public bool ReadOnly { get; set; }
    }

    public class InviteMemberRequest
    {
        public string RoomId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
    }

    public class RemoveMemberRequest
    {
        public string RoomId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
    }

    public class ModeratorRequest
    {
        public string RoomId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
    }

    public class PostMessageRequest
    {
        public string RoomId { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
        public string? Alias { get; set; }
    }

    public class DeleteMessageRequest
    {
        public string RoomId { get; set; } = string.Empty;
        public string MsgId { get; set; } = string.Empty;
    }

    public class ApiResponse
    {
        public bool Success { get; set; }
        public string? Error { get; set; }
    }

    public class UserInfoResponse : ApiResponse
    {
        public UserData User { get; set; } = new();
    }

    public class CreateRoomResponse : ApiResponse
    {
        public RoomData Group { get; set; } = new();
        public RoomData Channel { get; set; } = new();
    }

    public class RoomInfoResponse : ApiResponse
    {
        public RoomData Group { get; set; } = new();
        public RoomData Channel { get; set; } = new();
    }

    public class PostMessageResponse : ApiResponse
    {
        public MessageData Message { get; set; } = new();
    }

    public class MessageResponse : ApiResponse
    {
        public MessageData Message { get; set; } = new();
    }

    public class RoomData
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string T { get; set; } = string.Empty; // Type field from RocketChat
        public string Fname { get; set; } = string.Empty; // Full name
    }

    public class MessageData
    {
        public string Id { get; set; } = string.Empty;
        public string Rid { get; set; } = string.Empty;
        public string Msg { get; set; } = string.Empty;
    }
}

