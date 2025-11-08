'use client';

import { useEffect, useRef, memo } from 'react';
import { Loader2 } from 'lucide-react';
import { useMessages } from '@/hooks/use-messages';
import MessageList from './MessageList';
import type { ChatMessage } from '@/types/rocketchat';

interface MessageListInfiniteProps {
  roomId: string;
  roomType?: 'p' | 'd' | 'c';
  currentUserId?: number;
  currentUsername?: string;
  onMessagesChange?: (messages: ChatMessage[]) => void;
  onThreadClick?: (message: ChatMessage) => void;
}

function MessageListInfinite({ 
  roomId, 
  roomType = 'p', 
  currentUserId, 
  currentUsername,
  onMessagesChange,
  onThreadClick
}: MessageListInfiniteProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  const previousScrollHeight = useRef(0);
  const hasUserScrolled = useRef(false); // Track if user has manually scrolled

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useMessages({
    roomId,
    roomType,
    currentUsername,
    enabled: !!roomId,
  });

  // Flatten all messages from pages
  // API returns newest first, but UI needs oldest first (old messages at top)
  // So we reverse the entire array after flattening
  const allMessages = data?.pages.flatMap((page) => page.messages).reverse() || [];

  // Notify parent of messages change
  useEffect(() => {
    if (onMessagesChange && allMessages.length > 0) {
      onMessagesChange(allMessages);
    }
  }, [allMessages, onMessagesChange]);

  // Scroll to bottom on initial load or new message
  useEffect(() => {
    if (isInitialLoad.current && allMessages.length > 0 && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      isInitialLoad.current = false;
    }
  }, [allMessages.length]);

  // Track user scroll to enable infinite scroll only after user interaction
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      hasUserScrolled.current = true;
    };

    scrollElement.addEventListener('scroll', handleScroll);
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Intersection Observer for infinite scroll (load older messages when scrolling up)
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        // Chỉ load khi user đã thực sự scroll (tránh auto-load khi page vừa load)
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage && hasUserScrolled.current) {
          // Store current scroll position before loading more
          if (scrollRef.current) {
            previousScrollHeight.current = scrollRef.current.scrollHeight;
          }
          fetchNextPage();
        }
      },
      { 
        threshold: 0.5,
        rootMargin: '100px' // Trigger trước 100px khi scroll gần đến
      }
    );

    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Maintain scroll position after loading older messages
  useEffect(() => {
    if (scrollRef.current && previousScrollHeight.current > 0 && !isFetchingNextPage) {
      const newScrollHeight = scrollRef.current.scrollHeight;
      const scrollDiff = newScrollHeight - previousScrollHeight.current;
      scrollRef.current.scrollTop = scrollDiff;
      previousScrollHeight.current = 0;
    }
  }, [isFetchingNextPage, allMessages.length]);

  // Reset initial load flag when room changes
  useEffect(() => {
    isInitialLoad.current = true;
    previousScrollHeight.current = 0;
    hasUserScrolled.current = false; // Reset scroll tracking
  }, [roomId]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Đang tải tin nhắn...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-red-500">
          <p className="text-sm">Lỗi khi tải tin nhắn</p>
          <p className="text-xs text-gray-500 mt-1">
            {error?.message || 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  if (allMessages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-sm">Chưa có tin nhắn nào</p>
          <p className="text-xs mt-1">Hãy bắt đầu cuộc trò chuyện!</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-6 py-4 scroll-smooth"
    >
      {/* Load More Trigger (at top) */}
      {hasNextPage && (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          {isFetchingNextPage ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang tải tin nhắn cũ hơn...</span>
            </div>
          ) : (
            <button
              onClick={() => fetchNextPage()}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 
                       dark:hover:text-blue-300 font-medium transition-colors"
            >
              Tải thêm tin nhắn
            </button>
          )}
        </div>
      )}

      {/* Messages - reversed to show newest at bottom */}
      <MessageList
        messages={[...allMessages].reverse()}
        roomId={roomId}
        currentUserId={currentUserId}
        currentUsername={currentUsername}
        onThreadClick={onThreadClick}
      />
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(MessageListInfinite, (prevProps, nextProps) => {
  return (
    prevProps.roomId === nextProps.roomId &&
    prevProps.roomType === nextProps.roomType &&
    prevProps.currentUserId === nextProps.currentUserId &&
    prevProps.currentUsername === nextProps.currentUsername
  );
});

