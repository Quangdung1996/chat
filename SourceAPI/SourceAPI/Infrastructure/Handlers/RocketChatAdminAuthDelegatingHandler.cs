using Microsoft.Extensions.Logging;
using SourceAPI.Services.RocketChat.Interfaces;
using System.Threading.Tasks;

namespace SourceAPI.Infrastructure.Handlers;

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