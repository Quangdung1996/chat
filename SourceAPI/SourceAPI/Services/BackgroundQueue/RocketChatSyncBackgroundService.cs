using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SourceAPI.Services.RocketChat.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace SourceAPI.Services.BackgroundQueue;

public class RocketChatSyncBackgroundService : BackgroundService
{
    private readonly ILogger<RocketChatSyncBackgroundService> _logger;
    private readonly IServiceScopeFactory _serviceScopeFactory;

    public RocketChatSyncBackgroundService(
        ILogger<RocketChatSyncBackgroundService> logger,
        IServiceScopeFactory serviceScopeFactory)
    {
        _logger = logger;
        _serviceScopeFactory = serviceScopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("RocketChat Initial Sync Service is starting...");

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

        using var scope = _serviceScopeFactory.CreateScope();
        var userService = scope.ServiceProvider.GetRequiredService<IRocketChatUserService>();

        try
        {
            var usersToSync = GetUsersToSyncAsync(scope);

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

                    var existingMapping = userService.GetUserMapping(user.UserId);
                    if (existingMapping != null)
                    {
                        skippedCount++;
                        continue;
                    }

                    var result = await userService.SyncUser(
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
                usersToSync.Count, successCount, errorCount, skippedCount
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fatal error in initial sync");
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

    private IReadOnlyList<UserToSyncDto> GetUsersToSyncAsync(IServiceScope scope)
    {
        try
        {
            return SourceAPI.Core.Repository.RocketChatRepository.GetUsersForRocketChatSync()
                ?.Select(x => new UserToSyncDto
                {
                    UserId = x.UserId,
                    Email = x.Email,
                    FullName = x.FullName,
                    Username = x.Username
                })?.ToList() ?? new List<UserToSyncDto>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting users to sync");
            return new List<UserToSyncDto>();
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