/**
 * Auth Store - Zustand
 * Quản lý state authentication
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  username: string;
  userId?: number;
  fullName?: string;
  email?: string;
  roles?: string[];
}

interface AuthState {
  // State
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  
  // Actions
  setAuth: (token: string, refreshToken: string, user: User) => void;
  clearAuth: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,

      // Set auth info sau khi login
      setAuth: (token, refreshToken, user) =>
        set({
          token,
          refreshToken,
          user,
          isAuthenticated: true,
        }),

      // Clear auth info khi logout
      clearAuth: () =>
        set({
          token: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        }),

      // Update user info
      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage', // LocalStorage key
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

