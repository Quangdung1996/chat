'use client';

import { useState, useRef, memo, useEffect } from 'react';
import { rocketChatWS } from '@/services/rocketchat-websocket.service';
import { useAuthStore } from '@/store/authStore';
import { useSendMessage, useAddMessageToCache } from '@/hooks/use-messages';
import MessageListInfinite from './MessageListInfinite';
import RoomHeader from './RoomHeader';
import MessageEditor from './MessageEditor';
import { ThreadPanel } from './ThreadPanel';
import { Send } from 'lucide-react';
import type { UserSubscription, ChatMessage } from '@/types/rocketchat';

// 🔧 Selector functions - tránh infinite loop với Zustand
const selectUser = (state: any) => state.user;
const selectToken = (state: any) => state.token;

interface ChatWindowProps {
  room: UserSubscription;
}

function ChatWindow({ room }: ChatWindowProps) {
  const [messageText, setMessageText] = useState('');
  
  // ✅ Use stable selector functions
  const user = useAuthStore(selectUser);
  const token = useAuthStore(selectToken);

  // ✅ TanStack Query hooks
  const sendMessageMutation = useSendMessage();
  const addMessageToCache = useAddMessageToCache();
  
  const [wsConnected, setWsConnected] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  
  // 🧵 Thread state
  const [activeThread, setActiveThread] = useState<ChatMessage | null>(null);

  // Extract primitive values
  const roomId = room.roomId;
  const roomType = room.type || 'p';

  // ✅ Reset message text khi chuyển room
  useEffect(() => {
    setMessageText(''); // Clear input khi chuyển room
  }, [roomId]); // Chạy khi roomId thay đổi

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
        // ✨ File attachment info
        file: message.file ? {
          _id: message.file._id,
          name: message.file.name,
          type: message.file.type,
          size: message.file.size,
          url: message.file.url,
        } : undefined,
        attachments: message.attachments,
      };

      // ✅ Add message to TanStack Query cache
      addMessageToCache(roomId, newMessage);

      // ✅ Auto mark as read when receiving new messages in current room
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
  }, [roomId, wsConnected, addMessageToCache]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || sendMessageMutation.isPending) return;

    const textToSend = messageText.trim();
    
    // Clear input immediately for better UX
    setMessageText('');
    
    try {
      // ✅ Send with optimistic update (handled by useSendMessage hook)
      await sendMessageMutation.mutateAsync({
        roomId: room.roomId,
        text: textToSend,
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      // Message is already rolled back by the mutation's onError
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f5f5f7] dark:bg-[#1c1c1e] h-full">
      {/* Room Header */}
      <RoomHeader 
        room={room} 
        onReadOnlyChange={(readOnly, owner) => {
          setIsReadOnly(readOnly);
          setIsOwner(owner ?? false);
        }} 
      />
      
      {/* WebSocket Status Indicator */}
      {!wsConnected && (
        <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
            ⚠️ Đang kết nối realtime... Tin nhắn mới sẽ không cập nhật tự động.
          </p>
        </div>
      )}

      {/* Messages Area - With Infinite Scroll */}
      <MessageListInfinite
        roomId={roomId}
        roomType={roomType as 'p' | 'd' | 'c'}
        currentUserId={user?.id}
        currentUsername={room.user?.username}
        onThreadClick={setActiveThread}
      />

      {/* Message Input - MS Teams Style */}
      <div className="flex-shrink-0 bg-white dark:bg-[#292929] border-t border-gray-200 dark:border-gray-700 px-4 py-4">
        {isReadOnly && !isOwner ? (
          <div className="text-center py-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              🔒 Room này đang ở chế độ read-only. Chỉ chủ phòng mới có thể gửi tin nhắn.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendMessage}>
            <div className="flex items-end gap-2">
              {/* Rich Text Editor with integrated file upload */}
              <MessageEditor
                value={messageText}
                onChange={setMessageText}
                onSubmit={() => {
                  if (messageText.trim() && !sendMessageMutation.isPending) {
                    handleSendMessage(new Event('submit') as any);
                  }
                }}
                placeholder="Nhập tin nhắn..."
                disabled={sendMessageMutation.isPending}
                roomId={roomId}
              />

              {/* Send Button - MS Teams Purple */}
              <button
                type="submit"
                disabled={!messageText.trim() || sendMessageMutation.isPending}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[#5b5fc7] hover:bg-[#464a9e] disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded transition-all duration-200 disabled:opacity-50"
                title="Gửi"
              >
                {sendMessageMutation.isPending ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Thread Panel - Slide in from right */}
      {activeThread && (
        <ThreadPanel
          roomId={roomId}
          parentMessage={activeThread}
          onClose={() => setActiveThread(null)}
        />
      )}
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
