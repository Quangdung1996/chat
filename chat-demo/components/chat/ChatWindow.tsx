'use client';

import { useState, useEffect, useRef } from 'react';
import rocketChatService from '@/services/rocketchat.service';
import MessageList from './MessageList';
import RoomHeader from './RoomHeader';
import type { UserSubscription, SendMessageRequest } from '@/types/rocketchat';

interface ChatWindowProps {
  room: UserSubscription;
}

export default function ChatWindow({ room }: ChatWindowProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Determine room type for API calls
  const getRoomType = () => {
    if (room.type === 'd') return 'dm';
    if (room.type === 'p') return 'group';
    if (room.type === 'c') return 'channel';
    return 'group';
  };

  useEffect(() => {
    if (room) {
      loadMessages();
      // Auto-refresh messages mỗi 5 giây
      const interval = setInterval(loadMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [room.roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const response = await rocketChatService.getMessages(
        room.roomId,
        getRoomType(),
        50,
        0
      );
      if (response.success && response.messages) {
        setMessages(response.messages || []);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
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
      <RoomHeader room={room} onRefresh={loadMessages} />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
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
          <div className="py-4">
            <MessageList messages={messages} />
            <div ref={messagesEndRef} />
          </div>
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
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
              </svg>
            </button>
            <button
              type="button"
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Italic"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m-4 4h8m-8 8h8" />
              </svg>
            </button>
            <button
              type="button"
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Link"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </button>
            <button
              type="button"
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Emoji"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <div className="flex-1" />
            <button
              type="button"
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Đính kèm file"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
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
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
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

