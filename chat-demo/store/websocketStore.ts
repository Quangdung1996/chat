/**
 * WebSocket Store - Zustand
 * Centralized WebSocket connection and subscription management
 * 
 * Features:
 * - Ref-counted subscriptions (room + threads)
 * - Automatic cleanup on unmount
 * - Thread notification handling
 * - Connection state management
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { rocketChatWS } from '@/services/rocketchat-websocket.service';
import { useNotificationStore } from './notificationStore';
import { useAuthStore } from './authStore';

// ===== TYPES =====

interface WebSocketMessage {
  _id: string;
  rid: string;
  msg?: string;
  tmid?: string;
  u: {
    _id: string;
    username?: string;
    name?: string;
  };
  ts?: string;
  [key: string]: any;
}

interface RoomSubscription {
  roomId: string;
  subscriptionId: string;
  refCount: number;
  threadRefCounts: Map<string, number>;
}

type ConnectionErrorType = 'not connected' | 'timeout' | 'failed to send' | 'reconnect failed';

// ===== CONSTANTS =====

const MARK_AS_READ_DEBOUNCE_MS = 1000;
const CONNECTION_ERROR_PATTERNS: ConnectionErrorType[] = [
  'not connected',
  'timeout',
  'failed to send',
  'reconnect failed',
];

interface WebSocketState {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  isAuthenticated: boolean;
  connectionError: string | null;
  
  // Active subscriptions - managed centrally
  activeSubscriptions: Set<string>;
  roomSubscriptions: Map<string, RoomSubscription>; // roomId -> subscription info (includes thread tracking)
  
  // Actions
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setConnectionError: (error: string | null) => void;
  addSubscription: (subscriptionId: string) => void;
  removeSubscription: (subscriptionId: string) => void;
  clearSubscriptions: () => void;
  
  // Room subscription management (centralized)
  subscribeToRoom: (roomId: string) => void;
  unsubscribeFromRoom: (roomId: string) => void;
  
  // Thread subscription management (centralized)
  subscribeToThread: (roomId: string, tmid: string) => void;
  unsubscribeFromThread: (roomId: string, tmid: string) => void;
  
  // Connection management
  connect: () => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;
  
  // Check connection status
  checkConnection: () => boolean;
  
  // Mark room as read (debounced)
  markRoomAsRead: (roomId: string) => void;
}

// ===== EXTERNAL STATE (persists outside store) =====

const markRoomAsReadTimers = new Map<string, NodeJS.Timeout>();

// ===== HELPER FUNCTIONS =====

/**
 * Validates WebSocket message structure
 */
function isValidMessage(message: any): message is WebSocketMessage {
  return !!(
    message?._id &&
    message?.rid &&
    message?.u &&
    message?.u._id
  );
}

/**
 * Checks if user is currently viewing a thread
 */
function isViewingThread(
  roomSub: RoomSubscription | undefined,
  tmid: string
): boolean {
  if (!roomSub) return false;
  const refCount = roomSub.threadRefCounts.get(tmid) || 0;
  return refCount > 0;
}

/**
 * Calculates total reference count (room + all threads)
 */
function calculateTotalRefs(roomSub: RoomSubscription): number {
  const threadRefsTotal = Array.from(roomSub.threadRefCounts.values()).reduce(
    (sum, count) => sum + count,
    0
  );
  return roomSub.refCount + threadRefsTotal;
}

/**
 * Checks if error is a connection-related error
 */
function isConnectionError(errorMessage: string): boolean {
  return CONNECTION_ERROR_PATTERNS.some((pattern) =>
    errorMessage.toLowerCase().includes(pattern)
  );
}

/**
 * Handles thread reply messages - updates notifications based on user state
 */
function handleThreadMessage(
  message: WebSocketMessage,
  roomId: string,
  getRoomSubscription: () => RoomSubscription | undefined
): void {
  if (!message.tmid) return;

  const notificationStore = useNotificationStore.getState();
  const authStore = useAuthStore.getState();
  const currentUserId = authStore.rocketChatUserId;
  const isFromCurrentUser = message.u._id === currentUserId;
  const roomSub = getRoomSubscription();
  const isViewing = isViewingThread(roomSub, message.tmid);

  // User sent their own message
  if (isFromCurrentUser) {
    if (isViewing) {
      notificationStore.clearThreadNotification(roomId, message.tmid);
    }
    return;
  }

  // Message from another user
  if (isViewing) {
    // User is viewing thread, clear notification
    notificationStore.clearThreadNotification(roomId, message.tmid);
  } else {
    // User not viewing, add notification
    notificationStore.addThreadNotification(
      roomId,
      message.tmid,
      message.u?.username
    );
  }
}

/**
 * Creates message handler for room subscription
 */
function createRoomMessageHandler(
  roomId: string,
  getRoomSubscription: () => RoomSubscription | undefined
) {
  return (message: any) => {
    if (!isValidMessage(message)) {
      console.warn('⚠️ Invalid WebSocket message, skipping:', message);
      return;
    }

    // Handle thread replies
    if (message.tmid) {
      handleThreadMessage(message, roomId, getRoomSubscription);
      return; // Thread replies don't go to main message cache
    }

    // Regular room messages can be handled by messageStore if needed
    console.log(`📨 [Store] Regular message received for room ${roomId}:`, message._id);
  };
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
      roomSubscriptions: new Map(),

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
        set({ 
          activeSubscriptions: new Set(), 
          roomSubscriptions: new Map(),
        });
      },
      
      // Subscribe to room (centralized, ref-counted)
      subscribeToRoom: (roomId: string) => {
        const state = get();
        const existing = state.roomSubscriptions.get(roomId);
        
        if (existing) {
          // Increment ref count for existing subscription
          const updated = new Map(state.roomSubscriptions);
          updated.set(roomId, {
            ...existing,
            refCount: existing.refCount + 1,
          });
          set({ roomSubscriptions: updated });
          console.log(`♻️ Room ${roomId} subscription reused (refCount: ${existing.refCount + 1})`);
          return;
        }
        
        // Create new subscription
        console.log(`🆕 Subscribing to room ${roomId}...`);
        const messageHandler = createRoomMessageHandler(roomId, () => {
          return get().roomSubscriptions.get(roomId);
        });
        
        const subscriptionId = rocketChatWS.subscribeToRoomMessages(roomId, messageHandler);
        
        const updated = new Map(state.roomSubscriptions);
        updated.set(roomId, {
          roomId,
          subscriptionId,
          refCount: 1,
          threadRefCounts: new Map(),
        });
        
        set({ roomSubscriptions: updated });
        state.addSubscription(subscriptionId);
      },
      
      // Unsubscribe from room (ref-counted)
      unsubscribeFromRoom: (roomId: string) => {
        const state = get();
        const existing = state.roomSubscriptions.get(roomId);
        
        if (!existing) {
          return;
        }
        
        const newRefCount = existing.refCount - 1;
        const updatedRoomSub = {
          ...existing,
          refCount: newRefCount,
        };
        const totalRefs = calculateTotalRefs(updatedRoomSub);
        
        if (totalRefs > 0) {
          // Still have other subscribers, just decrement ref count
          const updated = new Map(state.roomSubscriptions);
          updated.set(roomId, updatedRoomSub);
          set({ roomSubscriptions: updated });
          
          const threadRefsTotal = totalRefs - newRefCount;
          console.log(`♻️ Room ${roomId} refCount decreased to ${newRefCount} (${threadRefsTotal} thread refs active)`);
          return;
        }
        
        // Last subscriber, actually unsubscribe
        console.log(`🗑️ Unsubscribing from room ${roomId} (no more refs)...`);
        rocketChatWS.unsubscribe(existing.subscriptionId);
        
        const updated = new Map(state.roomSubscriptions);
        updated.delete(roomId);
        set({ roomSubscriptions: updated });
        state.removeSubscription(existing.subscriptionId);
      },
      
      // Subscribe to thread (centralized, ref-counted)
      // Threads share the same room subscription
      subscribeToThread: (roomId: string, tmid: string) => {
        const state = get();
        let roomSub = state.roomSubscriptions.get(roomId);
        
        // Create room subscription if it doesn't exist
        if (!roomSub) {
          console.log(`🆕 Creating room subscription for thread ${roomId}:${tmid}...`);
          const messageHandler = createRoomMessageHandler(roomId, () => {
            return get().roomSubscriptions.get(roomId);
          });
          
          const subscriptionId = rocketChatWS.subscribeToRoomMessages(roomId, messageHandler);
          
          roomSub = {
            roomId,
            subscriptionId,
            refCount: 0, // No room-level refs yet
            threadRefCounts: new Map(),
          };
          
          const updated = new Map(state.roomSubscriptions);
          updated.set(roomId, roomSub);
          set({ roomSubscriptions: updated });
          state.addSubscription(subscriptionId);
        }
        
        // Increment thread ref count
        const currentThreadRefCount = roomSub.threadRefCounts.get(tmid) || 0;
        const updated = new Map(state.roomSubscriptions);
        const updatedRoomSub = {
          ...roomSub,
          threadRefCounts: new Map(roomSub.threadRefCounts),
        };
        updatedRoomSub.threadRefCounts.set(tmid, currentThreadRefCount + 1);
        updated.set(roomId, updatedRoomSub);
        set({ roomSubscriptions: updated });
        
        console.log(`♻️ Thread ${roomId}:${tmid} refCount: ${currentThreadRefCount + 1}`);
      },
      
      // Unsubscribe from thread (ref-counted)
      unsubscribeFromThread: (roomId: string, tmid: string) => {
        const state = get();
        const roomSub = state.roomSubscriptions.get(roomId);
        
        if (!roomSub) {
          return;
        }
        
        const currentThreadRefCount = roomSub.threadRefCounts.get(tmid) || 0;
        const newThreadRefCount = Math.max(0, currentThreadRefCount - 1);
        
        const updated = new Map(state.roomSubscriptions);
        const updatedRoomSub = {
          ...roomSub,
          threadRefCounts: new Map(roomSub.threadRefCounts),
        };
        
        if (newThreadRefCount === 0) {
          updatedRoomSub.threadRefCounts.delete(tmid);
          console.log(`🗑️ Removed thread ${roomId}:${tmid} (no more refs)`);
        } else {
          updatedRoomSub.threadRefCounts.set(tmid, newThreadRefCount);
          console.log(`♻️ Thread ${roomId}:${tmid} refCount decreased to ${newThreadRefCount}`);
        }
        
        const totalRefs = calculateTotalRefs(updatedRoomSub);
        
        if (totalRefs === 0) {
          // No more refs at all, unsubscribe from room
          console.log(`🗑️ Unsubscribing from room ${roomId} (no more refs after thread cleanup)...`);
          rocketChatWS.unsubscribe(updatedRoomSub.subscriptionId);
          updated.delete(roomId);
          state.removeSubscription(updatedRoomSub.subscriptionId);
        } else {
          updated.set(roomId, updatedRoomSub);
        }
        
        set({ roomSubscriptions: updated });
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

      // Reconnect WebSocket (manual trigger)
      reconnect: async () => {
        const state = get();
        
        // Don't reconnect if already connecting
        if (state.isConnecting) {
          console.log('⏳ Already reconnecting, skipping...');
          return;
        }
        
        set({ isConnecting: true, connectionError: null });
        
        try {
          await rocketChatWS.reconnect();
          set({ 
            isConnected: true, 
            isAuthenticated: true, 
            isConnecting: false,
            connectionError: null 
          });
          console.log('✅ Manual reconnect successful');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          set({
            isConnected: false,
            isAuthenticated: false,
            isConnecting: false,
            connectionError: errorMessage,
          });
          console.error('❌ Manual reconnect failed:', error);
          throw error;
        }
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
      
      // Mark room as read (debounced to prevent rate limiting)
      markRoomAsRead: (roomId: string) => {
        // Clear existing timer for this room
        const existingTimer = markRoomAsReadTimers.get(roomId);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }
        
        // Set new debounced timer
        const timer = setTimeout(async () => {
          try {
            await rocketChatWS.markRoomAsRead(roomId);
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.warn('⚠️ Failed to mark room as read:', errorMessage);
            
            // Trigger reconnect on connection errors
            if (isConnectionError(errorMessage)) {
              console.log('🔄 Connection error detected in markRoomAsRead, triggering reconnect...');
              const state = get();
              if (!state.isConnecting) {
                state.reconnect().catch((reconnectError) => {
                  console.error('❌ Reconnect from markRoomAsRead failed:', reconnectError);
                });
              }
            }
          } finally {
            // Clean up timer
            markRoomAsReadTimers.delete(roomId);
          }
        }, MARK_AS_READ_DEBOUNCE_MS);
        
        markRoomAsReadTimers.set(roomId, timer);
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

