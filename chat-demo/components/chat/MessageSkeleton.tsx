/**
 * Loading skeleton for messages
 * Better UX than plain spinners
 */

export function MessageSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 animate-pulse">
          {/* Avatar skeleton */}
          <div className="flex-shrink-0 w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full" />
          
          <div className="flex-1 space-y-2">
            {/* Name and timestamp skeleton */}
            <div className="flex items-center gap-2">
              <div className="h-3 w-24 bg-gray-300 dark:bg-gray-700 rounded" />
              <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
            
            {/* Message content skeleton */}
            <div className="space-y-1.5">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
              {i % 3 === 0 && (
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ThreadMessageSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 animate-pulse">
          {/* Avatar skeleton */}
          <div className="flex-shrink-0 w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full" />
          
          <div className="flex-1 space-y-2">
            {/* Name and timestamp skeleton */}
            <div className="flex items-center gap-2">
              <div className="h-3 w-20 bg-gray-300 dark:bg-gray-700 rounded" />
              <div className="h-3 w-12 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
            
            {/* Message bubble skeleton */}
            <div className="bg-gray-200 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-2 space-y-1">
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-full" />
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function RoomListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="space-y-1 p-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
          {/* Avatar skeleton */}
          <div className="flex-shrink-0 w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full" />
          
          <div className="flex-1 space-y-2">
            {/* Room name skeleton */}
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
            
            {/* Last message skeleton */}
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
          </div>
          
          {/* Timestamp skeleton */}
          <div className="h-3 w-12 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>
      ))}
    </div>
  );
}

