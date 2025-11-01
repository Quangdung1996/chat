using Microsoft.AspNetCore.Http;

namespace SourceAPI.Services;

/// <summary>
/// Service to access Rocket.Chat authentication context from HTTP headers
/// </summary>
public interface IRocketChatContext
{
    string? RocketChatToken { get; }
    string? RocketChatUserId { get; }
    bool HasRocketChatAuth { get; }
}

/// <summary>
/// Implementation that extracts Rocket.Chat token and userId from HttpContext.Items
/// (populated by RocketChatTokenMiddleware)
/// </summary>
public sealed class RocketChatContext : IRocketChatContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public RocketChatContext(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string? RocketChatToken
    {
        get
        {
            var context = _httpContextAccessor.HttpContext;
            if (context?.Items.TryGetValue("RocketChatToken", out var token) == true)
            {
                return token?.ToString();
            }
            return null;
        }
    }

    public string? RocketChatUserId
    {
        get
        {
            var context = _httpContextAccessor.HttpContext;
            if (context?.Items.TryGetValue("RocketChatUserId", out var userId) == true)
            {
                return userId?.ToString();
            }
            return null;
        }
    }

    public bool HasRocketChatAuth => !string.IsNullOrEmpty(RocketChatToken) && !string.IsNullOrEmpty(RocketChatUserId);
}

