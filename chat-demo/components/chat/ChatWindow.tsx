'use client';

import { useState, useRef, useMemo, memo } from 'react';
import useSWR from 'swr';
import rocketChatService from '@/services/rocketchat.service';
import MessageList from './MessageList';
import RoomHeader from './RoomHeader';
import { Smile, Paperclip, Send } from 'lucide-react';
import type { UserSubscription, SendMessageRequest } from '@/types/rocketchat';

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

  // ✅ Memoize SWR key để tránh infinite loop
  const swrKey = useMemo(
    () => room?.roomId ? ['messages', room.roomId, room.type || 'p'] : null,
    [room?.roomId, room?.type]
  );

  // ✅ Memoize SWR options ở ngoài để tránh infinite loop
  const swrOptions = useMemo(
    () => ({
      refreshInterval: 5000, // ✨ Poll mỗi 5 giây
      revalidateOnFocus: true, // Auto reload khi quay lại tab
      dedupingInterval: 2000, // Không gọi API 2 lần trong 2s
      keepPreviousData: true, // ✨ GIỮ data cũ khi switching
      revalidateOnMount: true, // ✨ Load ngay khi mount
      compare: (a: any, b: any) => {
        // ✨ So sánh messages để tránh re-render không cần thiết
        if (!a || !b) return false;
        if (a.length !== b.length) return false;
        return JSON.stringify(a) === JSON.stringify(b);
      },
      onSuccess: () => {
        // Auto scroll sau khi load messages
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }),
    [] // ✅ Không có dependencies - chỉ tạo 1 lần
  );

  // SWR hook - auto polling every 10s, auto revalidate on focus
  const { data: messages = [], error, isLoading, mutate } = useSWR(
    swrKey,
    messagesFetcher,
    swrOptions
  );

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
        // Revalidate messages sau khi gửi - SWR tự động fetch lại
        setTimeout(() => mutate(), 500);
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

      {/* Message Input - Apple iMessage Style */}
      <div className="flex-shrink-0 bg-white/80 dark:bg-[#2c2c2e]/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 px-4 py-3">
        <form onSubmit={handleSendMessage}>
          <div className="flex items-end gap-2">
            {/* Action Button - Left */}
            <button
              type="button"
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-[#007aff] dark:hover:text-[#0a84ff] hover:bg-gray-100/60 dark:hover:bg-gray-700/40 rounded-full transition-all duration-200"
              title="Thêm"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
              </svg>
            </button>

            {/* Text Input Container */}
            <div className="flex-1 relative">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tin nhắn"
                rows={1}
                className="w-full px-4 py-2.5 bg-white dark:bg-[#3a3a3c] border border-gray-200 dark:border-gray-700 rounded-[20px] text-[17px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-[#007aff]/20 dark:focus:ring-[#0a84ff]/20 focus:border-[#007aff] dark:focus:border-[#0a84ff] transition-all duration-200 shadow-sm"
                style={{ minHeight: '36px', maxHeight: '120px', lineHeight: '1.3' }}
              />
              
              {/* Emoji Button - Inside Input */}
              {!messageText && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                  title="Emoji"
                >
                  <Smile className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Send Button - Apple Blue */}
            <button
              type="submit"
              disabled={!messageText.trim() || sending}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-[#007aff] hover:bg-[#0051d5] disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-full transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none disabled:opacity-40"
              title="Gửi"
            >
              {sending ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Send className="w-4 h-4 translate-x-[1px]" />
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
  // Chỉ re-render khi roomId thay đổi
  return prevProps.room.roomId === nextProps.room.roomId;
});
