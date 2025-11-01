using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SourceAPI.Services.RocketChat;
using SourceAPI.Services.RocketChat.Interfaces;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace SourceAPI.Services.BackgroundQueue
{
    public class RocketChatSyncBackgroundService : BackgroundService
    {
        private readonly ILogger<RocketChatSyncBackgroundService> _logger;
        private readonly IServiceProvider _serviceProvider;
        private Timer? _timer;
        private int _syncIntervalMinutes = 60; // Default: mỗi 1 giờ

        public RocketChatSyncBackgroundService(
            ILogger<RocketChatSyncBackgroundService> logger,
            IServiceProvider serviceProvider)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("RocketChat Sync Background Service is starting...");



            // Load config từ appsettings (nếu có)
            using (var scope = _serviceProvider.CreateScope())
            {
                try
                {
                    var config = scope.ServiceProvider.GetService<Microsoft.Extensions.Configuration.IConfiguration>();
                    if (config != null)
                    {
                        var intervalConfig = config.GetValue<int?>("RocketChat:SyncIntervalMinutes");
                        if (intervalConfig.HasValue && intervalConfig.Value > 0)
                        {
                            _syncIntervalMinutes = intervalConfig.Value;
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Could not load sync interval from config, using default: {Interval} minutes", _syncIntervalMinutes);
                }
            }

            _logger.LogInformation("Sync interval set to {Interval} minutes", _syncIntervalMinutes);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await SyncUsersAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in RocketChat sync background job");
                }

                // Đợi interval trước khi chạy lần tiếp theo
                await Task.Delay(TimeSpan.FromMinutes(_syncIntervalMinutes), stoppingToken);
            }
        }

        private async Task SyncUsersAsync()
        {
            _logger.LogInformation("Starting RocketChat user sync job...");

            using (var scope = _serviceProvider.CreateScope())
            {
                var userService = scope.ServiceProvider.GetRequiredService<IRocketChatUserService>();

                try
                {
                    var usersToSync = await GetUsersToSyncAsync(scope);

                    if (usersToSync == null || usersToSync.Length == 0)
                    {
                        _logger.LogInformation("No users to sync");
                        return;
                    }

                    int successCount = 0;
                    int errorCount = 0;
                    int skippedCount = 0;

                    foreach (var user in usersToSync)
                    {
                        try
                        {
                            if (string.IsNullOrWhiteSpace(user.Username))
                            {
                                _logger.LogWarning("Skipping user {UserId} - no username from OAuth2", user.UserId);
                                skippedCount++;
                                continue;
                            }

                            // Check if already synced
                            var existingMapping = await userService.GetMappingAsync(user.UserId);
                            if (existingMapping != null)
                            {
                                skippedCount++;
                                continue;
                            }

                            var result = await userService.SyncUserAsync(
                                user.UserId,
                                user.Username,
                                user.FullName,
                                string.IsNullOrWhiteSpace(user.Email) ? null : user.Email
                            );

                            if (!string.IsNullOrWhiteSpace(result.RocketUserId))
                            {
                                successCount++;
                                _logger.LogInformation("Successfully synced user {UserId} - {Username}",
                                    user.UserId, result.Username);
                            }
                            else
                            {
                                errorCount++;
                                _logger.LogWarning("Failed to sync user {UserId}: {Message}",
                                    user.UserId, result.Message);
                            }

                            await Task.Delay(500);
                        }
                        catch (Exception ex)
                        {
                            errorCount++;
                            _logger.LogError(ex, "Error syncing user {UserId}", user.UserId);
                        }
                    }

                    _logger.LogInformation(
                        "RocketChat sync job completed. Total: {Total}, Success: {Success}, Errors: {Errors}, Skipped: {Skipped}",
                        usersToSync.Length, successCount, errorCount, skippedCount
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Fatal error in sync job");
                }
            }
        }

        private async Task<UserToSyncDto[]> GetUsersToSyncAsync(IServiceScope scope)
        {
            try
            {
                // Gọi stored procedure để lấy users chưa sync
                var results = SourceAPI.Core.Repository.RocketChatRepository.GetUsersForRocketChatSync();

                if (results == null || results.Length == 0)
                {
                    return Array.Empty<UserToSyncDto>();
                }

                // Map from UserToSyncResult to UserToSyncDto
                var users = new UserToSyncDto[results.Length];
                for (int i = 0; i < results.Length; i++)
                {
                    users[i] = new UserToSyncDto
                    {
                        UserId = results[i].UserId,
                        Email = results[i].Email,
                        FullName = results[i].FullName,
                        Username = results[i].Username
                    };
                }

                await Task.CompletedTask;
                return users;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users to sync");
                return Array.Empty<UserToSyncDto>();
            }
        }

        public override async Task StopAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("RocketChat Sync Background Service is stopping...");
            _timer?.Dispose();
            await base.StopAsync(stoppingToken);
        }
    }

    public class UserToSyncDto
    {
        public int UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? Username { get; set; }
    }
}

