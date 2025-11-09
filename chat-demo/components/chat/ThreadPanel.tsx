'use client';

import { useEffect, useRef } from 'react';
import { X, MessageSquare } from 'lucide-react';
import { ChatMessage } from '@/types/rocketchat';
import MessageEditor, { MessageEditorRef } from './MessageEditor';
import { rocketChatWS } from '@/services/rocketchat-websocket.service';
import { useWebSocketStore } from '@/store/websocketStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useThreadSubscription } from '@/hooks/use-room-subscription';
import { useThreadMessages, useSendThreadReply } from '@/hooks/use-messages';
import { ThreadMessageSkeleton } from './MessageSkeleton';
import { formatMessageTime } from '@/utils/dateUtils';

interface ThreadPanelProps {
  roomId: string;
  parentMessage: ChatMessage;
  onClose: () => void;
  currentUsername?: string;
  currentUserName?: string;
}

export function ThreadPanel({ roomId, parentMessage, onClose, currentUsername, currentUserName }: ThreadPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<MessageEditorRef>(null);
  
  // ✅ TanStack Query hooks
  const { data, isLoading, isError } = useThreadMessages({
    roomId,
    tmid: parentMessage.messageId,
    enabled: !!roomId && !!parentMessage.messageId,
  });
  
  const sendThreadReplyMutation = useSendThreadReply();
  
  // Flatten messages from pages
  const messages = data?.pages.flatMap((page) => page.messages) || [];

  // ✅ Zustand stores
  const clearThreadNotification = useNotificationStore((state) => state.clearThreadNotification);
  const markRoomAsRead = useWebSocketStore((state) => state.markRoomAsRead);

  // ✅ Mark thread as read when opening thread panel
  useEffect(() => {
    // Mark thread as read via WebSocket
    rocketChatWS.markThreadAsRead(roomId, parentMessage.messageId).catch((error: any) => {
      console.warn('Failed to mark thread as read when opening thread:', error);
    });
    
    // Also mark room as read (debounced via store)
    markRoomAsRead(roomId);
  }, [parentMessage.messageId, roomId, markRoomAsRead]);

  // ✅ Clear thread notification when opening thread panel (user is viewing it)
  useEffect(() => {
    clearThreadNotification(roomId, parentMessage.messageId);
  }, [roomId, parentMessage.messageId, clearThreadNotification]);

  // ✅ Centralized thread subscription (ref-counted in store)
  useThreadSubscription(roomId, parentMessage.messageId);
  
  // ✅ Auto-scroll to bottom when messages load or change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || sendThreadReplyMutation.isPending) return;

    try {
      // ✅ Send with optimistic update (handled by useSendThreadReply hook)
      await sendThreadReplyMutation.mutateAsync({
        roomId,
        text: text.trim(),
        tmid: parentMessage.messageId, // Reply in thread
      });
      
      // Focus editor after send
      editorRef.current?.focus();
      
      // ✅ Mark thread as read after sending message in thread
      rocketChatWS.markThreadAsRead(roomId, parentMessage.messageId).catch((error: any) => {
        console.warn('Failed to mark thread as read after sending thread reply:', error);
      });
      
      // Also mark room as read (debounced via store)
      markRoomAsRead(roomId);
    } catch (error) {
      console.error('Error sending thread message:', error);
    }
  };

  return (
    <div className="fixed right-0 top-0 h-full w-[400px] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">Thread</h3>
          {messages.length > 0 && (
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm font-medium">{messages.length}</span>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Parent Message */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {parentMessage.user?.name?.[0] || parentMessage.username?.[0] || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-sm text-gray-900 dark:text-white">
                {parentMessage.user?.name || parentMessage.username || 'Unknown'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatMessageTime(parentMessage.timestamp)}
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap break-words">
              {parentMessage.text}
            </p>
          </div>
        </div>
      </div>

      {/* Thread Messages */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <ThreadMessageSkeleton count={3} />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-sm text-red-500 dark:text-red-400">
              Failed to load thread messages. Please try again.
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No replies yet. Be the first to reply!
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {messages.map((msg) => {
            const msgUsername = msg.username || msg.user?.username;
            const isCurrentUser = msgUsername === currentUsername || msg.isCurrentUser;
            
            return (
              <div 
                key={msg.messageId} 
                className={`flex items-start gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
              >
                {!isCurrentUser && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium bg-green-500">
                    {msg.user?.name?.[0] || msg.username?.[0] || '?'}
                  </div>
                )}
                <div className={`flex-1 min-w-0 ${isCurrentUser ? 'flex flex-col items-end' : ''}`}>
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">
                      {isCurrentUser ? 'Tôi' : (msg.user?.name || msg.username || 'Unknown')}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatMessageTime(msg.timestamp)}
                    </span>
                  </div>
                  <div className={`mt-1 ${
                    isCurrentUser 
                      ? 'bg-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-2' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl rounded-tl-sm px-4 py-2'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {msg.text}
                    </p>
                    
                    {/* File attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {msg.attachments.map((att, idx) => (
                          <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded p-2">
                            {att.image_url && (
                              <img
                                src={att.image_url}
                                alt={att.title || 'Attachment'}
                                className="max-w-full rounded"
                              />
                            )}
                            {att.title && (
                              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                                {att.title}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <MessageEditor
          ref={editorRef}
          onSubmit={handleSendMessage}
          placeholder="Reply in thread..."
          disabled={sendThreadReplyMutation.isPending}
          roomId={roomId}
        />
      </div>
    </div>
  );
}

