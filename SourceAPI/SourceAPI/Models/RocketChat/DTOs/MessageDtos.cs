using Newtonsoft.Json;
using System.Collections.Generic;

namespace SourceAPI.Models.RocketChat.DTOs;

/// <summary>
/// Request to post a message
/// </summary>
public class PostMessageRequest
{
    [JsonProperty("roomId")]
    public string RoomId { get; set; } = string.Empty;

    [JsonProperty("text")]
    public string Text { get; set; } = string.Empty;
}

/// <summary>
/// Response from posting a message
/// </summary>
public class PostMessageResponse : ApiResponse
{
    [JsonProperty("message")]
    public MessageData Message { get; set; } = new();
}

/// <summary>
/// Request to delete a message
/// </summary>
public class DeleteMessageRequest
{
    public string RoomId { get; set; } = string.Empty;
    public string MsgId { get; set; } = string.Empty;
}

/// <summary>
/// Generic message response
/// </summary>
public class MessageResponse : ApiResponse
{
    public MessageData Message { get; set; } = new();
}

/// <summary>
/// Message data from Rocket.Chat
/// </summary>
public class MessageData
{
    [JsonProperty("_id")]
    public string Id { get; set; } = string.Empty;
    
    [JsonProperty("rid")]
    public string Rid { get; set; } = string.Empty;
    
    [JsonProperty("msg")]
    public string Msg { get; set; } = string.Empty;
}

/// <summary>
/// Response for room messages
/// </summary>
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

/// <summary>
/// Message from a room
/// </summary>
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
    
    [JsonProperty("isCurrentUser")]
    public bool IsCurrentUser { get; set; } = false;
}

/// <summary>
/// User info in a room message
/// </summary>
public class RoomMessageUser
{
    [JsonProperty("_id")]
    public string Id { get; set; } = string.Empty;
    
    [JsonProperty("username")]
    public string Username { get; set; } = string.Empty;
    
    [JsonProperty("name")]
    public string Name { get; set; } = string.Empty;
}

