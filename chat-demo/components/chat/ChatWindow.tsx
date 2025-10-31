'use client';

import { useState, useRef, memo, useEffect } from 'react';
import rocketChatService from '@/services/rocketchat.service';
import { rocketChatWS } from '@/services/rocketchat-websocket.service';
import { useAuthStore } from '@/store/authStore';
import MessageList from './MessageList';
import RoomHeader from './RoomHeader';
import { Smile, Paperclip, Send } from 'lucide-react';
import type { UserSubscription, SendMessageRequest, ChatMessage } from '@/types/rocketchat';

// 🔧 Selector functions - tránh infinite loop với Zustand
const selectUser = (state: any) => state.user;
const selectToken = (state: any) => state.token;

interface ChatWindowProps {
  room: UserSubscription;
}

function ChatWindow({ room }: ChatWindowProps) {
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // ✅ Use stable selector functions
  const user = useAuthStore(selectUser);
  const token = useAuthStore(selectToken);

  // ✅ State management without useSWR
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  // Extract primitive values
  const roomId = room.roomId;
  const roomType = room.type || 'p';

  // ✅ Load messages when room changes
  useEffect(() => {
    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const response = await rocketChatService.getMessages(roomId, roomType, 50, 0);
        if (response.success && response.messages) {
          setMessages(response.messages);
          setError(null);
        } else {
          throw new Error('Failed to load messages');
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (roomId) {
      loadMessages();
    }
  }, [roomId, roomType]);

  // ✅ Reset message text và scroll khi chuyển room
  useEffect(() => {
    setMessageText(''); // Clear input khi chuyển room
    // Scroll to bottom after a short delay
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [roomId]); // Chạy khi roomId thay đổi

  // ✅ Auto scroll khi messages thay đổi - tách riêng khỏi SWR options
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages.length]); // Chỉ scroll khi số lượng messages thay đổi

  // ✅ Rocket.Chat WebSocket: Check if connected (đã connect khi login)
  useEffect(() => {
    if (!user?.id) return;
    
    // Check WebSocket connection status
    setWsConnected(rocketChatWS.isConnected());
    
    // Cleanup on unmount
    return () => {
      // Note: Don't disconnect here, keep connection alive for other components
    };
  }, [user?.id]);

  // ✅ Rocket.Chat WebSocket: Subscribe to room messages
  useEffect(() => {
    if (!roomId || !wsConnected) return;

    // Handler cho message mới từ WebSocket
    const handleNewMessage = (message: any) => {
      // Helper to parse Rocket.Chat timestamp format
      const parseTimestamp = (ts: any): string => {
        if (!ts) return new Date().toISOString();
        if (typeof ts === 'string') return ts;
        if (ts.$date) return new Date(ts.$date).toISOString();
        if (typeof ts === 'number') return new Date(ts).toISOString();
        return new Date().toISOString();
      };
      
      // ✅ Validate message has required fields
      if (!message._id || !message.rid || !message.u || !message.u._id) {
        console.warn('⚠️ Received invalid message from WebSocket, skipping:', message);
        return;
      }
      
      // Convert WebSocket message format to local format
      const newMessage: ChatMessage = {
        messageId: message._id,
        roomId: message.rid,
        text: message.msg || '',
        timestamp: parseTimestamp(message.ts),
        createdAt: parseTimestamp(message.ts),
        user: {
          id: message.u._id,
          username: message.u.username,
          name: message.u.name || message.u.username,
        },
        updatedAt: message._updatedAt ? parseTimestamp(message._updatedAt) : undefined,
      };

      // Update messages state
      setMessages(currentMessages => {
        // Check if this is replacing an optimistic message (temp-*)
        const optimisticIndex = currentMessages.findIndex(
          msg => msg.messageId.startsWith('temp-') && 
                 msg.text === newMessage.text &&
                 msg.user?.username === newMessage.user?.username
        );
        
        if (optimisticIndex !== -1) {
          const updated = [...currentMessages];
          updated[optimisticIndex] = newMessage;
          return updated;
        }
        
        // Check if message already exists (avoid duplicates)
        const exists = currentMessages.some(msg => msg.messageId === newMessage.messageId);
        if (exists) return currentMessages;
        
        // Add new message to the end
        return [...currentMessages, newMessage];
      });

      // ✅ Auto mark as read when receiving new messages in current room
      // This ensures unread count stays at 0 while user is viewing the room
      rocketChatWS.markRoomAsRead(roomId).catch(error => {
        console.warn('Failed to auto-mark room as read:', error);
      });
    };

    // Subscribe to room messages
    const subscriptionId = rocketChatWS.subscribeToRoomMessages(roomId, handleNewMessage);

    // Cleanup on unmount or room change
    return () => {
      rocketChatWS.unsubscribe(subscriptionId);
    };
  }, [roomId, wsConnected]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || sending) return;

    const textToSend = messageText.trim();
    setSending(true);
    
    try {
      const request: SendMessageRequest = {
        roomId: room.roomId,
        text: textToSend,
      };
      
      // Clear input immediately for better UX
      setMessageText('');
      
      // ✅ Optimistically add message to UI with current timestamp
      const optimisticMessage: ChatMessage = {
        messageId: `temp-${Date.now()}`, // Temporary ID
        roomId: room.roomId,
        text: textToSend,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        user: {
          id: user?.id || '',
          username: user?.username || '',
          name: user?.fullName || user?.username || '',
        },
        isCurrentUser: true,
      };
      
      setMessages(currentMessages => [...currentMessages, optimisticMessage]);
      
      // Send to backend
      await rocketChatService.sendMessage(request);
      // WebSocket will update with real message data
    } catch (error) {
      alert('❌ Lỗi: ' + (error as Error).message);
      // Optionally: remove optimistic message on error
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

  const handleRefresh = async () => {
    if (!roomId) return;
    setIsLoading(true);
    try {
      const response = await rocketChatService.getMessages(roomId, roomType, 50, 0);
      if (response.success && response.messages) {
        setMessages(response.messages);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f5f5f7] dark:bg-[#1c1c1e] h-full">
      {/* Room Header */}
      <RoomHeader room={room} onRefresh={handleRefresh} />
      
      {/* WebSocket Status Indicator */}
      {!wsConnected && (
        <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
            ⚠️ Đang kết nối realtime... Tin nhắn mới sẽ không cập nhật tự động.
          </p>
        </div>
      )}

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
            <MessageList 
              messages={messages} 
              currentUserId={user?.id}
              currentUsername={room.user?.username}
            />
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
