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

        public RocketChatSyncBackgroundService(
            ILogger<RocketChatSyncBackgroundService> logger,
            IServiceProvider serviceProvider)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("RocketChat Initial Sync Service is starting...");

            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);

            if (stoppingToken.IsCancellationRequested)
            {
                return;
            }

            try
            {
                await SyncUsersAsync();
                _logger.LogInformation("RocketChat Initial Sync completed. Service will now stop.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in RocketChat initial sync");
            }
        }

        private async Task SyncUsersAsync()
        {
            _logger.LogInformation("Starting RocketChat initial user sync...");

            using (var scope = _serviceProvider.CreateScope())
            {
                var userService = scope.ServiceProvider.GetRequiredService<IRocketChatUserService>();

                try
                {
                    var existingMappings = await GetExistingMappingsCountAsync();
                    if (existingMappings > 0)
                    {
                        _logger.LogInformation("RocketChat user mappings already exist ({Count} users). Skipping initial sync.", existingMappings);
                        return;
                    }

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
                        "RocketChat initial sync completed. Total: {Total}, Success: {Success}, Errors: {Errors}, Skipped: {Skipped}",
                        usersToSync.Length, successCount, errorCount, skippedCount
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Fatal error in initial sync");
                }
            }
        }

        private async Task<int> GetExistingMappingsCountAsync()
        {
            try
            {
                var results = SourceAPI.Core.Repository.RocketChatRepository.GetAllActiveUsers();
                await Task.CompletedTask;
                return results?.Length ?? 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking existing mappings");
                return 0;
            }
        }

        private async Task<UserToSyncDto[]> GetUsersToSyncAsync(IServiceScope scope)
        {
            try
            {
                var results = SourceAPI.Core.Repository.RocketChatRepository.GetUsersForRocketChatSync();

                if (results == null || results.Length == 0)
                {
                    return Array.Empty<UserToSyncDto>();
                }

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
            _logger.LogInformation("RocketChat Initial Sync Service is stopping...");
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

