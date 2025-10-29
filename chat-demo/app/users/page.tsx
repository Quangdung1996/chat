'use client';

export default function UsersPage() {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="border-b dark:border-gray-700 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          👥 Quản lý người dùng
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          User sync được xử lý tự động bởi Background Job
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">ℹ️</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
                  Đồng bộ tự động
                </h3>
                <div className="text-blue-800 dark:text-blue-300 space-y-2">
                  <p>
                    <strong>Background Job</strong> đã được cấu hình để tự động đồng bộ users từ database nội bộ sang Rocket.Chat.
                  </p>
                  <ul className="list-disc list-inside space-y-1 mt-3">
                    <li>✅ Tự động tạo user trong Rocket.Chat</li>
                    <li>✅ Tự động sinh username unique</li>
                    <li>✅ Lưu mapping vào database</li>
                    <li>✅ Chạy định kỳ mỗi 5 phút</li>
                  </ul>
                  <p className="mt-4 text-sm">
                    Không cần thao tác thủ công. Users sẽ tự động xuất hiện trong Rocket.Chat sau khi được thêm vào DB nội bộ.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📊 Thông tin Background Job
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Service:</span>
                <span className="font-mono text-gray-900 dark:text-white">
                  RocketChatSyncBackgroundService
                </span>
              </div>
              <div className="flex justify-between py-2 border-b dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Tần suất:</span>
                <span className="text-gray-900 dark:text-white">Mỗi 5 phút</span>
              </div>
              <div className="flex justify-between py-2 border-b dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Stored Procedure:</span>
                <span className="font-mono text-gray-900 dark:text-white">
                  sp_GetUsersForRocketChatSync
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600 dark:text-gray-400">Trạng thái:</span>
                <span className="text-green-600 dark:text-green-400 font-semibold">
                  🟢 Đang chạy
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

