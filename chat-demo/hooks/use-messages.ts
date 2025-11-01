/**
 * TanStack Query hooks for messages with infinite scroll
 */

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rocketChatService } from '@/services/rocketchat.service';
import type { ChatMessage, SendMessageRequest } from '@/types/rocketchat';

// Constants
const MESSAGES_PER_PAGE = 50;

// Query keys factory
export const messageKeys = {
  all: ['messages'] as const,
  room: (roomId: string) => [...messageKeys.all, roomId] as const,
};

interface MessagesPage {
  messages: ChatMessage[];
  nextOffset: number | undefined;
  hasMore: boolean;
  total: number;
  count: number;
  offset: number;
}

interface UseMessagesOptions {
  roomId: string;
  roomType?: 'p' | 'd' | 'c'; // private group, direct message, channel
  currentUsername?: string;
  enabled?: boolean;
}

/**
 * Hook để fetch messages với infinite scroll
 * Load older messages khi scroll lên
 */
export function useMessages({ 
  roomId, 
  roomType = 'p', 
  currentUsername,
  enabled = true 
}: UseMessagesOptions) {
  return useInfiniteQuery<MessagesPage, Error>({
    queryKey: messageKeys.room(roomId),
    queryFn: async ({ pageParam = 0 }) => {
      const response = await rocketChatService.getMessages(
        roomId,
        roomType,
        MESSAGES_PER_PAGE,
        pageParam as number,
        currentUsername
      );

      // Sử dụng total từ API để xác định hasMore chính xác
      const currentOffset = pageParam as number;
      const totalFetched = currentOffset + response.messages.length;
      const hasMore = totalFetched < response.total;
      const nextOffset = hasMore ? currentOffset + MESSAGES_PER_PAGE : undefined;

      return {
        messages: response.messages,
        nextOffset,
        hasMore,
        total: response.total,
        count: response.count,
        offset: response.offset,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled: enabled && !!roomId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook để gửi message với optimistic update
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: SendMessageRequest) => {
      return rocketChatService.sendMessage(request);
    },
    onMutate: async (newMessage) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: messageKeys.room(newMessage.roomId) 
      });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData(
        messageKeys.room(newMessage.roomId)
      );

      // Optimistically update - add message to the first page (latest messages)
      queryClient.setQueryData(
        messageKeys.room(newMessage.roomId),
        (old: any) => {
          if (!old?.pages) return old;

          // Create optimistic message
          const optimisticMessage: ChatMessage = {
            messageId: `temp-${Date.now()}`,
            roomId: newMessage.roomId,
            text: newMessage.text,
            timestamp: new Date().toISOString(),
            isCurrentUser: true,
            user: {
              id: 'current',
              username: 'You',
              name: 'You',
            },
          };

          // Add to first page (newest messages)
          const newPages = [...old.pages];
          if (newPages[0]) {
            newPages[0] = {
              ...newPages[0],
              messages: [optimisticMessage, ...newPages[0].messages],
            };
          }

          return {
            ...old,
            pages: newPages,
          };
        }
      );

      return { previousMessages };
    },
    onError: (_error, _newMessage, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          messageKeys.room(_newMessage.roomId),
          context.previousMessages
        );
      }
    },
    onSuccess: (_data, variables) => {
      // Refetch to get real message from server
      queryClient.invalidateQueries({ 
        queryKey: messageKeys.room(variables.roomId) 
      });
    },
  });
}

/**
 * Helper hook để invalidate messages query
 * Dùng khi nhận message từ WebSocket
 */
export function useInvalidateMessages() {
  const queryClient = useQueryClient();

  return (roomId: string) => {
    queryClient.invalidateQueries({ 
      queryKey: messageKeys.room(roomId) 
    });
  };
}

/**
 * Helper hook để add message từ WebSocket vào cache
 * Không refetch, chỉ update cache trực tiếp
 */
export function useAddMessageToCache() {
  const queryClient = useQueryClient();

  return (roomId: string, newMessage: ChatMessage) => {
    queryClient.setQueryData(
      messageKeys.room(roomId),
      (old: any) => {
        if (!old?.pages) return old;

        // Check if message already exists (tránh duplicate)
        const messageExists = old.pages.some((page: MessagesPage) =>
          page.messages.some((msg) => msg.messageId === newMessage.messageId)
        );

        if (messageExists) return old;

        // Add to first page (newest messages)
        const newPages = [...old.pages];
        if (newPages[0]) {
          newPages[0] = {
            ...newPages[0],
            messages: [newMessage, ...newPages[0].messages],
          };
        }

        return {
          ...old,
          pages: newPages,
        };
      }
    );
  };
}

