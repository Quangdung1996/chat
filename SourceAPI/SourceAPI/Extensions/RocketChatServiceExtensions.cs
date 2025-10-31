using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using Refit;
using SourceAPI.Infrastructure.Handlers;
using SourceAPI.Infrastructure.Proxy;
using SourceAPI.Models.RocketChat;
using SourceAPI.Services;
using SourceAPI.Services.BackgroundQueue;
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

            // Register DelegatingHandlers
            services.AddTransient<RocketChatErrorHandlingDelegatingHandler>();
            services.AddTransient<LoggingDelegatingHandler>();
            services.AddTransient<RocketChatAuthDelegatingHandler>();

            // Configure Newtonsoft.Json settings for Refit
            var refitSettings = new RefitSettings
            {
                ContentSerializer = new NewtonsoftJsonContentSerializer(
                    new JsonSerializerSettings
                    {
                        ContractResolver = new DefaultContractResolver
                        {
                            NamingStrategy = new CamelCaseNamingStrategy()
                        },
                        NullValueHandling = NullValueHandling.Ignore
                    }
                )
            };

            // Register Public Proxy WITHOUT auth handler (for login, public endpoints)
            services.AddRefitClient<IRocketChatPublicProxy>(refitSettings)
                .ConfigureHttpClient(client =>
                {
                    client.BaseAddress = new Uri(rocketChatConfig.BaseUrl);
                    client.DefaultRequestHeaders.Add("Accept", "application/json");
                    client.DefaultRequestHeaders.Add("User-Agent", "SourceAPI-RocketChat-Integration/1.0");
                    client.Timeout = TimeSpan.FromSeconds(30);
                })
                .AddHttpMessageHandler<LoggingDelegatingHandler>()
                .AddHttpMessageHandler<RocketChatErrorHandlingDelegatingHandler>(); // NO Auth Handler!

            services.AddRefitClient<IRocketChatAdminProxy>(refitSettings)
                .ConfigureHttpClient(client =>
                {
                    client.BaseAddress = new Uri(rocketChatConfig.BaseUrl);
                    client.DefaultRequestHeaders.Add("Accept", "application/json");
                    client.DefaultRequestHeaders.Add("User-Agent", "SourceAPI-RocketChat-Integration/1.0");
                    client.Timeout = TimeSpan.FromSeconds(30);
                })
                .AddHttpMessageHandler<LoggingDelegatingHandler>()
                .AddHttpMessageHandler<RocketChatAuthDelegatingHandler>()
                .AddHttpMessageHandler<RocketChatErrorHandlingDelegatingHandler>();

            // Register User Proxy Factory (for creating user-specific proxies)
            services.AddSingleton<IRocketChatUserProxyFactory, RocketChatUserProxyFactory>();
            services.AddHttpClient("RocketChatUser", client =>
            {
                client.BaseAddress = new Uri(rocketChatConfig.BaseUrl);
                client.DefaultRequestHeaders.Add("Accept", "application/json");
                client.DefaultRequestHeaders.Add("User-Agent", "SourceAPI-RocketChat-Integration/1.0");
                client.Timeout = TimeSpan.FromSeconds(30);
            })
              .AddHttpMessageHandler<LoggingDelegatingHandler>()
              .AddHttpMessageHandler<RocketChatErrorHandlingDelegatingHandler>();

            // Register services
            services.AddScoped<IRocketChatAuthService, RocketChatAuthService>();
            services.AddScoped<IRocketChatUserService, RocketChatUserService>();
            services.AddScoped<IRocketChatRoomService, RocketChatRoomService>();
            services.AddScoped<IRocketChatAutoLoginService, RocketChatAutoLoginService>();
            services.AddScoped<IRocketChatUserTokenService, RocketChatUserTokenService>();

            // Register background task queue for async user registration
            services.AddSingleton<IBackgroundTaskQueue>(ctx =>
            {
                return new BackgroundTaskQueue(capacity: 100); // Queue capacity
            });
            services.AddHostedService<QueuedHostedService>();

            // Register background service for auto-sync
            // services.AddHostedService<RocketChatSyncBackgroundService>();

            // Register memory cache if not already registered
            services.AddMemoryCache();
            services.AddHttpContextAccessor();
            services.AddScoped<ICurrentUserService, CurrentUserService>();
            services.AddScoped<IRocketChatContextService, RocketChatContextService>();

            return services;
        }
    }
}

