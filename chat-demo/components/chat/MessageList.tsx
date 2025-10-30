'use client';

import { useState } from 'react';
import { Heart, Reply, MoreHorizontal, Trash2 } from 'lucide-react';
import type { ChatMessage } from '@/types/rocketchat';

interface MessageListProps {
  messages: ChatMessage[];
}

export default function MessageList({ messages }: MessageListProps) {
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  const getAvatarColor = (username: string) => {
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
    const index = username.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="space-y-0">
      {messages.map((message, index) => {
        const showAvatar = index === 0 || messages[index - 1].username !== message.username;
        const isConsecutive = index > 0 && messages[index - 1].username === message.username;
        const isHovered = hoveredMessage === message.messageId;
        const isCurrentUser = message.isCurrentUser;

        return (
          <div
            key={message.messageId}
            className={`group relative px-4 py-1 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors ${
              isConsecutive ? '' : 'mt-3'
            }`}
            onMouseEnter={() => setHoveredMessage(message.messageId)}
            onMouseLeave={() => setHoveredMessage(null)}
          >
            {/* Action Bar - Appears on Hover (Teams Style) */}
            {isHovered && !message.deleted && (
              <div className={`absolute -top-3 z-10 flex items-center gap-0.5 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-1 ${
                isCurrentUser ? 'right-4' : 'right-8'
              }`}>
                <button
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                  title="Thích"
                >
                  <Heart className="w-4 h-4" />
                </button>
                <button
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                  title="Phản hồi"
                >
                  <Reply className="w-4 h-4" />
                </button>
                <button
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                  title="Thêm"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className={`flex items-start gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              {!isCurrentUser && (
                <div className="flex-shrink-0 w-8 h-8 mt-0.5">
                  {showAvatar ? (
                    <div
                      className={`w-8 h-8 rounded-full ${getAvatarColor(
                        message.username
                      )} flex items-center justify-center text-white font-semibold text-xs shadow-sm`}
                    >
                      {getInitials(message.username)}
                    </div>
                  ) : (
                    <div className="w-8 h-8" />
                  )}
                </div>
              )}

              {/* Message Content */}
              <div className={`flex-1 min-w-0 ${isCurrentUser ? 'flex flex-col items-end' : ''}`}>
                {showAvatar && !isCurrentUser && (
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">
                      {message.username}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(message.timestamp)}
                    </span>
                    {message.edited && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                        (đã chỉnh sửa)
                      </span>
                    )}
                  </div>
                )}

                {/* Message Text */}
                <div className={`text-sm ${isConsecutive ? 'mt-0' : 'mt-0.5'} ${
                  isCurrentUser ? 'max-w-[70%]' : ''
                }`}>
                  {message.deleted ? (
                    <span className="text-gray-400 dark:text-gray-500 italic flex items-center gap-1">
                      <Trash2 className="w-3 h-3" />
                      Tin nhắn đã bị xóa
                    </span>
                  ) : (
                    <div className={`inline-block px-3 py-2 rounded-lg ${
                      isCurrentUser 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }`}>
                      <p className="whitespace-pre-wrap break-words leading-relaxed">
                        {message.text}
                      </p>
                      {isCurrentUser && (
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-xs text-blue-100">
                            {formatTime(message.timestamp)}
                          </span>
                          {message.edited && (
                            <span className="text-xs text-blue-200 italic">
                              (đã sửa)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Timestamp on hover (for consecutive messages from others) */}
              {isConsecutive && isHovered && !isCurrentUser && (
                <div className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  {formatTime(message.timestamp)}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

