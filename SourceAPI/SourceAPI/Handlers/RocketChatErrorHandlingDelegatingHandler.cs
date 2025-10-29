using Microsoft.Extensions.Logging;
using Refit;
using System;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

namespace SourceAPI.Handlers;

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

            // Nếu 404 NOT FOUND hoặc error
            if (response.StatusCode == HttpStatusCode.NotFound ||
                !response.IsSuccessStatusCode)
            {
                // Load response body để check error message
                string errorBody = string.Empty;
                if (response.Content != null)
                {
                    await response.Content.LoadIntoBufferAsync();
                    errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                }

                // Nếu là "User not found" → trả về success = true, user = null
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

                // 404 khác (room, channel, etc.) → trả success = false
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
            // Bắt Refit ApiException
            _logger.LogWarning(apiEx,
                $"API Exception: {request.Method} {request.RequestUri} - Status: {apiEx.StatusCode}");

            // Check error content
            string errorContent = apiEx.Content ?? string.Empty;

            // Nếu là "User not found" → trả success = true, user = null
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

            // 404 khác
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

            // Các lỗi khác vẫn throw
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
