using Newtonsoft.Json;
using System;
using System.Collections.Generic;

namespace SourceAPI.Models.RocketChat.DTOs;

#region Room Requests

public class CreateGroupRequest
{
    public string Name { get; set; } = string.Empty;
    public string GroupCode { get; set; } = string.Empty;
    public int? DepartmentId { get; set; }
    public int? ProjectId { get; set; }
    public string? Topic { get; set; }
    public string? Announcement { get; set; }
    public bool IsPrivate { get; set; } = true;
    public bool IsReadOnly { get; set; } = false;
    public List<string> Members { get; set; } = new();
}

public class CreateRoomRequest
{
    [JsonProperty("name")]
    public string Name { get; set; } = string.Empty;
    [JsonProperty("members")]
    public List<string> Members { get; set; } = new();
    [JsonProperty("readOnly")]
    public bool ReadOnly { get; set; }
}

public class InviteMemberRequest
{
    [JsonProperty("roomId")]
    public string RoomId { get; set; } = string.Empty;
    [JsonProperty("userId")]
    public string UserId { get; set; } = string.Empty;
}

public class RemoveMemberRequest
{
    [JsonProperty("roomId")]
    public string RoomId { get; set; } = string.Empty;
    [JsonProperty("userId")]
    public string UserId { get; set; } = string.Empty;
}

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

public class RenameRoomRequest
{
    public string RoomId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

public class SetTopicRequest
{
    [JsonProperty("roomId")]
    public string RoomId { get; set; } = string.Empty;

    [JsonProperty("topic")]
    public string Topic { get; set; } = string.Empty;
}

public class SetAnnouncementRequest
{
    [JsonProperty("roomId")]
    public string RoomId { get; set; } = string.Empty;

    [JsonProperty("announcement")]
    public string Announcement { get; set; } = string.Empty;
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

public class CreateDMRequest
{
    [JsonProperty("username")]
    public string Username { get; set; } = string.Empty;
}

#endregion

#region Room Responses

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

public class RocketChatGroupResponse
{
    public bool Success { get; set; }
    public GroupData Group { get; set; } = new();
    public string Error { get; set; } = string.Empty;
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
    [JsonProperty("group")]
    public RoomData Group { get; set; } = new();
    [JsonProperty("channel")]
    public RoomData Channel { get; set; } = new();
}

public class CreateDMResponse : ApiResponse
{
    public DMRoomData Room { get; set; } = new();
}

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

public class UserSubscriptionsResponse : ApiResponse
{
    [JsonProperty("update")]
    public List<SubscriptionData> Update { get; set; } = new();

    [JsonProperty("remove")]
    public List<SubscriptionData> Remove { get; set; } = new();
}

public class UserRoomsResponse : ApiResponse
{
    [JsonProperty("update")]
    public List<RoomData> Update { get; set; } = new();

    [JsonProperty("remove")]
    public List<RoomData> Remove { get; set; } = new();
}

#endregion

#region Room Data Models

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

    // TODO: Re-enable after verifying Rocket.Chat tunread format
    /// <summary>
    /// Thread unread notifications
    /// Format: [{ "_id": "threadId", "unread": count }]
    /// Note: This field may not always be present in Rocket.Chat responses
    /// </summary>
    [JsonProperty("tunread", NullValueHandling = NullValueHandling.Ignore)]
    public List<ThreadUnreadData> Tunread { get; set; }
}

// TODO: Re-enable after verifying Rocket.Chat tunread format
// /// <summary>
// /// Thread unread data from Rocket.Chat subscription
// /// </summary>
public class ThreadUnreadData
{
    [JsonProperty("_id")]
    public string ThreadId { get; set; } = string.Empty;

    [JsonProperty("unread")]
    public int Unread { get; set; }
}

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
    [JsonProperty("topic")]
    public string? Topic { get; set; }

    [JsonProperty("announcement")]
    public string? Announcement { get; set; }
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

    [JsonProperty("topic")]
    public string? Topic { get; set; }

    [JsonProperty("announcement")]
    public string? Announcement { get; set; }

    [JsonProperty("sysMes")]
    public bool SystemMessages { get; set; }

    [JsonProperty("_updatedAt")]
    public DateTime UpdatedAt { get; set; }
    [JsonProperty("u")]
    public RocketChatUserInfo ChatUserInfo { get; set; }
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

public class UserInfo
{
    [JsonProperty("_id")]
    public string Id { get; set; } = string.Empty;

    [JsonProperty("username")]
    public string Username { get; set; } = string.Empty;

    [JsonProperty("name")]
    public string Name { get; set; } = string.Empty;
}

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

