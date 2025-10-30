using Newtonsoft.Json;
using SourceAPI.Models.RocketChat.DTOs;
using System;
using System.Collections.Generic;

namespace SourceAPI.Models.RocketChat;


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