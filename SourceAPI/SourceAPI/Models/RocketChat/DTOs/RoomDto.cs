using Newtonsoft.Json;
using System;
using System.Collections.Generic;

namespace SourceAPI.Models.RocketChat.DTOs;

#region Room Requests

/// <summary>
/// Request to create a group/channel
/// </summary>
public class CreateGroupRequest
{
    public string Name { get; set; } = string.Empty;
    public string GroupCode { get; set; } = string.Empty;
    public int? DepartmentId { get; set; }
    public int? ProjectId { get; set; }
    public string Description { get; set; } = string.Empty;
    public bool IsPrivate { get; set; } = true;
    public bool IsReadOnly { get; set; } = false;
    public List<string> Members { get; set; } = new();
}

/// <summary>
/// Request to create a room (general purpose)
/// </summary>
public class CreateRoomRequest
{
    [JsonProperty("name")]
    public string Name { get; set; } = string.Empty;
    [JsonProperty("members")]
    public List<string> Members { get; set; } = new();
    [JsonProperty("readOnly")]
    public bool ReadOnly { get; set; }
}

/// <summary>
/// Request to invite member to room
/// </summary>
public class InviteMemberRequest
{
    [JsonProperty("roomId")]
    public string RoomId { get; set; } = string.Empty;
    [JsonProperty("userId")]
    public string UserId { get; set; } = string.Empty;
}

/// <summary>
/// Request to remove member from room
/// </summary>
public class RemoveMemberRequest
{
    [JsonProperty("roomId")]
    public string RoomId { get; set; } = string.Empty;
    [JsonProperty("userId")]
    public string UserId { get; set; } = string.Empty;
}

/// <summary>
/// Request to add/remove moderator
/// </summary>
public class ModeratorRequest
{
    [JsonProperty("roomId")]
    public string RoomId { get; set; } = string.Empty;
    [JsonProperty("userId")]
    public string UserId { get; set; } = string.Empty;
}

public class LeaveRoomRequest
{
    [JsonProperty("roomId")]
    public string RoomId { get; set; } = string.Empty;
}

/// <summary>
/// Request to rename a room
/// </summary>
public class RenameRoomRequest
{
    public string RoomId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

/// <summary>
/// Request to set room topic
/// </summary>
public class SetTopicRequest
{
    public string RoomId { get; set; } = string.Empty;
    public string Topic { get; set; } = string.Empty;
}

/// <summary>
/// Request to set room read-only status
/// </summary>
public class SetReadOnlyRequest
{
    public string RoomId { get; set; } = string.Empty;
    public bool ReadOnly { get; set; }
}

/// <summary>
/// Generic room action request
/// </summary>
public class RoomActionRequest
{
    public string RoomId { get; set; } = string.Empty;
}

/// <summary>
/// Request to create a direct message
/// </summary>
public class CreateDMRequest
{
    public string Username { get; set; } = string.Empty;
}

#endregion

#region Room Responses

/// <summary>
/// Response from create group
/// </summary>
public class CreateGroupResponse
{
    [JsonProperty("roomId")]
    public string RoomId { get; set; } = string.Empty;

    [JsonProperty("groupCode")]
    public string GroupCode { get; set; } = string.Empty;

    [JsonProperty("name")]
    public string Name { get; set; } = string.Empty;

    [JsonProperty("success")]
    public bool Success { get; set; }

    [JsonProperty("message")]
    public string Message { get; set; } = string.Empty;
}

/// <summary>
/// Rocket.Chat API response for group creation
/// </summary>
public class RocketChatGroupResponse
{
    public bool Success { get; set; }
    public GroupData Group { get; set; } = new();
    public string Error { get; set; } = string.Empty;
}

/// <summary>
/// Response from create room
/// </summary>
public class CreateRoomResponse : ApiResponse
{
    public RoomData Group { get; set; } = new();
    public RoomData Channel { get; set; } = new();
}

/// <summary>
/// Response from room info request
/// </summary>
public class RoomInfoResponse : ApiResponse
{
    [JsonProperty("room")]
    public RoomInfo Room { get; set; } = null!;
    [JsonProperty("group")]
    public RoomData Group { get; set; } = new();
    [JsonProperty("channel")]
    public RoomData Channel { get; set; } = new();
}

/// <summary>
/// Response from create DM request
/// </summary>
public class CreateDMResponse : ApiResponse
{
    public DMRoomData Room { get; set; } = new();
}

/// <summary>
/// Response from user info request
/// </summary>
public class UserInfoResponse : ApiResponse
{
    public UserData User { get; set; } = new();
}

public class GroupData
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool ReadOnly { get; set; }
}

/// <summary>
/// Response from GET /api/v1/subscriptions.get
/// Returns all rooms user is subscribed to
/// </summary>
public class UserSubscriptionsResponse : ApiResponse
{
    [JsonProperty("update")]
    public List<SubscriptionData> Update { get; set; } = new();

    [JsonProperty("remove")]
    public List<SubscriptionData> Remove { get; set; } = new();
}

/// <summary>
/// Response from GET /api/v1/rooms.get
/// Returns all rooms user is participating in
/// </summary>
public class UserRoomsResponse : ApiResponse
{
    [JsonProperty("update")]
    public List<RoomData> Update { get; set; } = new();

    [JsonProperty("remove")]
    public List<RoomData> Remove { get; set; } = new();
}

#endregion

#region Room Data Models

/// <summary>
/// User's subscription to a room
/// </summary>
public class SubscriptionData
{
    [JsonProperty("_id")]
    public string Id { get; set; } = string.Empty;

    [JsonProperty("rid")]
    public string RoomId { get; set; } = string.Empty;

    [JsonProperty("name")]
    public string Name { get; set; } = string.Empty;

    [JsonProperty("fname")]
    public string FullName { get; set; } = string.Empty;

    [JsonProperty("t")]
    public string Type { get; set; } = string.Empty; // "d" = DM, "p" = private group, "c" = public channel

    [JsonProperty("u")]
    public UserInfo User { get; set; } = new();

    [JsonProperty("unread")]
    public int UnreadCount { get; set; }

    [JsonProperty("alert")]
    public bool Alert { get; set; }

    [JsonProperty("open")]
    public bool Open { get; set; }

    [JsonProperty("_updatedAt")]
    public DateTime? UpdatedAt { get; set; }

    [JsonProperty("ls")]
    public DateTime? LastSeen { get; set; }

    [JsonProperty("lastMessage")]
    public MessageData? LastMessage { get; set; }
}

/// <summary>
/// Room data
/// </summary>
public class RoomData
{
    [JsonProperty("_id")]
    public string Id { get; set; } = string.Empty;

    [JsonProperty("name")]
    public string Name { get; set; } = string.Empty;

    [JsonProperty("fname")]
    public string FullName { get; set; } = string.Empty;

    [JsonProperty("t")]
    public string Type { get; set; } = string.Empty; // "d" = DM, "p" = private group, "c" = public channel

    [JsonProperty("msgs")]
    public int MessageCount { get; set; }

    [JsonProperty("usersCount")]
    public int UsersCount { get; set; }

    [JsonProperty("ts")]
    public string Timestamp { get; set; } = string.Empty;

    [JsonProperty("ro")]
    public bool ReadOnly { get; set; }
    [JsonProperty("u")]
    public RocketChatUserInfo ChatUserInfo { get; set; }

    [JsonProperty("description")]
    public string? Description { get; set; }
}

/// <summary>
/// Detailed room information
/// </summary>
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

    [JsonProperty("description")]
    public string? Description { get; set; }

    [JsonProperty("sysMes")]
    public bool SystemMessages { get; set; }

    [JsonProperty("_updatedAt")]
    public DateTime UpdatedAt { get; set; }
    [JsonProperty("u")]
    public RocketChatUserInfo ChatUserInfo { get; set; }
}

/// <summary>
/// DM room data
/// </summary>
public class DMRoomData
{
    [JsonProperty("_id")]
    public string Id { get; set; } = string.Empty;

    [JsonProperty("rid")]
    public string Rid { get; set; } = string.Empty;

    [JsonProperty("t")]
    public string T { get; set; } = string.Empty; // "d" for direct message
}

public class UserInfo
{
    [JsonProperty("_id")]
    public string Id { get; set; } = string.Empty;

    [JsonProperty("username")]
    public string Username { get; set; } = string.Empty;

    [JsonProperty("name")]
    public string Name { get; set; } = string.Empty;
}

/// <summary>
/// Response from groups.members, channels.members, or im.members
/// </summary>
public class RoomMembersResponse : ApiResponse
{
    [JsonProperty("members")]
    public List<RoomMemberData> Members { get; set; } = new();

    [JsonProperty("count")]
    public int Count { get; set; }

    [JsonProperty("offset")]
    public int Offset { get; set; }

    [JsonProperty("total")]
    public int Total { get; set; }
}

/// <summary>
/// Member information in a room
/// </summary>
public class RoomMemberData
{
    [JsonProperty("_id")]
    public string Id { get; set; } = string.Empty;

    [JsonProperty("username")]
    public string Username { get; set; } = string.Empty;

    [JsonProperty("name")]
    public string Name { get; set; } = string.Empty;

    [JsonProperty("status")]
    public string Status { get; set; } = string.Empty; // "online", "away", "busy", "offline"

    [JsonProperty("roles")]
    public List<string> Roles { get; set; } = new(); // ["owner", "moderator", "member"]
}

#endregion

