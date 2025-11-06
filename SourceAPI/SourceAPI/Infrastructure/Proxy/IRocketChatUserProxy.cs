using Refit;
using SourceAPI.Models.RocketChat.DTOs;
using System.Threading.Tasks;

namespace SourceAPI.Infrastructure.Proxy;

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
    Task<RoomMessagesResponse> GetGroupMessagesAsync([Query] string roomId, [Query] int count = 50, [Query] int offset = 0, [Query] string sort = "%7B%22ts%22%3A-1%7D");

    [Get("/api/v1/channels.messages")]
    Task<RoomMessagesResponse> GetChannelMessagesAsync([Query] string roomId, [Query] int count = 50, [Query] int offset = 0);

    [Get("/api/v1/im.messages")]
    Task<RoomMessagesResponse> GetDirectMessagesAsync([Query] string roomId, [Query] int count = 50, [Query] int offset = 0);

    // =====================================================
    // Threads
    // =====================================================
    
    [Get("/api/v1/chat.getThreadMessages")]
    Task<RoomMessagesResponse> GetThreadMessagesAsync([Query] string tmid, [Query] int count = 50, [Query] int offset = 0);

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

    [Post("/api/v1/groups.leave")]
    Task<ApiResponse> LeaveGroupAsync([Body] LeaveRoomRequest request);

    [Post("/api/v1/channels.leave")]
    Task<ApiResponse> LeaveChannelAsync([Body] LeaveRoomRequest request);
    [Get("/api/v1/groups.info")]
    Task<RoomInfoResponse> GetGroupInfoAsync([Query] string roomId);

    [Get("/api/v1/channels.info")]
    Task<RoomInfoResponse> GetChannelInfoAsync([Query] string roomId);

    // =====================================================
    // Set room topic/description and announcement
    // =====================================================

    [Post("/api/v1/groups.setTopic")]
    Task<ApiResponse> SetGroupTopicAsync([Body] SetTopicRequest request);

    [Post("/api/v1/channels.setTopic")]
    Task<ApiResponse> SetChannelTopicAsync([Body] SetTopicRequest request);

    [Post("/api/v1/groups.setAnnouncement")]
    Task<ApiResponse> SetGroupAnnouncementAsync([Body] SetAnnouncementRequest request);

    [Post("/api/v1/channels.setAnnouncement")]
    Task<ApiResponse> SetChannelAnnouncementAsync([Body] SetAnnouncementRequest request);

    // =====================================================
    // File Upload
    // =====================================================

    [Multipart]
    [Post("/api/v1/rooms.upload/{roomId}")]
    Task<UploadFileResponse> UploadFileAsync(
        string roomId,
        [AliasAs("file")] StreamPart file,
        [AliasAs("description")] string? description = null,
        [AliasAs("msg")] string? msg = null);
}

