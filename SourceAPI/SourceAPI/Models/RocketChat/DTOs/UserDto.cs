using Newtonsoft.Json;
using System;
using System.Collections.Generic;

namespace SourceAPI.Models.RocketChat.DTOs;

#region User Requests

/// <summary>
/// DTO for creating user in Rocket.Chat
/// </summary>
public class CreateUserRequest
{
    [JsonProperty("email")]
    public string Email { get; set; } = string.Empty;

    [JsonProperty("name")]
    public string Name { get; set; } = string.Empty;

    [JsonProperty("username")]
    public string Username { get; set; } = string.Empty;

    [JsonProperty("password")]
    public string Password { get; set; } = string.Empty;

    [JsonProperty("verified")]
    public bool Verified { get; set; } = true;

    [JsonProperty("sendWelcomeEmail")]
    public bool SendWelcomeEmail { get; set; } = false;

    [JsonProperty("requirePasswordChange")]
    public bool RequirePasswordChange { get; set; } = false;

    [JsonProperty("active")]
    public bool Active { get; set; } = true;
}

/// <summary>
/// Request to set user active status
/// </summary>
public class SetUserActiveStatusRequest
{
    public string UserId { get; set; } = string.Empty;
    public bool ActiveStatus { get; set; }
}

#endregion

#region User Responses

/// <summary>
/// Response from Rocket.Chat user creation
/// </summary>
public class CreateUserResponse
{
    [JsonProperty("success")]
    public bool Success { get; set; }

    [JsonProperty("user")]
    public UserData User { get; set; } = new();

    [JsonProperty("error")]
    public string Error { get; set; } = string.Empty;

    /// <summary>
    /// True if user already existed in Rocket.Chat, False if newly created
    /// </summary>
    [JsonProperty("isExistingUser")]
    public bool IsExistingUser { get; set; }
}

/// <summary>
/// Response for sync user endpoint
/// </summary>
public class SyncUserResponse
{
    [JsonProperty("userId")]
    public int UserId { get; set; }

    [JsonProperty("rocketUserId")]
    public string RocketUserId { get; set; } = string.Empty;

    [JsonProperty("username")]
    public string Username { get; set; } = string.Empty;

    [JsonProperty("isNewUser")]
    public bool IsNewUser { get; set; }

    [JsonProperty("message")]
    public string Message { get; set; } = string.Empty;
}

/// <summary>
/// Response from Rocket.Chat users.list API
/// </summary>
public class UsersListResponse
{
    [JsonProperty("users")]
    public List<RocketChatUser> Users { get; set; } = new();

    [JsonProperty("count")]
    public int Count { get; set; }

    [JsonProperty("offset")]
    public int Offset { get; set; }

    [JsonProperty("total")]
    public int Total { get; set; }

    [JsonProperty("success")]
    public bool Success { get; set; }
}

#endregion

#region User Data Models

public class UserData
{
    [JsonProperty("id")]
    public string Id { get; set; } = string.Empty;

    [JsonProperty("username")]
    public string Username { get; set; } = string.Empty;

    [JsonProperty("name")]
    public string Name { get; set; } = string.Empty;

    [JsonProperty("email")]
    public string Email { get; set; } = string.Empty;

    [JsonProperty("active")]
    public bool Active { get; set; }

    [JsonProperty("createdAt")]
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Rocket.Chat user from users.list
/// </summary>
public class RocketChatUser
{
    [JsonProperty("_id")]
    public string _id { get; set; } = string.Empty;

    [JsonProperty("username")]
    public string Username { get; set; } = string.Empty;

    [JsonProperty("name")]
    public string Name { get; set; } = string.Empty;

    [JsonProperty("status")]
    public string Status { get; set; } = string.Empty; // online, offline, away, busy

    [JsonProperty("active")]
    public bool Active { get; set; }

    [JsonProperty("type")]
    public string Type { get; set; } = string.Empty; // user, bot

    [JsonProperty("avatarUrl")]
    public string AvatarUrl { get; set; } = string.Empty;
}

public class RocketChatUserInfo
{
    [JsonProperty("_id")]
    public string _id { get; set; } = string.Empty;

    [JsonProperty("username")]
    public string Username { get; set; } = string.Empty;

    [JsonProperty("name")]
    public string Name { get; set; } = string.Empty;
}

#endregion

