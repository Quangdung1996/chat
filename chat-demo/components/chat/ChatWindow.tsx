'use client';

import { useState, useEffect, useRef } from 'react';
import rocketChatService from '@/services/rocketchat.service';
import MessageList from './MessageList';
import RoomHeader from './RoomHeader';
import { useAuthStore } from '@/store/authStore';
import { Bold, Italic, Link as LinkIcon, Smile, Paperclip, Send } from 'lucide-react';
import type { UserSubscription, SendMessageRequest } from '@/types/rocketchat';

interface ChatWindowProps {
  room: UserSubscription;
}

export default function ChatWindow({ room }: ChatWindowProps) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get room type directly from room object for API calls
  // Backend API expects: 'd' (DM), 'p' (private group), 'c' (channel)
  const getRoomType = () => {
    return room.type || 'p'; // Return type as-is, default to 'p' (private group)
  };

  useEffect(() => {
    if (room) {
      // Clear messages cũ khi chuyển room
      setMessages([]);
      // Load messages lần đầu với loading state
      loadMessages(true);
      
      // Auto-refresh messages mỗi 10 giây (không hiển thị loading)
      const interval = setInterval(() => loadMessages(false), 10000);
      return () => clearInterval(interval);
    }
  }, [room.roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      }
      
      const response = await rocketChatService.getMessages(
        room.roomId,
        getRoomType(),
        50,
        0,
        user?.username // Pass current username to identify own messages
      );
      
      // Chỉ update messages nếu API thành công VÀ có data
      if (response.success && response.messages) {
        setMessages(response.messages);
      }
      // Nếu lỗi, GIỮ NGUYÊN messages cũ (không clear)
    } catch (error) {
      console.error('Failed to load messages:', error);
      // Giữ nguyên messages cũ khi lỗi
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

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
        // Tải lại messages sau khi gửi
        setTimeout(loadMessages, 500);
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
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
      {/* Room Header */}
      <RoomHeader room={room} onRefresh={() => loadMessages(false)} />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent rounded-full text-blue-600" />
              <p className="mt-2 text-gray-500 dark:text-gray-400">Đang tải tin nhắn...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1" />
            <div className="py-4">
              <MessageList messages={messages} />
              <div ref={messagesEndRef} />
            </div>
          </>
        )}
      </div>

      {/* Message Input - Teams Style */}
      <div className="border-t dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4">
        <form onSubmit={handleSendMessage} className="space-y-2">
          {/* Formatting Toolbar */}
          <div className="flex items-center gap-1 pb-2 border-b dark:border-gray-700">
            <button
              type="button"
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Link"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Emoji"
            >
              <Smile className="w-4 h-4" />
            </button>
            <div className="flex-1" />
            <button
              type="button"
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Đính kèm file"
            >
              <Paperclip className="w-4 h-4" />
            </button>
          </div>

          {/* Text Input */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập tin nhắn..."
                rows={1}
                className="w-full px-0 py-2 bg-transparent border-0 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none focus:ring-0"
                style={{ minHeight: '40px', maxHeight: '160px' }}
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">Enter</kbd> để gửi,{' '}
                <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">Shift+Enter</kbd> để xuống dòng
              </p>
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!messageText.trim() || sending}
              className="flex-shrink-0 px-4 py-2 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md transition-colors font-medium text-sm"
              title="Gửi tin nhắn"
            >
              {sending ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Gửi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

