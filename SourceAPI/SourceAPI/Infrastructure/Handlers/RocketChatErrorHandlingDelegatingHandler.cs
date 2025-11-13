using Microsoft.Extensions.Logging;
using Refit;
using System;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

namespace SourceAPI.Infrastructure.Handlers;

public class RocketChatErrorHandlingDelegatingHandler : DelegatingHandler
{
    private readonly ILogger<RocketChatErrorHandlingDelegatingHandler> _logger;

    public RocketChatErrorHandlingDelegatingHandler(ILogger<RocketChatErrorHandlingDelegatingHandler> logger)
    {
        _logger = logger;
    }

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        try
        {
            var response = await base.SendAsync(request, cancellationToken);

            if (response.StatusCode == HttpStatusCode.NotFound ||
                !response.IsSuccessStatusCode)
            {
                string errorBody = string.Empty;
                if (response.Content != null)
                {
                    await response.Content.LoadIntoBufferAsync();
                    errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                }
                if (errorBody.Contains("User not found", StringComparison.OrdinalIgnoreCase) ||
                    errorBody.Contains("user does not exist", StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogDebug($"User not found (expected): {request.Method} {request.RequestUri}");

                    return new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(
                            "{\"success\":false,\"user\":null}",
                            System.Text.Encoding.UTF8,
                            "application/json")
                    };
                }
                if (response.StatusCode == HttpStatusCode.NotFound)
                {
                    _logger.LogDebug($"Resource not found: {request.Method} {request.RequestUri}");

                    return new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(
                            "{\"success\":false,\"error\":\"Not found\"}",
                            System.Text.Encoding.UTF8,
                            "application/json")
                    };
                }
            }

            return response;
        }
        catch (ApiException apiEx)
        {
            _logger.LogWarning(apiEx,
                $"API Exception: {request.Method} {request.RequestUri} - Status: {apiEx.StatusCode}");

            // Check error content
            string errorContent = apiEx.Content ?? string.Empty;

            if (errorContent.Contains("User not found", StringComparison.OrdinalIgnoreCase) ||
                errorContent.Contains("user does not exist", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogDebug($"User not found via ApiException (expected)");

                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(
                        "{\"success\":true,\"user\":null}",
                        System.Text.Encoding.UTF8,
                        "application/json")
                };
            }

            if (apiEx.StatusCode == HttpStatusCode.NotFound)
            {
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(
                        "{\"success\":false,\"error\":\"Not found\"}",
                        System.Text.Encoding.UTF8,
                        "application/json")
                };
            }
            throw;
        }
        catch (HttpRequestException httpEx)
        {
            _logger.LogError(httpEx,
                $"HTTP Request Exception: {request.Method} {request.RequestUri}");
            throw;
        }
    }
}

