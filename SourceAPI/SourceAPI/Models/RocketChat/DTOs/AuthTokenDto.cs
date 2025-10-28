using System;

namespace SourceAPI.Models.RocketChat.DTOs
{
    /// <summary>
    /// Rocket.Chat authentication token
    /// </summary>
    public class AuthTokenDto
    {
        public string AuthToken { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    }

    /// <summary>
    /// Login response from Rocket.Chat
    /// </summary>
    public class RocketChatLoginResponse
    {
        public string Status { get; set; } = string.Empty;
        public LoginData Data { get; set; } = new();
        public bool Success { get; set; }
    }

    public class LoginData
    {
        public string UserId { get; set; } = string.Empty;
        public string AuthToken { get; set; } = string.Empty;
        public TokenMeta Me { get; set; } = new();
    }

    public class TokenMeta
    {
        public string Id { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
    }
}

