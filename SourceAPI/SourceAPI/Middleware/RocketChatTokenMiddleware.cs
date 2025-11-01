using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;

namespace SourceAPI.Middleware
{
    public class RocketChatTokenMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RocketChatTokenMiddleware> _logger;

        public RocketChatTokenMiddleware(
            RequestDelegate next,
            ILogger<RocketChatTokenMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Extract Rocket.Chat token from headers
            if (context.Request.Headers.TryGetValue("X-RocketChat-Token", out var token))
            {
                context.Items["RocketChatToken"] = token.ToString();
                _logger.LogDebug($"Found X-RocketChat-Token in headers");
            }

            // Extract Rocket.Chat UserId from headers
            if (context.Request.Headers.TryGetValue("X-RocketChat-UserId", out var userId))
            {
                context.Items["RocketChatUserId"] = userId.ToString();
                _logger.LogDebug($"Found X-RocketChat-UserId: {userId}");
            }

            await _next(context);
        }
    }

    public static class RocketChatTokenMiddlewareExtensions
    {
        public static IApplicationBuilder UseRocketChatToken(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<RocketChatTokenMiddleware>();
        }
    }
}

