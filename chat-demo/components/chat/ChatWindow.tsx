'use client';

import { useState, useRef, memo, useEffect } from 'react';
import { rocketChatWS } from '@/services/rocketchat-websocket.service';
import { useAuthStore } from '@/store/authStore';
import { useWebSocketConnected } from '@/store/websocketStore';
import { useRoomSubscription } from '@/hooks/use-room-subscription';
import { useSendMessage } from '@/hooks/use-messages';
import MessageListInfinite from './MessageListInfinite';
import RoomHeader from './RoomHeader';
import MessageEditor, { MessageEditorRef } from './MessageEditor';
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
  const editorRef = useRef<MessageEditorRef>(null);
  
  // ✅ Use stable selector functions
  const user = useAuthStore(selectUser);
  const token = useAuthStore(selectToken);

  // ✅ TanStack Query hooks
  const sendMessageMutation = useSendMessage();
  
  // ✅ Zustand stores
  const wsConnected = useWebSocketConnected();
  
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  
  // 🧵 Thread state
  const [activeThread, setActiveThread] = useState<ChatMessage | null>(null);

  // Extract primitive values
  const roomId = room.roomId;
  const roomType = room.type || 'p';

  // ✅ Clear editor khi chuyển room
  useEffect(() => {
    editorRef.current?.clear();
  }, [roomId]);

  // ✅ Rocket.Chat WebSocket: Centralized subscription (ref-counted in store)
  useRoomSubscription(roomId);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || sendMessageMutation.isPending) return;
    
    try {
      // ✅ Send with optimistic update (handled by useSendMessage hook)
      await sendMessageMutation.mutateAsync({
        roomId: room.roomId,
        text: text.trim(),
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
          <div className="flex items-end gap-2">
            {/* Rich Text Editor with integrated file upload */}
            <MessageEditor
              ref={editorRef}
              onSubmit={handleSendMessage}
              placeholder="Nhập tin nhắn..."
              disabled={sendMessageMutation.isPending}
              roomId={roomId}
            />

            {/* Send Button - MS Teams Purple with better disabled state */}
            <button
              type="button"
              onClick={() => {
                const text = editorRef.current?.getText() || '';
                if (text.trim() && !sendMessageMutation.isPending) {
                  handleSendMessage(text);
                  editorRef.current?.clear();
                }
              }}
              disabled={sendMessageMutation.isPending}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[#5b5fc7] hover:bg-[#464a9e] disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:cursor-not-allowed text-white disabled:text-gray-400 dark:disabled:text-gray-600 rounded transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none"
              title={sendMessageMutation.isPending ? "Đang gửi..." : "Gửi (hoặc nhấn Enter)"}
            >
              {sendMessageMutation.isPending ? (
                <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Thread Panel - Slide in from right */}
      {activeThread && (
        <ThreadPanel
          roomId={roomId}
          parentMessage={activeThread}
          onClose={() => setActiveThread(null)}
          currentUsername={room.user?.username}
          currentUserName={room.user?.name}
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
