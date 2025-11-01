namespace SourceAPI.Models.RocketChat
{
    public class RocketChatConfig
    {
        public string BaseUrl { get; set; } = "http://localhost:3000";
        public string AdminUsername { get; set; } = string.Empty;
        public string AdminPassword { get; set; } = string.Empty;
        public string BotUsername { get; set; } = string.Empty;
        public string BotPassword { get; set; } = string.Empty;
        public int TokenCacheTTL { get; set; } = 82800; // 23 hours in seconds
        public string WebhookSecret { get; set; } = string.Empty;
        public string ApiKey { get; set; } = string.Empty;
        public int RateLimitDelayMs { get; set; } = 100;
        public int MaxRetryAttempts { get; set; } = 3;
        public int RetryDelayMs { get; set; } = 1000;
    }
}

