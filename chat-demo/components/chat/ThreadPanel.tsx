'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Loader2, Send } from 'lucide-react';
import { ChatMessage } from '@/types/rocketchat';
import { rocketChatService } from '@/services/rocketchat.service';
import MessageEditor, { MessageEditorRef } from './MessageEditor';

interface ThreadPanelProps {
  roomId: string;
  parentMessage: ChatMessage;
  onClose: () => void;
}

export function ThreadPanel({ roomId, parentMessage, onClose }: ThreadPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<MessageEditorRef>(null);

  // Load thread messages
  useEffect(() => {
    loadThreadMessages();
  }, [parentMessage.messageId]);

  const loadThreadMessages = async () => {
    try {
      setLoading(true);
      const response = await rocketChatService.getThreadMessages({
        tmid: parentMessage.messageId,
        roomId,
        count: 50,
      });
      
      if (response.success) {
        setMessages(response.messages);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error loading thread messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || sending) return;

    try {
      setSending(true);
      const response = await rocketChatService.sendMessage({
        roomId,
        text: messageText.trim(),
        tmid: parentMessage.messageId, // Reply in thread
      });

      if (response.success) {
        setMessageText('');
        editorRef.current?.clear();
        editorRef.current?.focus();
        // Reload messages to show new reply
        await loadThreadMessages();
      }
    } catch (error) {
      console.error('Error sending thread message:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed right-0 top-0 h-full w-[400px] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">Thread</h3>
          {messages.length > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {messages.length} {messages.length === 1 ? 'reply' : 'replies'}
            </span>
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
                {parentMessage.timestamp
                  ? new Date(parentMessage.timestamp).toLocaleString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: '2-digit',
                    })
                  : ''}
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap break-words">
              {parentMessage.text}
            </p>
          </div>
        </div>
      </div>

      {/* Thread Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No replies yet. Be the first to reply!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.messageId} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {msg.user?.name?.[0] || msg.username?.[0] || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-sm text-gray-900 dark:text-white">
                    {msg.user?.name || msg.username || 'Unknown'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {msg.timestamp
                      ? new Date(msg.timestamp).toLocaleString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                        })
                      : ''}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap break-words">
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
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <MessageEditor
          ref={editorRef}
          value={messageText}
          onChange={setMessageText}
          onSubmit={handleSendMessage}
          placeholder="Reply in thread..."
          disabled={sending}
          roomId={roomId}
        />
      </div>
    </div>
  );
}

