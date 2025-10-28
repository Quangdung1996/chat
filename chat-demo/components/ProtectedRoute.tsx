'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Đợi zustand hydrate từ localStorage
    if (hasHydrated) {
      setIsChecking(false);
      
      // Sau khi hydrate xong, check auth
      if (!isAuthenticated) {
        router.push('/login');
      }
    }
  }, [hasHydrated, isAuthenticated, router]);

  // Đang đợi hydration hoặc đang checking
  if (!hasHydrated || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Chưa auth → sẽ redirect (nhưng hiển thị loading trước)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Đang chuyển hướng...</p>
        </div>
      </div>
    );
  }

  // Đã auth → render children
  return <>{children}</>;
}

