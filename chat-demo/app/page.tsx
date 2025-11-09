'use client';

import { useState, Suspense } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import TeamsSidebar from '@/components/TeamsSidebar';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { UserSubscription } from '@/types/rocketchat';

function HomeContent() {
  const [selectedRoom, setSelectedRoom] = useState<UserSubscription | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
      <div className="flex h-screen overflow-hidden bg-[#f5f5f7] dark:bg-black">
        {/* Left Navigation Bar - Apple Style */}
        <TeamsSidebar />

        {/* Chat List - Middle Panel */}
        <ChatSidebar
          selectedRoom={selectedRoom}
          onSelectRoom={setSelectedRoom}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Chat Window - Right Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header - Show menu button */}
          <div className="lg:hidden bg-white/80 dark:bg-[#2c2c2e]/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 p-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 dark:text-gray-300 hover:text-[#007aff] dark:hover:text-[#0a84ff] transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Chat Window */}
          {selectedRoom ? (
            <ErrorBoundary>
              <ChatWindow room={selectedRoom} />
            </ErrorBoundary>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-[#f5f5f7] dark:bg-[#1c1c1e]">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#007aff] to-[#5856d6] flex items-center justify-center shadow-xl">
                  <span className="text-5xl">💬</span>
                </div>
                <h2 className="text-[28px] font-semibold text-gray-900 dark:text-white mb-2 tracking-tight">
                  Chọn cuộc trò chuyện
                </h2>
                <p className="text-[17px] text-gray-500 dark:text-gray-400">
                  Chọn một cuộc trò chuyện từ danh sách để bắt đầu
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}

export default function Home() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <div className="flex h-screen items-center justify-center bg-[#f5f5f7] dark:bg-black">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-[#007aff] border-t-transparent animate-spin" />
            <p className="text-[17px] text-gray-500 dark:text-gray-400">Đang tải...</p>
          </div>
        </div>
      }>
        <HomeContent />
      </Suspense>
    </ProtectedRoute>
  );
}
