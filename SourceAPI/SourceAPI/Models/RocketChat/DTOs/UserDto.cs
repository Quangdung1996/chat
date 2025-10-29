using System;
using System.Collections.Generic;

namespace SourceAPI.Models.RocketChat.DTOs
{
    /// <summary>
    /// DTO for creating user in Rocket.Chat
    /// </summary>
    public class CreateUserRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public bool Verified { get; set; } = true;
        public bool SendWelcomeEmail { get; set; } = false;
        public bool RequirePasswordChange { get; set; } = false;
    }

    /// <summary>
    /// Response from Rocket.Chat user creation
    /// </summary>
    public class CreateUserResponse
    {
        public bool Success { get; set; }
        public UserData User { get; set; } = new();
        public string Error { get; set; } = string.Empty;
        /// <summary>
        /// True if user already existed in Rocket.Chat, False if newly created
        /// </summary>
        public bool IsExistingUser { get; set; }
    }

    public class UserData
    {
        public string Id { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public bool Active { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// Response for sync user endpoint
    /// </summary>
    public class SyncUserResponse
    {
        public int UserId { get; set; }
        public string RocketUserId { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public bool IsNewUser { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    /// <summary>
    /// Response from Rocket.Chat users.list API
    /// </summary>
    public class UsersListResponse
    {
        public List<RocketChatUser> Users { get; set; } = new();
        public int Count { get; set; }
        public int Offset { get; set; }
        public int Total { get; set; }
        public bool Success { get; set; }
    }

    /// <summary>
    /// Rocket.Chat user from users.list
    /// </summary>
    public class RocketChatUser
    {
        public string _id { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty; // online, offline, away, busy
        public bool Active { get; set; }
        public string Type { get; set; } = string.Empty; // user, bot
        public string AvatarUrl { get; set; } = string.Empty;
    }
}

