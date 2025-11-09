'use client';

import { memo } from 'react';
import { Trash2 } from 'lucide-react';
import type { ChatMessage } from '@/types/rocketchat';
import SystemMessage from './SystemMessage';
import FileAttachment from './FileAttachment';
import { ThreadButton } from './ThreadButton';
import { formatMessageTime } from '@/utils/dateUtils';
import { getInitials, getAvatarColor } from '@/utils/avatarUtils';

interface MessageListProps {
  messages: ChatMessage[];
  roomId?: string;
  currentUserId?: number;
  currentUsername?: string;
  onThreadClick?: (message: ChatMessage) => void;
}

function MessageList({ messages, roomId, currentUserId, currentUsername, onThreadClick }: MessageListProps) {

  return (
    <div className="space-y-0.5">
      {messages.map((message, index) => {
        // ✨ Check if this is a system message
        if (message.type) {
          return (
            <SystemMessage 
              key={message.messageId} 
              message={message}
            />
          );
        }
        
        // Extract username and display name
        const msgUsername = message.username || message.user?.username;
        const msgDisplayName = message.user?.name || msgUsername || 'Unknown User';
        
        // Determine if this is current user's message
        const isCurrentUser = msgUsername === currentUsername || message.isCurrentUser;
        
        // Check if consecutive message from same user
        const prevMessage = index > 0 ? messages[index - 1] : null;
        const prevUsername = prevMessage?.username || prevMessage?.user?.username;
        const showAvatar = index === 0 || prevUsername !== msgUsername;
        const isConsecutive = index > 0 && prevUsername === msgUsername;

        return (
          <div
            key={message.messageId}
            className={`group relative ${
              isConsecutive ? 'mt-0.5' : 'mt-5'
            }`}
          >
            <div className={`flex items-end gap-2 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
              {/* Avatar - Apple Style */}
              {!isCurrentUser && (
                <div className="flex-shrink-0 w-7 h-7 mb-0.5">
                  {showAvatar ? (
                    <div
                      className={`w-7 h-7 rounded-full ${getAvatarColor(
                        msgDisplayName
                      )} flex items-center justify-center text-white font-semibold text-[11px] shadow-sm`}
                    >
                      {getInitials(msgDisplayName)}
                    </div>
                  ) : (
                    <div className="w-7 h-7" />
                  )}
                </div>
              )}

              {/* Message Content */}
              <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
                {/* Username & Time - Only for first message */}
                {showAvatar && !isCurrentUser && (
                  <div className="flex items-baseline gap-2 mb-1 px-1">
                    <span className="text-[13px] font-medium text-gray-900 dark:text-white">
                      {msgDisplayName}
                    </span>
                    {message.edited && (
                      <span className="text-[11px] text-gray-400 dark:text-gray-500">
                        đã chỉnh sửa
                      </span>
                    )}
                  </div>
                )}

                {/* Message Bubble - MS Teams Style */}
                {message.deleted ? (
                  <span className="text-[13px] text-gray-400 dark:text-gray-500 italic flex items-center gap-1.5 px-3 py-2">
                    <Trash2 className="w-3.5 h-3.5" />
                    Tin nhắn đã bị xóa
                  </span>
                ) : (
                  <div className="group/bubble relative">
                    {/* File Attachment */}
                    {message.file && (
                      <div className="mb-2">
                        <FileAttachment 
                          file={message.file} 
                          attachment={message.attachments?.[0]}
                          isCurrentUser={isCurrentUser} 
                        />
                      </div>
                    )}

                    {/* Text Message */}
                    {message.text && (
                      <div
                        className={`inline-block px-3 py-2 ${
                          isCurrentUser
                            ? 'bg-[#5B5FC7] dark:bg-[#5B5FC7] text-white rounded-lg shadow-sm'
                            : 'bg-white dark:bg-[#292929] text-gray-900 dark:text-white rounded-lg border border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <p className={`whitespace-pre-wrap break-words leading-[1.4] text-[15px] ${
                          isCurrentUser ? 'text-white' : ''
                        }`}>
                          {message.text}
                        </p>
                      </div>
                    )}
                    
                    {/* Thread Button - Show below message */}
                    {onThreadClick && !message.tmid && roomId && (
                      <div className="mt-1">
                        <ThreadButton 
                          message={message}
                          roomId={roomId}
                          onClick={() => onThreadClick(message)} 
                        />
                      </div>
                    )}
                    
                    {/* Time - Always visible, positioned based on user */}
                    <div className={`text-[11px] mt-1 px-1 ${
                      isCurrentUser 
                        ? 'text-right text-gray-500 dark:text-gray-400' 
                        : 'text-left text-gray-500 dark:text-gray-400'
                    }`}>
                      {formatMessageTime(message.timestamp)}
                      {message.edited && isCurrentUser && (
                        <span className="ml-1.5">· đã chỉnh sửa</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ✨ Memoize MessageList để tránh re-render khi messages không đổi
export default memo(MessageList, (prevProps, nextProps) => {
  // So sánh độ dài và message cuối cùng
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (prevProps.messages.length === 0) return true;
  
  const prevLast = prevProps.messages[prevProps.messages.length - 1];
  const nextLast = nextProps.messages[nextProps.messages.length - 1];
  
  return prevLast.messageId === nextLast.messageId && 
         prevLast.text === nextLast.text;
});
