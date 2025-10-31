'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';

/**
 * HydrationGuard - Đảm bảo Zustand persist hydrate xong trước khi render children
 * Fix lỗi infinite loop trong incognito mode do race condition
 */
export default function HydrationGuard({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  useEffect(() => {
    // ✅ Đợi zustand hydrate xong (từ localStorage)
    if (hasHydrated) {
      setIsHydrated(true);
    } else {
      // ⚠️ Nếu sau 500ms vẫn chưa hydrate → Force hydrate (incognito mode hoặc localStorage bị block)
      const timeout = setTimeout(() => {
        console.warn('⚠️ Zustand hydration timeout - forcing hydration');
        useAuthStore.getState().setHasHydrated(true);
        setIsHydrated(true);
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [hasHydrated]);

  // Show loading screen while hydrating
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5f5f7] dark:bg-[#1c1c1e]">
        <div className="text-center">
          <div className="animate-spin inline-block w-10 h-10 border-[3px] border-current border-t-transparent rounded-full text-[#007aff]" />
          <p className="mt-4 text-[17px] text-gray-600 dark:text-gray-400 font-medium">
            Đang khởi động...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

