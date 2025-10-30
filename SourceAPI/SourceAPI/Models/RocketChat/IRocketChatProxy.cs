using Newtonsoft.Json;
using Refit;
using SourceAPI.Models.RocketChat.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SourceAPI.Models.RocketChat;

public interface IRocketChatProxy
{
    // =====================================================
    // Users
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

    [Post("/api/v1/groups.rename")]
    Task<ApiResponse> RenameGroupAsync([Body] RenameRoomRequest request);

    [Post("/api/v1/channels.rename")]
    Task<ApiResponse> RenameChannelAsync([Body] RenameRoomRequest request);

    [Post("/api/v1/groups.setTopic")]
    Task<ApiResponse> SetGroupTopicAsync([Body] SetTopicRequest request);

    [Post("/api/v1/channels.setTopic")]
    Task<ApiResponse> SetChannelTopicAsync([Body] SetTopicRequest request);

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
    // Direct Messages (DM)
    // =====================================================

    [Post("/api/v1/im.create")]
    Task<CreateDMResponse> CreateDirectMessageAsync([Body] CreateDMRequest request);

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
    [JsonProperty("roomId")]
    public string RoomId { get; set; } = string.Empty;

    [JsonProperty("text")]
    public string Text { get; set; } = string.Empty;
}

public class DeleteMessageRequest
{
    public string RoomId { get; set; } = string.Empty;
    public string MsgId { get; set; } = string.Empty;
}

public class RenameRoomRequest
{
    public string RoomId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

public class SetTopicRequest
{
    public string RoomId { get; set; } = string.Empty;
    public string Topic { get; set; } = string.Empty;
}

public class SetReadOnlyRequest
{
    public string RoomId { get; set; } = string.Empty;
    public bool ReadOnly { get; set; }
}

public class RoomActionRequest
{
    public string RoomId { get; set; } = string.Empty;
}

public class SetUserActiveStatusRequest
{
    public string UserId { get; set; } = string.Empty;
    public bool ActiveStatus { get; set; }
}

public class CreateDMRequest
{
    public string Username { get; set; } = string.Empty;
}

public class CreateDMResponse : ApiResponse
{
    public DMRoomData Room { get; set; } = new();
}

public class DMRoomData
{
    [JsonProperty("_id")]
    public string Id { get; set; } = string.Empty;

    [JsonProperty("rid")]
    public string Rid { get; set; } = string.Empty;

    [JsonProperty("t")]
    public string T { get; set; } = string.Empty; // "d" for direct message
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
    [JsonProperty("room")]
    public RoomInfo Room { get; set; } = null!;
    public RoomData Group { get; set; } = new();
    public RoomData Channel { get; set; } = new();
}

public class RoomInfo
{
    [JsonProperty("_id")]
    public string Id { get; set; } = string.Empty;

    [JsonProperty("name")]
    public string? Name { get; set; }

    [JsonProperty("fname")]
    public string? FullName { get; set; }

    [JsonProperty("t")]
    public string Type { get; set; } = string.Empty; // c=channel, p=private, d=direct

    [JsonProperty("msgs")]
    public int MessageCount { get; set; }

    [JsonProperty("usersCount")]
    public int UsersCount { get; set; }

    [JsonProperty("default")]
    public bool IsDefault { get; set; }

    [JsonProperty("ro")]
    public bool ReadOnly { get; set; }

    [JsonProperty("sysMes")]
    public bool SystemMessages { get; set; }

    [JsonProperty("_updatedAt")]
    public DateTime UpdatedAt { get; set; }
}
public class PostMessageResponse : ApiResponse
{
    [JsonProperty("message")]
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
    [JsonProperty("_id")]
    public string Id { get; set; } = string.Empty;
    [JsonProperty("rid")]
    public string Rid { get; set; } = string.Empty;
    [JsonProperty("msg")]
    public string Msg { get; set; } = string.Empty;
}