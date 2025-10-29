using System.Collections.Generic;
using Newtonsoft.Json;

namespace SourceAPI.Models.RocketChat.DTOs
{
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
}

