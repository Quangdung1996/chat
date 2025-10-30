'use client';

import { useState } from 'react';
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
              <div className="absolute -top-3 right-8 z-10 flex items-center gap-0.5 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-1">
                <button
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                  title="Thích"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                <button
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                  title="Phản hồi"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </button>
                <button
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                  title="Thêm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                  </svg>
                </button>
              </div>
            )}

            <div className="flex items-start gap-3">
              {/* Avatar */}
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

              {/* Message Content */}
              <div className="flex-1 min-w-0">
                {showAvatar && (
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
                <div className={`text-sm ${isConsecutive ? 'mt-0' : 'mt-0.5'}`}>
                  {message.deleted ? (
                    <span className="text-gray-400 dark:text-gray-500 italic">
                      <svg className="w-3 h-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Tin nhắn đã bị xóa
                    </span>
                  ) : (
                    <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words leading-relaxed">
                      {message.text}
                    </p>
                  )}
                </div>
              </div>

              {/* Timestamp on hover (for consecutive messages) */}
              {isConsecutive && isHovered && (
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

