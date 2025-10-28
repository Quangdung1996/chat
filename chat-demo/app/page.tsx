'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import type { Room } from '@/types/rocketchat';

export default function Home() {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Sidebar - Danh sách rooms */}
      <ChatSidebar
        selectedRoom={selectedRoom}
        onSelectRoom={setSelectedRoom}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Chat Window */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header - Show menu button */}
        <div className="lg:hidden bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-700 dark:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Chat Window */}
        {selectedRoom ? (
          <ChatWindow room={selectedRoom} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                Chọn một phòng chat
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Chọn một phòng từ danh sách bên trái để bắt đầu chat
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
    </ProtectedRoute>
  );
}
