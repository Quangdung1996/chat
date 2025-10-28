'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import authService from '@/services/auth.service';

export default function UserMenu() {
  const router = useRouter();
  const { user, token, clearAuth } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      if (token) {
        await authService.logout(token);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
      setLoggingOut(false);
      router.push('/login');
    }
  };

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="relative">
      {/* User Avatar Button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
          {getInitials(user.fullName || user.username)}
        </div>
        <div className="hidden lg:block text-left">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {user.fullName || user.username}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            @{user.username}
          </p>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${showMenu ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="absolute bottom-full mb-2 left-0 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 z-20">
            <div className="p-4 border-b dark:border-gray-700">
              <p className="font-semibold text-gray-900 dark:text-white">
                {user.fullName || user.username}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user.email || `@${user.username}`}
              </p>
            </div>

            <div className="p-2">
              <button
                onClick={() => {
                  setShowMenu(false);
                  router.push('/settings');
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors"
              >
                ⚙️ Cài đặt
              </button>

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm text-red-600 dark:text-red-400 transition-colors disabled:opacity-50"
              >
                {loggingOut ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                    Đang đăng xuất...
                  </span>
                ) : (
                  '🚪 Đăng xuất'
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

