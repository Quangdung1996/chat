'use client';

import { useState } from 'react';
import { API_CONFIG } from '@/config/api.config';

export default function Home() {
  const [apiStatus, setApiStatus] = useState<string>('Chưa kiểm tra');
  const [loading, setLoading] = useState(false);

  const checkApiConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/api/health`, {
        method: 'GET',
      });
      
      if (response.ok) {
        setApiStatus(`✅ Kết nối thành công! (Status: ${response.status})`);
      } else {
        setApiStatus(`⚠️ API phản hồi lỗi (Status: ${response.status})`);
      }
    } catch (error) {
      setApiStatus(`❌ Không thể kết nối đến API: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <main className="w-full max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              💬 Chat Demo App
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Next.js 15 + TypeScript + Tailwind CSS
            </p>
          </div>

          {/* API Configuration Info */}
          <div className="bg-blue-50 dark:bg-gray-700 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              🔧 Cấu hình API
            </h2>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex items-start">
                <span className="text-gray-600 dark:text-gray-400 w-32">Backend URL:</span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold break-all">
                  {API_CONFIG.baseURL}
                </span>
              </div>
              <div className="flex items-start">
                <span className="text-gray-600 dark:text-gray-400 w-32">Timeout:</span>
                <span className="text-gray-900 dark:text-white">
                  {API_CONFIG.timeout}ms
                </span>
              </div>
            </div>
          </div>

          {/* API Test */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              🧪 Kiểm tra kết nối API
            </h2>
            
            <button
              onClick={checkApiConnection}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 mb-4"
            >
              {loading ? 'Đang kiểm tra...' : 'Test Kết Nối Backend'}
            </button>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
                Trạng thái: <span className="font-bold">{apiStatus}</span>
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900 dark:to-pink-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                ⚡ Next.js 15
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                App Router, Server Components, TypeScript
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900 dark:to-teal-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                🎨 Tailwind CSS
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Modern UI với utility-first CSS framework
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900 dark:to-red-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                🔌 API Client
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Sẵn sàng kết nối với .NET Core backend
              </p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900 dark:to-amber-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                💬 Rocket.Chat
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Tích hợp sẵn endpoints cho chat integration
              </p>
            </div>
          </div>

          {/* Quick Start */}
          <div className="bg-gray-900 text-white rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">🚀 Quick Start</h2>
            <div className="space-y-3 font-mono text-sm">
              <div className="flex items-start gap-3">
                <span className="text-green-400">1.</span>
                <div>
                  <p className="text-gray-300 mb-1">Chạy backend:</p>
                  <code className="bg-gray-800 px-3 py-1 rounded block">
                    cd SourceAPI/SourceAPI && dotnet run
                  </code>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400">2.</span>
                <div>
                  <p className="text-gray-300 mb-1">Chạy frontend:</p>
                  <code className="bg-gray-800 px-3 py-1 rounded block">
                    cd chat-demo && npm run dev
                  </code>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400">3.</span>
                <div>
                  <p className="text-gray-300 mb-1">Cấu hình API:</p>
                  <code className="bg-gray-800 px-3 py-1 rounded block">
                    Sửa file .env.local (copy từ .env.example)
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
