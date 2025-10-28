using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SourceAPI.Models.RocketChat;
using SourceAPI.Services.RocketChat;
using System;

namespace SourceAPI.Extensions
{
    /// <summary>
    /// T-03: Dependency Injection configuration for Rocket.Chat services
    /// DoD: HttpClient cấu hình BaseUrl/header mặc định; DI đăng ký services; đọc config từ appsettings
    /// </summary>
    public static class RocketChatServiceExtensions
    {
        /// <summary>
        /// Register Rocket.Chat services
        /// </summary>
        public static IServiceCollection AddRocketChatServices(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            // Register configuration
            services.Configure<RocketChatConfig>(configuration.GetSection("RocketChat"));

            var rocketChatConfig = configuration.GetSection("RocketChat").Get<RocketChatConfig>();

            if (rocketChatConfig == null)
            {
                throw new InvalidOperationException("RocketChat configuration is missing in appsettings.json");
            }

            // Register HttpClient with base configuration
            services.AddHttpClient("RocketChat", client =>
            {
                client.BaseAddress = new Uri(rocketChatConfig.BaseUrl);
                client.DefaultRequestHeaders.Add("Accept", "application/json");
                client.DefaultRequestHeaders.Add("User-Agent", "SourceAPI-RocketChat-Integration/1.0");
                client.Timeout = TimeSpan.FromSeconds(30);
            });

            // Register services
            services.AddScoped<IRocketChatAuthService, RocketChatAuthService>();
            services.AddScoped<IRocketChatUserService, RocketChatUserService>();
            services.AddScoped<IRocketChatRoomService, RocketChatRoomService>();

            // Register memory cache if not already registered
            services.AddMemoryCache();

            return services;
        }
    }
}

