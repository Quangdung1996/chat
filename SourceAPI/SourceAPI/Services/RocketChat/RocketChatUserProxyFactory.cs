using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using Refit;
using SourceAPI.Models.RocketChat;
using System;
using System.Net.Http;

namespace SourceAPI.Services.RocketChat
{
    /// <summary>
    /// Factory for creating IRocketChatUserProxy instances with specific user tokens
    /// Each user operation should use their own proxy instance with their token
    /// </summary>
    public interface IRocketChatUserProxyFactory
    {
        /// <summary>
        /// Create proxy instance for a specific user
        /// </summary>
        /// <param name="authToken">User's X-Auth-Token</param>
        /// <param name="userId">User's X-User-Id (Rocket.Chat user ID)</param>
        IRocketChatUserProxy CreateUserProxy(string authToken, string userId);
    }

    public class RocketChatUserProxyFactory : IRocketChatUserProxyFactory
    {
        private readonly RocketChatConfig _config;
        private readonly IHttpClientFactory _httpClientFactory;
        public RocketChatUserProxyFactory(IOptions<RocketChatConfig> config, IHttpClientFactory httpClientFactory)
        {
            _config = config.Value;
            _httpClientFactory = httpClientFactory;
        }

        public IRocketChatUserProxy CreateUserProxy(string authToken, string userId)
        {
            if (string.IsNullOrEmpty(authToken))
                throw new ArgumentException("Auth token is required", nameof(authToken));

            if (string.IsNullOrEmpty(userId))
                throw new ArgumentException("User ID is required", nameof(userId));

            // Create HttpClient with user-specific headers
            var httpClient = _httpClientFactory.CreateClient("RocketChatUser");

            // Add user token headers
            httpClient.DefaultRequestHeaders.Add("X-Auth-Token", authToken);
            httpClient.DefaultRequestHeaders.Add("X-User-Id", userId);

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

            // Create Refit proxy
            return RestService.For<IRocketChatUserProxy>(httpClient, refitSettings);
        }
    }
}

