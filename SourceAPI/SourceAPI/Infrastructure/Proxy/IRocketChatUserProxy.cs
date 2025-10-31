using Refit;
using SourceAPI.Models.RocketChat.DTOs;
using System.Threading.Tasks;

namespace SourceAPI.Infrastructure.Proxy;

/// <summary>
/// Refit interface for RocketChat REST API - User Operations
/// Uses specific user token (injected via headers when creating instance)
/// Each user should have their own instance with their token
/// </summary>
public interface IRocketChatUserProxy
{
    // =====================================================
    // Direct Messages (User creates DM with their token)
    // =====================================================

    [Post("/api/v1/im.create")]
    Task<CreateDMResponse> CreateDirectMessageAsync([Body] CreateDMRequest request);

    // =====================================================
    // Messages (User sends messages as themselves)
    // =====================================================

    [Post("/api/v1/chat.postMessage")]
    Task<PostMessageResponse> PostMessageAsync([Body] PostMessageRequest request);

    [Get("/api/v1/chat.getMessage")]
    Task<MessageResponse> GetMessageAsync([Query] string msgId);

    [Post("/api/v1/chat.delete")]
    Task<ApiResponse> DeleteMessageAsync([Body] DeleteMessageRequest request);

    // =====================================================
    // User can join/leave rooms
    // =====================================================

    [Post("/api/v1/groups.invite")]
    Task<ApiResponse> InviteToGroupAsync([Body] InviteMemberRequest request);

    [Post("/api/v1/channels.invite")]
    Task<ApiResponse> InviteToChannelAsync([Body] InviteMemberRequest request);

    // =====================================================
    // Get user's subscribed rooms
    // =====================================================

    [Get("/api/v1/subscriptions.get")]
    Task<UserSubscriptionsResponse> GetUserSubscriptionsAsync();

    [Get("/api/v1/rooms.get")]
    Task<UserRoomsResponse> GetUserRoomsAsync();

    [Get("/api/v1/rooms.info?roomId={roomId}")]
    Task<RoomInfoResponse> GetRoomInfoAsync(string roomId);

    // Get messages from room
    [Get("/api/v1/groups.messages")]
    Task<RoomMessagesResponse> GetGroupMessagesAsync([Query] string roomId, [Query] int count = 50, [Query] int offset = 0);

    [Get("/api/v1/channels.messages")]
    Task<RoomMessagesResponse> GetChannelMessagesAsync([Query] string roomId, [Query] int count = 50, [Query] int offset = 0);

    [Get("/api/v1/im.messages")]
    Task<RoomMessagesResponse> GetDirectMessagesAsync([Query] string roomId, [Query] int count = 50, [Query] int offset = 0);

    [Post("/api/v1/groups.create")]
    Task<CreateRoomResponse> CreatePrivateGroupAsync([Body] CreateRoomRequest request);

    // =====================================================
    // Get room members
    // =====================================================

    [Get("/api/v1/groups.members?roomId={roomId}")]
    Task<RoomMembersResponse> GetGroupMembersAsync(string roomId);

    [Get("/api/v1/channels.members?roomId={roomId}")]
    Task<RoomMembersResponse> GetChannelMembersAsync(string roomId);

    [Get("/api/v1/im.members?roomId={roomId}")]
    Task<RoomMembersResponse> GetDirectMessageMembersAsync(string roomId);

    [Post("/api/v1/groups.kick")]
    Task<ApiResponse> RemoveFromGroupAsync([Body] RemoveMemberRequest request);

    [Post("/api/v1/channels.kick")]
    Task<ApiResponse> RemoveFromChannelAsync([Body] RemoveMemberRequest request);

    [Post("/api/v1/groups.addModerator")]
    Task<ApiResponse> AddGroupModeratorAsync([Body] ModeratorRequest request);

    [Post("/api/v1/channels.addModerator")]
    Task<ApiResponse> AddChannelModeratorAsync([Body] ModeratorRequest request);
}

