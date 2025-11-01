using Microsoft.Extensions.DependencyInjection;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using Refit;
using SourceAPI.Infrastructure.Handlers;
using System;

namespace SourceAPI.Extensions;

public static class RocketChatHttpClientExtensions
{
    /// <summary>
    /// Adds a RocketChat Refit client with standard configuration
    /// </summary>
    public static IHttpClientBuilder AddRocketChatProxy<TInterface>(
        this IServiceCollection services,
        string baseUrl,
        RocketChatProxyType proxyType = RocketChatProxyType.Public)
        where TInterface : class
    {
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
        var builder = services.AddRefitClient<TInterface>(refitSettings)
            .ConfigureHttpClient(client =>
            {
                client.BaseAddress = new Uri(baseUrl);
                client.DefaultRequestHeaders.Add("Accept", "application/json");
                client.DefaultRequestHeaders.Add("User-Agent", "SourceAPI-RocketChat-Integration/1.0");
                client.Timeout = TimeSpan.FromSeconds(30);
            })
            .AddHttpMessageHandler<LoggingDelegatingHandler>();

        // Add auth handler based on proxy type
        switch (proxyType)
        {
            case RocketChatProxyType.Admin:
                builder.AddHttpMessageHandler<RocketChatAdminAuthDelegatingHandler>();
                break;

            case RocketChatProxyType.User:
                builder.AddHttpMessageHandler<RocketChatAuthDelegatingHandler>();
                break;

            case RocketChatProxyType.Public:
                // No auth handler for public endpoints
                break;
        }

        builder.AddHttpMessageHandler<RocketChatErrorHandlingDelegatingHandler>();

        return builder;
    }
}

/// <summary>
/// Types of RocketChat proxy clients
/// </summary>
public enum RocketChatProxyType
{
    /// <summary>Public endpoints (no authentication)</summary>
    Public,

    /// <summary>Admin endpoints (uses admin token)</summary>
    Admin,

    /// <summary>User endpoints (uses current user context)</summary>
    User
}