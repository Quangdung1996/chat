using Microsoft.Extensions.Logging;
using System;
using System.Diagnostics;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

namespace SourceAPI.Infrastructure.Handlers
{
    /// <summary>
    /// DelegatingHandler to log HTTP requests and responses
    /// Includes timing information and error details
    /// </summary>
    public class LoggingDelegatingHandler : DelegatingHandler
    {
        private readonly ILogger<LoggingDelegatingHandler> _logger;

        public LoggingDelegatingHandler(ILogger<LoggingDelegatingHandler> logger)
        {
            _logger = logger;
        }

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            var requestId = Guid.NewGuid().ToString("N").Substring(0, 8);
            var stopwatch = Stopwatch.StartNew();

            try
            {
                // Log request
                _logger.LogInformation(
                    "[{RequestId}] HTTP {Method} {Uri}",
                    requestId,
                    request.Method,
                    request.RequestUri);

                // Log request body if exists
                if (request.Content != null)
                {
                    // Load content into buffer to allow multiple reads
                    await request.Content.LoadIntoBufferAsync();
                    
                    var requestBody = await request.Content.ReadAsStringAsync(cancellationToken);
                    if (!string.IsNullOrWhiteSpace(requestBody))
                    {
                        _logger.LogDebug(
                            "[{RequestId}] Request Body: {Body}",
                            requestId,
                            requestBody.Length > 500 ? requestBody.Substring(0, 500) + "..." : requestBody);
                    }
                }

                // Send request
                var response = await base.SendAsync(request, cancellationToken);

                stopwatch.Stop();

                // Log response
                _logger.LogInformation(
                    "[{RequestId}] HTTP {StatusCode} {Method} {Uri} - {ElapsedMs}ms",
                    requestId,
                    (int)response.StatusCode,
                    request.Method,
                    request.RequestUri,
                    stopwatch.ElapsedMilliseconds);

                // Load response content into buffer to allow multiple reads (for Refit deserialization)
                if (response.Content != null)
                {
                    await response.Content.LoadIntoBufferAsync();
                    
                    var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
                    
                    // Log response body if error
                    if (!response.IsSuccessStatusCode)
                    {
                        _logger.LogWarning(
                            "[{RequestId}] Response Error Body: {Body}",
                            requestId,
                            responseBody.Length > 1000 ? responseBody.Substring(0, 1000) + "..." : responseBody);
                    }
                    else if (!string.IsNullOrWhiteSpace(responseBody))
                    {
                        // Log success response body in debug mode
                        _logger.LogDebug(
                            "[{RequestId}] Response Body: {Body}",
                            requestId,
                            responseBody.Length > 500 ? responseBody.Substring(0, 500) + "..." : responseBody);
                    }
                }

                return response;
            }
            catch (Exception ex)
            {
                stopwatch.Stop();

                _logger.LogError(ex,
                    "[{RequestId}] HTTP {Method} {Uri} failed after {ElapsedMs}ms - {ErrorMessage}",
                    requestId,
                    request.Method,
                    request.RequestUri,
                    stopwatch.ElapsedMilliseconds,
                    ex.Message);

                throw;
            }
        }
    }
}

