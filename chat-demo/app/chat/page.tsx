'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import rocketChatService from '@/services/rocketchat.service';

interface Message {
  messageId: string;
  username: string;
  text: string;
  timestamp: string;
  deleted?: boolean;
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId');
  const username = searchParams.get('username');
  const name = searchParams.get('name');

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages
  useEffect(() => {
    if (roomId) {
      loadMessages();
      
      // Auto refresh every 5 seconds
      const interval = setInterval(loadMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [roomId]);

  const loadMessages = async () => {
    if (!roomId) return;
    
    try {
      setLoading(true);
      const response = await rocketChatService.getMessages(roomId, { pageSize: 100, pageNumber: 1 });
      
      if (response.success && response.messages) {
        setMessages(response.messages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim() || !roomId || sending) return;

    try {
      setSending(true);
      const response = await rocketChatService.sendMessage({
        roomId,
        text: messageText.trim(),
      });

      if (response.success) {
        setMessageText('');
        // Reload messages after sending
        await loadMessages();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Không thể gửi tin nhắn!');
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

  if (!roomId) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <span className="text-6xl">❌</span>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Room ID không hợp lệ</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            ← Quay lại
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {name || username || 'Chat'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              @{username}
            </p>
          </div>
        </div>
        <button
          onClick={loadMessages}
          disabled={loading}
          className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          {loading ? '🔄 Đang tải...' : '🔄 Làm mới'}
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500 dark:text-gray-400">Đang tải tin nhắn...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <span className="text-6xl">💬</span>
              <p className="mt-4 text-gray-500 dark:text-gray-400">
                Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.messageId}
                className={`flex ${msg.username === username ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    msg.username === username
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border dark:border-gray-700'
                  } ${msg.deleted ? 'opacity-50 line-through' : ''}`}
                >
                  {msg.username !== username && (
                    <p className="text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">
                      @{msg.username}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.username === username
                        ? 'text-blue-100'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 px-6 py-4">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter để xuống dòng)"
            rows={1}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!messageText.trim() || sending}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Đang gửi...
              </>
            ) : (
              <>
                📤 Gửi
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

