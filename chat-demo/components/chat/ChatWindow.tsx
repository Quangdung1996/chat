'use client';

import { useState, useRef, useMemo, memo, useEffect } from 'react';
import useSWR from 'swr';
import rocketChatService from '@/services/rocketchat.service';
import { rocketChatWS } from '@/services/rocketchat-websocket.service';
import { useAuthStore } from '@/store/authStore';
import MessageList from './MessageList';
import RoomHeader from './RoomHeader';
import { Smile, Paperclip, Send } from 'lucide-react';
import type { UserSubscription, SendMessageRequest } from '@/types/rocketchat';

// 🔧 Selector functions - tránh infinite loop với Zustand
const selectUser = (state: any) => state.user;
const selectToken = (state: any) => state.token;

interface ChatWindowProps {
  room: UserSubscription;
}

// ✅ SWR fetcher function - định nghĩa ở ngoài component để tránh infinite loop
const messagesFetcher = async ([_, roomId, roomType]: [string, string, string]) => {
  const response = await rocketChatService.getMessages(
    roomId,
    roomType,
    50,
    0
  );
  
  if (response.success && response.messages) {
    return response.messages;
  }
  throw new Error('Failed to load messages');
};

function ChatWindow({ room }: ChatWindowProps) {
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // ✅ Use stable selector functions
  const user = useAuthStore(selectUser);
  const token = useAuthStore(selectToken);

  // ✅ Memoize SWR key để tránh infinite loop
  const swrKey = useMemo(
    () => room?.roomId ? ['messages', room.roomId, room.type || 'p'] : null,
    [room?.roomId, room?.type]
  );

  // SWR hook - initial load only, no polling (Rocket.Chat WebSocket handles real-time)
  const { data: messages = [], error, isLoading, mutate } = useSWR(
    swrKey,
    messagesFetcher,
    {
      refreshInterval: 0, // ✅ Tắt polling - dùng WebSocket để nhận real-time
      revalidateOnFocus: false, // Tắt auto reload - WebSocket đã handle
      dedupingInterval: 2000,
      keepPreviousData: false, // ✅ KHÔNG giữ data cũ - tránh hiển thị messages của room khác
      revalidateOnMount: true, // ✨ Load ngay khi mount
      compare: (a, b) => {
        // ✅ So sánh messages để tránh re-render không cần thiết
        if (!a || !b || a.length !== b.length) return false;
        if (a.length === 0) return true;
        // So sánh message cuối cùng
        return a[a.length - 1]?.messageId === b[b.length - 1]?.messageId;
      },
    }
  );

  // ✅ Reset message text và scroll khi chuyển room
  useEffect(() => {
    setMessageText(''); // Clear input khi chuyển room
    // Scroll to bottom after a short delay
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [room.roomId]); // Chạy khi roomId thay đổi

  // ✅ Auto scroll khi messages thay đổi - tách riêng khỏi SWR options
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages.length]); // Chỉ scroll khi số lượng messages thay đổi

  // ✅ Rocket.Chat WebSocket: Connect and authenticate
  useEffect(() => {
    if (!user?.id) return;

    // Connect to WebSocket
    rocketChatWS.connect()
      .then(() => {
        // Authenticate using backend API to get Rocket.Chat token
        return rocketChatWS.authenticateWithBackend(user.id);
      })
      .catch(err => {
        console.error('❌ Failed to connect/authenticate WebSocket:', err);
      });

    // Cleanup on unmount
    return () => {
      // Note: Don't disconnect here, keep connection alive for other components
    };
  }, [user?.id]);

  // ✅ Rocket.Chat WebSocket: Subscribe to room messages
  useEffect(() => {
    if (!room?.roomId || !rocketChatWS.isConnected()) return;

    // Handler cho message mới từ WebSocket
    const handleNewMessage = (message: any) => {
      console.log('📨 New message from WebSocket:', message);
      
      // Convert WebSocket message format to local format
      const newMessage = {
        messageId: message._id,
        roomId: message.rid,
        text: message.msg,
        createdAt: message.ts,
        user: {
          id: message.u._id,
          username: message.u.username,
          name: message.u.name,
        },
        updatedAt: message._updatedAt,
      };

      // Update SWR cache with new message
      mutate((currentMessages = []) => {
        // Check if message already exists (avoid duplicates)
        const exists = currentMessages.some(msg => msg.messageId === newMessage.messageId);
        if (exists) return currentMessages;
        
        // Add new message to the end
        return [...currentMessages, newMessage];
      }, false); // false = don't revalidate
    };

    // Subscribe to room messages
    const subscriptionId = rocketChatWS.subscribeToRoomMessages(room.roomId, handleNewMessage);

    // Cleanup on unmount or room change
    return () => {
      rocketChatWS.unsubscribe(subscriptionId);
    };
  }, [room?.roomId, mutate]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || sending) return;

    setSending(true);
    try {
      const request: SendMessageRequest = {
        roomId: room.roomId,
        text: messageText.trim(),
      };
      const response = await rocketChatService.sendMessage(request);
      if (response.success) {
        setMessageText('');
        // No need to revalidate - WebSocket will automatically push the message
      }
    } catch (error) {
      alert('❌ Lỗi: ' + (error as Error).message);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f5f5f7] dark:bg-[#1c1c1e] h-full">
      {/* Room Header */}
      <RoomHeader room={room} onRefresh={() => mutate()} />

      {/* Messages Area - Apple Style */}
      <div className="flex-1 overflow-y-auto px-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin inline-block w-7 h-7 border-[3px] border-current border-t-transparent rounded-full text-[#007aff]" />
              <p className="mt-3 text-[15px] text-gray-600 dark:text-gray-400 font-normal">Đang tải...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                <span className="text-4xl">💬</span>
              </div>
              <p className="text-[17px] font-semibold text-gray-900 dark:text-white mb-1">
                Không có tin nhắn
              </p>
              <p className="text-[15px] text-gray-500 dark:text-gray-400">
                Gửi tin nhắn để bắt đầu trò chuyện
              </p>
            </div>
          </div>
        ) : (
          <div className="py-6">
            <MessageList messages={messages} />
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input - MS Teams Style */}
      <div className="flex-shrink-0 bg-white dark:bg-[#292929] border-t border-gray-200 dark:border-gray-700 px-4 py-4">
        <form onSubmit={handleSendMessage}>
          <div className="flex items-end gap-2">
            {/* Action Button - Left */}
            <button
              type="button"
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-[#5b5fc7] dark:hover:text-[#5b5fc7] hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-all duration-200"
              title="Thêm"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
              </svg>
            </button>

            {/* Text Input Container */}
            <div className="flex-1 relative">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập tin nhắn..."
                rows={1}
                className="w-full px-3 py-2 bg-white dark:bg-[#3a3a3c] border border-gray-300 dark:border-gray-600 rounded text-[14px] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#5b5fc7]/30 dark:focus:ring-[#5b5fc7]/30 focus:border-[#5b5fc7] dark:focus:border-[#5b5fc7] transition-all duration-200"
                style={{ minHeight: '36px', maxHeight: '120px', lineHeight: '1.4' }}
              />
              
              {/* Emoji Button - Inside Input */}
              {!messageText && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
                  title="Emoji"
                >
                  <Smile className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Send Button - MS Teams Purple */}
            <button
              type="submit"
              disabled={!messageText.trim() || sending}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[#5b5fc7] hover:bg-[#464a9e] disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded transition-all duration-200 disabled:opacity-50"
              title="Gửi"
            >
              {sending ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ✨ Memoize ChatWindow để tránh re-render không cần thiết
export default memo(ChatWindow, (prevProps, nextProps) => {
  // ✅ Chỉ re-render khi roomId hoặc room type thay đổi
  return (
    prevProps.room.roomId === nextProps.room.roomId &&
    prevProps.room.type === nextProps.room.type
  );
});
