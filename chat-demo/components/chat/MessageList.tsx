import type { ChatMessage } from '@/types/rocketchat';

interface MessageListProps {
  messages: ChatMessage[];
}

export default function MessageList({ messages }: MessageListProps) {
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
      'bg-red-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
    ];
    const index = username.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <>
      {messages.map((message, index) => {
        const showAvatar = index === 0 || messages[index - 1].username !== message.username;
        const isConsecutive = index > 0 && messages[index - 1].username === message.username;

        return (
          <div
            key={message.messageId}
            className={`flex items-start gap-3 ${isConsecutive ? 'mt-1' : 'mt-4'}`}
          >
            {/* Avatar */}
            {showAvatar ? (
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full ${getAvatarColor(
                  message.username
                )} flex items-center justify-center text-white font-semibold text-sm`}
              >
                {getInitials(message.username)}
              </div>
            ) : (
              <div className="flex-shrink-0 w-10" />
            )}

            {/* Message Content */}
            <div className="flex-1 min-w-0">
              {showAvatar && (
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {message.username}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              )}

              {/* Message Text */}
              <div
                className={`
                  inline-block px-4 py-2 rounded-lg
                  ${
                    message.deleted
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 italic'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                  }
                  ${message.edited ? 'border-l-2 border-yellow-500' : ''}
                  shadow-sm
                `}
              >
                {message.deleted ? (
                  <span className="text-sm">🗑️ Tin nhắn đã bị xóa</span>
                ) : (
                  <>
                    <p className="whitespace-pre-wrap break-words">{message.text}</p>
                    {message.edited && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        (đã chỉnh sửa)
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Hover Actions */}
              {!message.deleted && (
                <div className="opacity-0 hover:opacity-100 transition-opacity mt-1">
                  <div className="flex items-center gap-2">
                    <button
                      className="text-xs text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                      title="Phản ứng"
                    >
                      👍
                    </button>
                    <button
                      className="text-xs text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                      title="Trả lời"
                    >
                      💬 Trả lời
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

