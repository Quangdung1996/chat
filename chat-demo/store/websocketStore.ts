/**
 * WebSocket Store - Zustand
 * Quản lý WebSocket connection state và subscriptions
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { rocketChatWS } from '@/services/rocketchat-websocket.service';

interface WebSocketState {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  isAuthenticated: boolean;
  connectionError: string | null;
  
  // Active subscriptions
  activeSubscriptions: Set<string>;
  
  // Actions
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setConnectionError: (error: string | null) => void;
  addSubscription: (subscriptionId: string) => void;
  removeSubscription: (subscriptionId: string) => void;
  clearSubscriptions: () => void;
  
  // Connection management
  connect: () => Promise<void>;
  disconnect: () => void;
  
  // Check connection status
  checkConnection: () => boolean;
}

export const useWebSocketStore = create<WebSocketState>()(
  devtools(
    (set, get) => ({
      // Initial state
      isConnected: false,
      isConnecting: false,
      isAuthenticated: false,
      connectionError: null,
      activeSubscriptions: new Set(),

      // Set connected state
      setConnected: (connected) => {
        set({ isConnected: connected });
      },

      // Set connecting state
      setConnecting: (connecting) => {
        set({ isConnecting: connecting });
      },

      // Set authenticated state
      setAuthenticated: (authenticated) => {
        set({ isAuthenticated: authenticated });
      },

      // Set connection error
      setConnectionError: (error) => {
        set({ connectionError: error });
      },

      // Add subscription
      addSubscription: (subscriptionId) => {
        set((state) => {
          const newSubs = new Set(state.activeSubscriptions);
          newSubs.add(subscriptionId);
          return { activeSubscriptions: newSubs };
        });
      },

      // Remove subscription
      removeSubscription: (subscriptionId) => {
        set((state) => {
          const newSubs = new Set(state.activeSubscriptions);
          newSubs.delete(subscriptionId);
          return { activeSubscriptions: newSubs };
        });
      },

      // Clear all subscriptions
      clearSubscriptions: () => {
        set({ activeSubscriptions: new Set() });
      },

      // Connect WebSocket
      connect: async () => {
        const state = get();
        
        // Already connected
        if (state.isConnected && state.isAuthenticated) {
          return;
        }
        
        // Already connecting
        if (state.isConnecting) {
          return;
        }
        
        set({ isConnecting: true, connectionError: null });
        
        try {
          // Connect DDP
          await rocketChatWS.connect();
          set({ isConnected: true });
          
          // Authenticate
          await rocketChatWS.authenticateWithStoredToken();
          set({ isAuthenticated: true, isConnecting: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          set({
            isConnected: false,
            isAuthenticated: false,
            isConnecting: false,
            connectionError: errorMessage,
          });
          throw error;
        }
      },

      // Disconnect WebSocket
      disconnect: () => {
        rocketChatWS.disconnect();
        set({
          isConnected: false,
          isAuthenticated: false,
          isConnecting: false,
          connectionError: null,
          activeSubscriptions: new Set(),
        });
      },

      // Check connection status
      checkConnection: () => {
        const isConnected = rocketChatWS.isConnected();
        const state = get();
        
        if (isConnected !== state.isConnected) {
          set({ isConnected });
        }
        
        return isConnected;
      },
    }),
    { name: 'WebSocketStore' }
  )
);

// Selector hooks
export const useWebSocketConnected = () => {
  return useWebSocketStore((state) => state.isConnected && state.isAuthenticated);
};

export const useWebSocketConnecting = () => {
  return useWebSocketStore((state) => state.isConnecting);
};

export const useWebSocketError = () => {
  return useWebSocketStore((state) => state.connectionError);
};

