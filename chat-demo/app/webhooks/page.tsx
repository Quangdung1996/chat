'use client';

import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';

export default function WebhooksPage() {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [testPayload, setTestPayload] = useState(`{
  "event": "message",
  "roomId": "abc123",
  "userId": "xyz789",
  "timestamp": "${new Date().toISOString()}",
  "data": {
    "text": "Hello from webhook!"
  }
}`);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Webhook Integration"
        description="Cấu hình và test webhooks từ Rocket.Chat"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cấu hình Webhook */}
        <Card title="⚙️ Cấu hình Webhook">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Webhook URL
              </label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-domain.com/api/webhooks/rocketchat"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Webhook Secret
              </label>
              <input
                type="password"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder="your-webhook-secret-key"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                📋 Các bước cấu hình trong Rocket.Chat:
              </h4>
              <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
                <li>Vào Administration → Integrations</li>
                <li>Chọn "New Integration" → "Outgoing WebHook"</li>
                <li>Chọn Event Type: Message Sent / User Joined / User Left</li>
                <li>Nhập URL endpoint của bạn</li>
                <li>Bật "Enabled" và lưu lại</li>
              </ol>
            </div>
          </div>
        </Card>

        {/* Supported Events */}
        <Card title="📡 Các sự kiện hỗ trợ">
          <div className="space-y-3">
            <div className="border-l-4 border-green-500 pl-4 py-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">💬 Message</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Khi có tin nhắn mới trong room
              </p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">🚪 Join</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Khi user tham gia room
              </p>
            </div>

            <div className="border-l-4 border-red-500 pl-4 py-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">👋 Leave</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Khi user rời khỏi room
              </p>
            </div>

            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">🏠 Room Created</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Khi tạo room mới từ Rocket.Chat UI
              </p>
            </div>

            <div className="border-l-4 border-yellow-500 pl-4 py-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">🗑️ Room Deleted</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Khi xóa room từ Rocket.Chat UI
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Test Payload */}
      <Card title="🧪 Test Webhook Payload" className="mt-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sample Payload (JSON)
            </label>
            <textarea
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white font-mono text-sm"
            />
          </div>

          <button
            onClick={() => {
              try {
                JSON.parse(testPayload);
                alert('✅ JSON hợp lệ!');
              } catch {
                alert('❌ JSON không hợp lệ!');
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg"
          >
            ✓ Validate JSON
          </button>
        </div>
      </Card>

      {/* Security Features */}
      <Card title="🔐 Tính năng bảo mật" className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border dark:border-gray-700 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              🔑 Token Validation
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Xác thực webhook token để chắc chắn request từ Rocket.Chat
            </p>
          </div>

          <div className="border dark:border-gray-700 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              🛡️ HMAC Signature
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Kiểm tra chữ ký HMAC để đảm bảo tính toàn vẹn dữ liệu
            </p>
          </div>

          <div className="border dark:border-gray-700 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              ⚡ Rate Limiting
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Giới hạn số lượng requests để tránh abuse
            </p>
          </div>

          <div className="border dark:border-gray-700 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              📝 Audit Logging
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ghi log tất cả webhook events với correlationId
            </p>
          </div>
        </div>
      </Card>

      {/* Background Processing */}
      <Card title="⚙️ Background Processing" className="mt-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
            ⏱️ Quy trình xử lý webhook:
          </h4>
          <ol className="text-sm text-yellow-800 dark:text-yellow-300 space-y-2 list-decimal list-inside">
            <li>
              <strong>Nhận webhook:</strong> Endpoint trả về 200 OK ngay lập tức (&lt;200ms)
            </li>
            <li>
              <strong>Enqueue job:</strong> Đẩy event vào background queue (Hangfire/BackgroundService)
            </li>
            <li>
              <strong>Xử lý nền:</strong> Worker xử lý event (log tin nhắn, cập nhật DB, trigger actions)
            </li>
            <li>
              <strong>Retry logic:</strong> Tự động retry khi gặp lỗi tạm thời
            </li>
          </ol>
        </div>
      </Card>
    </div>
  );
}

