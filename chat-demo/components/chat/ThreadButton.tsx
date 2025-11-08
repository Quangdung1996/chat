'use client';

import { MessageSquare } from 'lucide-react';
import { ChatMessage } from '@/types/rocketchat';
import { useNotificationStore } from '@/store/notificationStore';

interface ThreadButtonProps {
  message: ChatMessage;
  roomId: string;
  onClick: () => void;
}

export function ThreadButton({ message, roomId, onClick }: ThreadButtonProps) {
  const hasReplies = message.tcount && message.tcount > 0;
  
  // Subscribe directly to threadNotifications Map to ensure re-render on changes
  const threadNotificationCount = useNotificationStore((state) => {
    const roomThreads = state.threadNotifications.get(roomId);
    if (!roomThreads) return 0;
    const notification = roomThreads.get(message.messageId);
    return notification?.count || 0;
  });
  
  const hasUnread = threadNotificationCount > 0;
  
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
        hasUnread
          ? 'text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 font-semibold'
          : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
      }`}
      title={
        hasUnread
          ? `${threadNotificationCount} new ${threadNotificationCount === 1 ? 'reply' : 'replies'}`
          : hasReplies
          ? `${message.tcount} replies`
          : 'Reply in thread'
      }
    >
      <MessageSquare className="w-4 h-4" />
      {hasReplies && (
        <span className="font-medium">{message.tcount}</span>
      )}
      {!hasReplies && (
        <span>Reply</span>
      )}
      {hasUnread && (
        <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full min-w-[18px] text-center">
          {threadNotificationCount}
        </span>
      )}
    </button>
  );
}

