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
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Room Header */}
      <RoomHeader room={room} onRefresh={loadMessages} />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
              <p className="text-gray-500 dark:text-gray-400">
                Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
              </p>
            </div>
          </div>
        ) : (
          <>
            <MessageList messages={messages} />
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            {/* Emoji Button */}
            <button
              type="button"
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Emoji"
            >
              😊
            </button>

            {/* Text Input */}
            <div className="flex-1">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter để xuống dòng)"
                rows={1}
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!messageText.trim() || sending}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              title="Gửi"
            >
              {sending ? (
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </button>
          </form>
      </div>
    </div>
  );
}

