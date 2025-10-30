using Microsoft.Extensions.Logging;
using SourceAPI.Services.RocketChat;
using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading;
using System.Threading.Tasks;

namespace SourceAPI.Infrastructure.Handlers
{
    /// <summary>
    /// DelegatingHandler to automatically add RocketChat authentication headers
    /// Handles token refresh and retry logic
    /// </summary>
    public class RocketChatAuthDelegatingHandler : DelegatingHandler
    {
        private readonly IRocketChatAuthService _authService;
        private readonly ILogger<RocketChatAuthDelegatingHandler> _logger;

        public RocketChatAuthDelegatingHandler(
            IRocketChatAuthService authService,
            ILogger<RocketChatAuthDelegatingHandler> logger)
        {
            _authService = authService;
            _logger = logger;
        }

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
                // Get admin token (cached)
                var token = await _authService.GetAdminTokenAsync();

                // Add authentication headers
                request.Headers.Add("X-Auth-Token", token.AuthToken);
                request.Headers.Add("X-User-Id", token.UserId);

                _logger.LogDebug("Added RocketChat auth headers for request: {Method} {Uri}",
                    request.Method, request.RequestUri);

                var response = await base.SendAsync(request, cancellationToken);

                // If unauthorized, try to refresh token and retry once
                if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
                {
                    _logger.LogWarning("Received 401 Unauthorized, attempting token refresh...");

                    // Force refresh token
                    token = await _authService.RefreshAdminTokenAsync();

                    // Update headers with new token
                    request.Headers.Remove("X-Auth-Token");
                    request.Headers.Remove("X-User-Id");
                    request.Headers.Add("X-Auth-Token", token.AuthToken);
                    request.Headers.Add("X-User-Id", token.UserId);

                    // Retry request
                    response = await base.SendAsync(request, cancellationToken);

                    if (response.IsSuccessStatusCode)
                    {
                        _logger.LogInformation("Token refresh successful, request succeeded");
                    }
                }

                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in RocketChatAuthDelegatingHandler for {Method} {Uri}",
                    request.Method, request.RequestUri);
                throw;
            }
        }
    }
}

