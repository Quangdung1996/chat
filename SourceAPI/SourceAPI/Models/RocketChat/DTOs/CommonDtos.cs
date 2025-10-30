namespace SourceAPI.Models.RocketChat.DTOs;

/// <summary>
/// Base API response from Rocket.Chat
/// </summary>
public class ApiResponse
{
    public bool Success { get; set; }
    public string? Error { get; set; }
}

