'use client';

import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import rocketChatService from '@/services/rocketchat.service';
import type { SyncUserRequest, SyncUserResponse } from '@/types/rocketchat';

export default function UsersPage() {
  const [formData, setFormData] = useState<SyncUserRequest>({
    userId: 0,
    email: '',
    fullName: '',
    department: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncUserResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await rocketChatService.syncUser(formData);
      if (response.success && response.data) {
        setResult(response.data);
        // Reset form
        setFormData({
          userId: 0,
          email: '',
          fullName: '',
          department: '',
        });
      } else {
        setError(response.message || 'Đồng bộ user thất bại');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Quản lý người dùng"
        description="Đồng bộ người dùng từ hệ thống vào Rocket.Chat"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form đồng bộ user */}
        <Card title="Đồng bộ người dùng">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                User ID *
              </label>
              <input
                type="number"
                required
                value={formData.userId || ''}
                onChange={(e) =>
                  setFormData({ ...formData, userId: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Họ tên *
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phòng ban
              </label>
              <input
                type="text"
                value={formData.department || ''}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="IT"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? 'Đang xử lý...' : '🔄 Đồng bộ User'}
            </button>
          </form>
        </Card>

        {/* Kết quả */}
        <div className="space-y-6">
          {/* Success */}
          {result && (
            <Card title="✅ Đồng bộ thành công">
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">User ID:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {result.userId}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Rocket User ID:</span>
                  <span className="font-mono text-sm text-gray-900 dark:text-white">
                    {result.rocketUserId}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Username:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    @{result.username}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Error */}
          {error && (
            <Card title="❌ Lỗi">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-700 dark:text-red-400">{error}</p>
              </div>
            </Card>
          )}

          {/* Hướng dẫn */}
          <Card title="📖 Hướng dẫn">
            <div className="prose dark:prose-invert prose-sm">
              <ul className="text-gray-600 dark:text-gray-400 space-y-2">
                <li>Nhập thông tin user từ hệ thống nội bộ</li>
                <li>Hệ thống sẽ tự động tạo username unique</li>
                <li>Mật khẩu được sinh tự động và lưu an toàn</li>
                <li>Mapping được lưu vào database</li>
                <li>Idempotent - gọi nhiều lần không tạo trùng</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

