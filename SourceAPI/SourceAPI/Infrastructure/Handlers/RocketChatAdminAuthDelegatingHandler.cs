using Microsoft.Extensions.Logging;
using SourceAPI.Services.RocketChat;
using System.Threading.Tasks;

namespace SourceAPI.Infrastructure.Handlers;

/// <summary>
/// DelegatingHandler to automatically add RocketChat authentication headers
/// Handles token refresh and retry logic
/// </summary>
public class RocketChatAdminAuthDelegatingHandler : RocketChatAuthDelegatingHandlerBase
{
    private readonly IRocketChatAuthService _authService;

    public RocketChatAdminAuthDelegatingHandler(
        IRocketChatAuthService authService,
        ILogger<RocketChatAdminAuthDelegatingHandler> logger)
        : base(logger)
    {
        _authService = authService;
    }

    protected override async Task<(string authToken, string userId)> GetAuthCredentialsAsync()
    {
        var token = await _authService.GetAdminTokenAsync();
        return (token.AuthToken, token.UserId);
    }
}