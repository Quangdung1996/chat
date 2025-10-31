'use client';

import { memo } from 'react';
import { Trash2 } from 'lucide-react';
import type { ChatMessage } from '@/types/rocketchat';

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId?: number;
  currentUsername?: string;
}

function MessageList({ messages, currentUserId, currentUsername }: MessageListProps) {

  const formatTime = (timestamp?: string) => {
    if (!timestamp) {
      console.warn('⚠️ No timestamp provided');
      return 'Vừa xong';
    }
    
    console.log('🕐 Formatting timestamp:', timestamp);
    const date = new Date(timestamp);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('❌ Invalid timestamp format:', timestamp, '| Type:', typeof timestamp);
      return 'Vừa xong';
    }
    
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      const formatted = date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      console.log('✅ Formatted time (today):', formatted);
      return formatted;
    } else {
      const formatted = date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
      console.log('✅ Formatted time (past):', formatted);
      return formatted;
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '??';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      // Lấy chữ cái đầu của 2 từ đầu tiên (cho fullName như "Nguyễn Văn A")
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarColor = (name?: string) => {
    const colors = [
      'bg-gradient-to-br from-blue-400 to-blue-600',
      'bg-gradient-to-br from-purple-400 to-purple-600',
      'bg-gradient-to-br from-pink-400 to-pink-600',
      'bg-gradient-to-br from-green-400 to-green-600',
      'bg-gradient-to-br from-yellow-400 to-yellow-600',
      'bg-gradient-to-br from-red-400 to-red-600',
      'bg-gradient-to-br from-indigo-400 to-indigo-600',
      'bg-gradient-to-br from-teal-400 to-teal-600',
    ];
    if (!name) return colors[0];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="space-y-0.5">
      {messages.map((message, index) => {
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
                    
                    {/* Time - Always visible, positioned based on user */}
                    <div className={`text-[11px] mt-1 px-1 ${
                      isCurrentUser 
                        ? 'text-right text-gray-500 dark:text-gray-400' 
                        : 'text-left text-gray-500 dark:text-gray-400'
                    }`}>
                      {formatTime(message.timestamp)}
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
