'use client';

import { MessageSquare } from 'lucide-react';
import { ChatMessage } from '@/types/rocketchat';

interface ThreadButtonProps {
  message: ChatMessage;
  onClick: () => void;
}

export function ThreadButton({ message, onClick }: ThreadButtonProps) {
  const hasReplies = message.tcount && message.tcount > 0;
  
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
      title={hasReplies ? `${message.tcount} replies` : 'Reply in thread'}
    >
      <MessageSquare className="w-4 h-4" />
      {hasReplies && (
        <span className="font-medium">{message.tcount}</span>
      )}
      {!hasReplies && (
        <span>Reply</span>
      )}
    </button>
  );
}

