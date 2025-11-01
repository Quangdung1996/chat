using Microsoft.Extensions.Logging;
using SourceAPI.Services;
using System;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

namespace SourceAPI.Infrastructure.Handlers;

public abstract class RocketChatAuthDelegatingHandlerBase : DelegatingHandler
{
    protected readonly ILogger Logger;

    protected RocketChatAuthDelegatingHandlerBase(ILogger logger)
    {
        Logger = logger;
    }

    /// <summary>
    /// Derived classes implement this to provide auth token and userId
    /// </summary>
    protected abstract Task<(string authToken, string userId)> GetAuthCredentialsAsync();

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        // Skip authentication for login endpoints
        if (request.RequestUri?.AbsolutePath.Contains("/api/v1/login") == true)
        {
            return await base.SendAsync(request, cancellationToken);
        }

        try
        {
            // Get credentials from derived class
            var (authToken, userId) = await GetAuthCredentialsAsync();

            // Add authentication headers
            request.Headers.Add("X-Auth-Token", authToken);
            request.Headers.Add("X-User-Id", userId);

            Logger.LogDebug("Added RocketChat auth headers for request: {Method} {Uri}",
                request.Method, request.RequestUri);

            var response = await base.SendAsync(request, cancellationToken);
            return response;
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error in RocketChat auth handler for {Method} {Uri}",
                request.Method, request.RequestUri);
            throw;
        }
    }
}

public class RocketChatAuthDelegatingHandler : RocketChatAuthDelegatingHandlerBase
{
    private readonly IRocketChatContext _context;

    public RocketChatAuthDelegatingHandler(
        IRocketChatContext context,
        ILogger<RocketChatAuthDelegatingHandler> logger)
        : base(logger)
    {
        _context = context;
    }

    protected override Task<(string authToken, string userId)> GetAuthCredentialsAsync()
    {
        return Task.FromResult((_context.RocketChatToken, _context.RocketChatUserId));
    }
}