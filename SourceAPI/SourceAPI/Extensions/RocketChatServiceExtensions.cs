using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SourceAPI.Infrastructure.Handlers;
using SourceAPI.Infrastructure.Proxy;
using SourceAPI.Models.RocketChat;
using SourceAPI.Services;
using SourceAPI.Services.BackgroundQueue;
using SourceAPI.Services.RocketChat;
using SourceAPI.Services.RocketChat.Interfaces;
using System;

namespace SourceAPI.Extensions
{
    public static class RocketChatServiceExtensions
    {
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

            // Register DelegatingHandlers
            services.AddTransient<RocketChatErrorHandlingDelegatingHandler>();
            services.AddTransient<LoggingDelegatingHandler>();
            services.AddTransient<RocketChatAdminAuthDelegatingHandler>();

            // Public Proxy (no auth)
            services.AddRocketChatProxy<IRocketChatPublicProxy>(rocketChatConfig.BaseUrl, RocketChatProxyType.Public);

            // Admin Proxy (with admin auth)
            services.AddRocketChatProxy<IRocketChatAdminProxy>(rocketChatConfig.BaseUrl, RocketChatProxyType.Admin);

            // User Proxy (with user context auth)
            services.AddRocketChatProxy<IRocketChatUserProxy>(rocketChatConfig.BaseUrl, RocketChatProxyType.User);

            // Register services
            services.AddScoped<IRocketChatAuthService, RocketChatAuthService>();
            services.AddScoped<IRocketChatUserService, RocketChatUserService>();
            services.AddScoped<IRocketChatRoomService, RocketChatRoomService>();
            services.AddScoped<IRocketChatUserTokenService, RocketChatUserTokenService>();

            // Register background task queue for async user registration
            services.AddSingleton<IBackgroundTaskQueue>(ctx =>
            {
                return new BackgroundTaskQueue(capacity: 100); // Queue capacity
            });
            services.AddHostedService<QueuedHostedService>();

            // Register background service for auto-sync
            services.AddHostedService<RocketChatSyncBackgroundService>();

            // Register memory cache if not already registered
            services.AddMemoryCache();
            services.AddHttpContextAccessor();
            services.AddScoped<ICurrentUserService, CurrentUserService>();
            services.AddScoped<IRocketChatContext, RocketChatContext>();

            return services;
        }
    }
}