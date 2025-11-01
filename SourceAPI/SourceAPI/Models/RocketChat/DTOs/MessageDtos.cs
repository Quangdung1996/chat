using Newtonsoft.Json;
using System.Collections.Generic;

namespace SourceAPI.Models.RocketChat.DTOs;

public class PostMessageRequest
{
    [JsonProperty("roomId")]
    public string RoomId { get; set; } = string.Empty;

    [JsonProperty("text")]
    public string Text { get; set; } = string.Empty;
}

public class PostMessageResponse : ApiResponse
{
    [JsonProperty("message")]
    public MessageData Message { get; set; } = new();
}

public class DeleteMessageRequest
{
    public string RoomId { get; set; } = string.Empty;
    public string MsgId { get; set; } = string.Empty;
}

public class MessageResponse : ApiResponse
{
    public MessageData Message { get; set; } = new();
}

public class MessageData
{
    [JsonProperty("_id")]
    public string Id { get; set; } = string.Empty;
    
    [JsonProperty("rid")]
    public string Rid { get; set; } = string.Empty;
    
    [JsonProperty("msg")]
    public string Msg { get; set; } = string.Empty;
    
    [JsonProperty("u")]
    public RoomMessageUser? U { get; set; }
    
    [JsonProperty("ts")]
    public System.DateTime? Ts { get; set; }
    
    [JsonProperty("_updatedAt")]
    public System.DateTime? UpdatedAt { get; set; }
}

public class RoomMessagesResponse : ApiResponse
{
    [JsonProperty("messages")]
    public List<RoomMessage> Messages { get; set; } = new();
    
    [JsonProperty("count")]
    public int Count { get; set; }
    
    [JsonProperty("offset")]
    public int Offset { get; set; }
    
    [JsonProperty("total")]
    public int Total { get; set; }
}

public class RoomMessage
{
    [JsonProperty("_id")]
    public string Id { get; set; } = string.Empty;
    
    [JsonProperty("rid")]
    public string Rid { get; set; } = string.Empty; // Room ID
    
    [JsonProperty("msg")]
    public string Msg { get; set; } = string.Empty; // Message text
    
    [JsonProperty("ts")]
    public System.DateTime Ts { get; set; } // Timestamp
    
    [JsonProperty("u")]
    public RoomMessageUser U { get; set; } = new(); // User info
    
    [JsonProperty("t")]
    public string? T { get; set; } // Message type: null=normal, "au"=added user, "ru"=removed user, "uj"=joined, "ul"=left
    
    [JsonProperty("isCurrentUser")]
    public bool IsCurrentUser { get; set; } = false;
}

public class RoomMessageUser
{
    [JsonProperty("_id")]
    public string Id { get; set; } = string.Empty;
    
    [JsonProperty("username")]
    public string Username { get; set; } = string.Empty;
    
    [JsonProperty("name")]
    public string Name { get; set; } = string.Empty;
}

