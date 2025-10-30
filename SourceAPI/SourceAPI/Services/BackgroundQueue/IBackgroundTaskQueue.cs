using System;
using System.Threading;
using System.Threading.Tasks;

namespace SourceAPI.Services.BackgroundQueue
{
    /// <summary>
    /// Background task queue for processing tasks asynchronously
    /// Used for Rocket.Chat user sync after registration
    /// </summary>
    public interface IBackgroundTaskQueue
    {
        /// <summary>
        /// Queue a background work item
        /// </summary>
        ValueTask QueueBackgroundWorkItemAsync(Func<CancellationToken, ValueTask> workItem);

        /// <summary>
        /// Dequeue a background work item
        /// </summary>
        ValueTask<Func<CancellationToken, ValueTask>> DequeueAsync(CancellationToken cancellationToken);
    }
}

