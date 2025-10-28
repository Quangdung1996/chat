'use client';

import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import { API_CONFIG } from '@/config/api.config';
import rocketChatService from '@/services/rocketchat.service';

export default function SettingsPage() {
  const [apiStatus, setApiStatus] = useState<string>('Chưa kiểm tra');
  const [loading, setLoading] = useState(false);

  const checkConnection = async () => {
    setLoading(true);
    const isHealthy = await rocketChatService.healthCheck();
    setApiStatus(isHealthy ? '✅ Kết nối thành công' : '❌ Không thể kết nối');
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Cấu hình hệ thống"
        description="Quản lý cấu hình API và kiểm tra kết nối"
      />

      {/* API Configuration */}
      <Card title="🔧 Cấu hình API" className="mb-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Backend URL
              </label>
              <input
                type="text"
                value={API_CONFIG.baseURL}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Timeout
              </label>
              <input
                type="text"
                value={`${API_CONFIG.timeout}ms`}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <button
              onClick={checkConnection}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg"
            >
              {loading ? 'Đang kiểm tra...' : '🔄 Kiểm tra kết nối'}
            </button>
            <span className="ml-4 text-gray-700 dark:text-gray-300">
              {apiStatus}
            </span>
          </div>
        </div>
      </Card>

      {/* Endpoints */}
      <Card title="📡 API Endpoints" className="mb-6">
        <div className="space-y-3">
          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <h4 className="font-semibold text-gray-900 dark:text-white">User Sync</h4>
            <code className="text-sm text-gray-600 dark:text-gray-400 font-mono">
              POST {API_CONFIG.endpoints.rocketChat.syncUser}
            </code>
          </div>

          <div className="border-l-4 border-green-500 pl-4 py-2">
            <h4 className="font-semibold text-gray-900 dark:text-white">Create Group</h4>
            <code className="text-sm text-gray-600 dark:text-gray-400 font-mono">
              POST {API_CONFIG.endpoints.rocketChat.createGroup}
            </code>
          </div>

          <div className="border-l-4 border-purple-500 pl-4 py-2">
            <h4 className="font-semibold text-gray-900 dark:text-white">Add Members</h4>
            <code className="text-sm text-gray-600 dark:text-gray-400 font-mono">
              POST {API_CONFIG.endpoints.rocketChat.addMembers}
            </code>
          </div>

          <div className="border-l-4 border-yellow-500 pl-4 py-2">
            <h4 className="font-semibold text-gray-900 dark:text-white">Send Message</h4>
            <code className="text-sm text-gray-600 dark:text-gray-400 font-mono">
              POST {API_CONFIG.endpoints.rocketChat.sendMessage}
            </code>
          </div>
        </div>
      </Card>

      {/* Environment Variables */}
      <Card title="🌍 Biến môi trường" className="mb-6">
        <div className="bg-gray-900 text-white rounded-lg p-4 font-mono text-sm">
          <p className="text-green-400"># .env.local</p>
          <p className="mt-2">NEXT_PUBLIC_API_URL={API_CONFIG.baseURL}</p>
          <p>NEXT_PUBLIC_API_KEY=***hidden***</p>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          💡 Để thay đổi cấu hình, chỉnh sửa file <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">.env.local</code>
        </p>
      </Card>

      {/* System Info */}
      <Card title="ℹ️ Thông tin hệ thống">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border dark:border-gray-700 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Framework
            </h4>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              Next.js 15
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">React 19</p>
          </div>

          <div className="border dark:border-gray-700 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Styling
            </h4>
            <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
              Tailwind CSS
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">v4</p>
          </div>

          <div className="border dark:border-gray-700 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Language
            </h4>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              TypeScript
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Type-safe</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

