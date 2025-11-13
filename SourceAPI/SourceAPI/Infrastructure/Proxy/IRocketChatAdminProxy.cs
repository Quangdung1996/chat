using Refit;
using SourceAPI.Models.RocketChat.DTOs;
using System.Threading.Tasks;

namespace SourceAPI.Infrastructure.Proxy;

public interface IRocketChatAdminProxy
{
    // =====================================================
    // Users Management (Admin)
    // =====================================================

    [Post("/api/v1/users.create")]
    Task<CreateUserResponse> CreateUserAsync([Body] CreateUserRequest request);

    [Get("/api/v1/users.info")]
    Task<UserInfoResponse> GetUserInfoAsync([Query] string username);

    [Get("/api/v1/users.info")]
    Task<UserInfoResponse> GetUserInfoByIdAsync([Query("userId")] string userId);

    [Get("/api/v1/users.list")]
    Task<UsersListResponse> GetUsersListAsync([Query] int count = 100, [Query] int offset = 0);

    [Post("/api/v1/users.setActiveStatus")]
    Task<ApiResponse> SetUserActiveStatusAsync([Body] SetUserActiveStatusRequest request);

    // =====================================================
    // Rooms/Channels Management (Admin)
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

    [Post("/api/v1/groups.addOwner")]
    Task<ApiResponse> AddGroupOwnerAsync([Body] ModeratorRequest request);

    [Post("/api/v1/groups.removeOwner")]
    Task<ApiResponse> RemoveGroupOwnerAsync([Body] ModeratorRequest request);

    [Post("/api/v1/groups.rename")]
    Task<ApiResponse> RenameGroupAsync([Body] RenameRoomRequest request);

    [Post("/api/v1/channels.rename")]
    Task<ApiResponse> RenameChannelAsync([Body] RenameRoomRequest request);

    [Post("/api/v1/groups.setTopic")]
    Task<ApiResponse> SetGroupTopicAsync([Body] SetTopicRequest request);

    [Post("/api/v1/channels.setTopic")]
    Task<ApiResponse> SetChannelTopicAsync([Body] SetTopicRequest request);

    [Post("/api/v1/groups.setAnnouncement")]
    Task<ApiResponse> SetGroupAnnouncementAsync([Body] SetAnnouncementRequest request);

    [Post("/api/v1/channels.setAnnouncement")]
    Task<ApiResponse> SetChannelAnnouncementAsync([Body] SetAnnouncementRequest request);

    [Post("/api/v1/groups.setReadOnly")]
    Task<ApiResponse> SetGroupReadOnlyAsync([Body] SetReadOnlyRequest request);

    [Post("/api/v1/channels.setReadOnly")]
    Task<ApiResponse> SetChannelReadOnlyAsync([Body] SetReadOnlyRequest request);

    [Post("/api/v1/groups.archive")]
    Task<ApiResponse> ArchiveGroupAsync([Body] RoomActionRequest request);

    [Post("/api/v1/channels.archive")]
    Task<ApiResponse> ArchiveChannelAsync([Body] RoomActionRequest request);

    [Post("/api/v1/groups.delete")]
    Task<ApiResponse> DeleteGroupAsync([Body] RoomActionRequest request);

    [Post("/api/v1/channels.delete")]
    Task<ApiResponse> DeleteChannelAsync([Body] RoomActionRequest request);

    // =====================================================
    // Messages (Admin can post/delete any message)
    // =====================================================

    [Post("/api/v1/chat.postMessage")]
    Task<PostMessageResponse> PostMessageAsync([Body] PostMessageRequest request);

    [Get("/api/v1/chat.getMessage")]
    Task<MessageResponse> GetMessageAsync([Query] string msgId);

    [Post("/api/v1/chat.delete")]
    Task<ApiResponse> DeleteMessageAsync([Body] DeleteMessageRequest request);

    // Get messages from room
    [Get("/api/v1/groups.messages")]
    Task<RoomMessagesResponse> GetGroupMessagesAsync([Query] string roomId, [Query] int count = 50, [Query] int offset = 0);

    [Get("/api/v1/channels.messages")]
    Task<RoomMessagesResponse> GetChannelMessagesAsync([Query] string roomId, [Query] int count = 50, [Query] int offset = 0);

    [Get("/api/v1/im.messages")]
    Task<RoomMessagesResponse> GetDirectMessagesAsync([Query] string roomId, [Query] int count = 50, [Query] int offset = 0);

    // =====================================================
    // Get room members (Admin)
    // =====================================================

    [Get("/api/v1/groups.members?roomId={roomId}")]
    Task<RoomMembersResponse> GetGroupMembersAsync(string roomId);

    [Get("/api/v1/channels.members?roomId={roomId}")]
    Task<RoomMembersResponse> GetChannelMembersAsync(string roomId);

    [Get("/api/v1/im.members?roomId={roomId}")]
    Task<RoomMembersResponse> GetDirectMessageMembersAsync(string roomId);
}

