/**
 * Auth Store - Zustand
 * Quản lý state authentication
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: number; // userId from API
  username: string;
  displayName?: string;
  emailAddress?: string;
  profilePicturePath?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  uniqueId?: string;
  roles?: string[];
}

interface AuthState {
  // State
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  
  // Rocket.Chat tokens
  rocketChatToken: string | null;
  rocketChatUserId: string | null;
  
  // Actions
  setAuth: (token: string, refreshToken: string, user: User) => void;
  clearAuth: () => void;
  setUser: (user: User) => void;
  setRocketChatAuth: (authToken: string, userId: string) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,
      rocketChatToken: null,
      rocketChatUserId: null,

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
          rocketChatToken: null,
          rocketChatUserId: null,
        }),

      // Update user info
      setUser: (user) => set({ user }),

      // Set Rocket.Chat auth tokens
      setRocketChatAuth: (authToken, userId) =>
        set({
          rocketChatToken: authToken,
          rocketChatUserId: userId,
        }),

      // Set hydration state
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'auth-storage', // LocalStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        rocketChatToken: state.rocketChatToken,
        rocketChatUserId: state.rocketChatUserId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

