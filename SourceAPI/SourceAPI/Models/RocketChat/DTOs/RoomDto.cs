using System.Collections.Generic;

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
        public string RoomId { get; set; } = string.Empty;
        public string GroupCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public bool Success { get; set; }
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
}

