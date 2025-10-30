'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import TeamsSidebar from '@/components/TeamsSidebar';

export default function ContactsPage() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
        <TeamsSidebar />
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">📇</div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Danh bạ
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Quản lý danh bạ liên hệ
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

