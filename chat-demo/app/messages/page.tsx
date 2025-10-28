'use client';

import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import rocketChatService from '@/services/rocketchat.service';
import type { SendMessageRequest, ChatMessage } from '@/types/rocketchat';

export default function MessagesPage() {
  const [roomId, setRoomId] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sentMessageId, setSentMessageId] = useState('');

  // Gửi tin nhắn
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText) return;

    setLoading(true);
    try {
      const request: SendMessageRequest = {
        roomId: roomId || undefined,
        groupCode: groupCode || undefined,
        text: messageText,
      };
      const response = await rocketChatService.sendMessage(request);
      if (response.success && response.data) {
        setSentMessageId(response.data.messageId);
        setMessageText('');
        alert('✅ Đã gửi tin nhắn!');
      }
    } catch (error) {
      alert('❌ Lỗi: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Tải lịch sử tin nhắn
  const loadMessages = async () => {
    if (!roomId) return;
    setLoading(true);
    try {
      const response = await rocketChatService.getMessages(roomId, { page: 1, pageSize: 50 });
      if (response.success && response.data) {
        setMessages(response.data.data);
      }
    } catch (error) {
      alert('❌ Lỗi: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Xóa tin nhắn
  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Xác nhận xóa tin nhắn này?')) return;
    setLoading(true);
    try {
      const response = await rocketChatService.deleteMessage(messageId);
      if (response.success) {
        alert('✅ Đã xóa tin nhắn');
        loadMessages();
      }
    } catch (error) {
      alert('❌ Lỗi: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Pin message
  const handlePinMessage = async (messageId: string) => {
    setLoading(true);
    try {
      const response = await rocketChatService.pinMessage(messageId);
      if (response.success) {
        alert('✅ Đã pin tin nhắn');
      }
    } catch (error) {
      alert('❌ Lỗi: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Quản lý tin nhắn"
        description="Gửi tin nhắn, xem lịch sử và kiểm duyệt nội dung"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gửi tin nhắn */}
        <Card title="📨 Gửi tin nhắn">
          <form onSubmit={handleSendMessage} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Room ID
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="abc123..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hoặc Group Code
              </label>
              <input
                type="text"
                value={groupCode}
                onChange={(e) => setGroupCode(e.target.value)}
                placeholder="IT-PROJECT-2025"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nội dung tin nhắn *
              </label>
              <textarea
                required
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={4}
                placeholder="Nhập tin nhắn..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading || (!roomId && !groupCode)}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg"
            >
              {loading ? 'Đang gửi...' : '📤 Gửi tin nhắn'}
            </button>
          </form>

          {sentMessageId && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-400">
                ✅ Message ID: <span className="font-mono">{sentMessageId}</span>
              </p>
            </div>
          )}
        </Card>

        {/* Room Settings */}
        <Card title="⚙️ Cài đặt phòng">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Room ID để cấu hình
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Nhập Room ID..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  const enabled = confirm('Bật announcement mode (chỉ owner/moderator post)?');
                  if (roomId) {
                    rocketChatService.setAnnouncementMode(roomId, enabled);
                  }
                }}
                disabled={!roomId}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg"
              >
                📢 Bật/tắt Announcement Mode
              </button>

              <button
                onClick={() => {
                  const topic = prompt('Nhập topic/announcement:');
                  if (topic && roomId) {
                    rocketChatService.setRoomTopic(roomId, topic);
                  }
                }}
                disabled={!roomId}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg"
              >
                📝 Đặt Topic
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Lịch sử tin nhắn */}
      <Card title="📜 Lịch sử tin nhắn" className="mt-6">
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Room ID..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={loadMessages}
            disabled={!roomId || loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg"
          >
            🔄 Tải tin nhắn
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Đang tải...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Chưa có tin nhắn</div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {messages.map((msg) => (
              <div
                key={msg.messageId}
                className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      @{msg.username}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      {new Date(msg.timestamp).toLocaleString('vi-VN')}
                    </span>
                    {msg.deleted && (
                      <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                        Đã xóa
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePinMessage(msg.messageId)}
                      className="text-yellow-600 hover:text-yellow-700 text-sm"
                    >
                      📌
                    </button>
                    <button
                      onClick={() => handleDeleteMessage(msg.messageId)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300">{msg.text}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

