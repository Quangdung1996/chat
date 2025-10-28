using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace SourceAPI.Middleware
{
    /// <summary>
    /// Middleware to validate API key for Rocket.Chat integration endpoints
    /// </summary>
    public class RocketChatApiKeyMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RocketChatApiKeyMiddleware> _logger;
        private readonly string _apiKey;

        public RocketChatApiKeyMiddleware(
            RequestDelegate next,
            IConfiguration configuration,
            ILogger<RocketChatApiKeyMiddleware> logger)
        {
            _next = next;
            _logger = logger;
            _apiKey = configuration.GetSection("RocketChat:ApiKey").Value ?? string.Empty;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Only check API key for integration endpoints
            if (context.Request.Path.StartsWithSegments("/api/integrations/rocket"))
            {
                if (!context.Request.Headers.TryGetValue("X-API-Key", out var extractedApiKey))
                {
                    context.Response.StatusCode = 401;
                    await context.Response.WriteAsJsonAsync(new { message = "API Key is missing" });
                    return;
                }

                if (!string.Equals(extractedApiKey, _apiKey, StringComparison.Ordinal))
                {
                    context.Response.StatusCode = 401;
                    await context.Response.WriteAsJsonAsync(new { message = "Invalid API Key" });
                    return;
                }
            }

            await _next(context);
        }
    }

    /// <summary>
    /// Extension method for middleware registration
    /// </summary>
    public static class RocketChatApiKeyMiddlewareExtensions
    {
        public static IApplicationBuilder UseRocketChatApiKey(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<RocketChatApiKeyMiddleware>();
        }
    }
}

