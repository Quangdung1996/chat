/**
 * WebSocket Store - Zustand
 * Quản lý WebSocket connection state và subscriptions
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { rocketChatWS } from '@/services/rocketchat-websocket.service';
import { useNotificationStore } from './notificationStore';
import { useAuthStore } from './authStore';

interface RoomSubscription {
  roomId: string;
  subscriptionId: string;
  refCount: number; // Số components đang dùng subscription này (room + all threads)
  threadRefCounts: Map<string, number>; // tmid -> refCount
}

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

// Debounce timers for markRoomAsRead (outside store to persist)
const markRoomAsReadTimers = new Map<string, NodeJS.Timeout>();
const MARK_AS_READ_DEBOUNCE_MS = 1000; // 1 second

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
          // Already subscribed, increment ref count
          const updated = new Map(state.roomSubscriptions);
          updated.set(roomId, {
            ...existing,
            refCount: existing.refCount + 1,
          });
          set({ roomSubscriptions: updated });
          console.log(`♻️ Room ${roomId} subscription reused (refCount: ${existing.refCount + 1})`);
          return;
        }
        
        // New subscription needed
        console.log(`🆕 Subscribing to room ${roomId}...`);
        const subscriptionId = rocketChatWS.subscribeToRoomMessages(roomId, (message) => {
          // Validate message
          if (!message?._id || !message?.rid || !message?.u || !message?.u._id) {
            console.warn('⚠️ Received invalid message from WebSocket, skipping:', message);
            return;
          }

          // ✅ Handle thread replies - update thread notifications
          if (message.tmid) {
            const notificationStore = useNotificationStore.getState();
            const authStore = useAuthStore.getState();
            const currentUserId = authStore.rocketChatUserId;
            
            // Check if this message is from current user (don't notify yourself)
            const isFromCurrentUser = message.u._id === currentUserId;
            
            // Check if user is currently viewing this thread (thread subscription active)
            const currentState = get();
            const roomSub = currentState.roomSubscriptions.get(roomId);
            const threadRefCount = roomSub?.threadRefCounts.get(message.tmid) || 0;
            const isViewingThread = threadRefCount > 0;
            
            if (isFromCurrentUser) {
              console.log('🧵 [Store] Thread reply from current user, skipping notification');
              // Clear notification if user sent message in thread they're viewing
              if (isViewingThread) {
                notificationStore.clearThreadNotification(roomId, message.tmid);
              }
            } else {
              // If user is viewing this thread, don't add notification (they're actively viewing it)
              if (isViewingThread) {
                console.log('🧵 [Store] Thread reply received but user is viewing thread, clearing notification');
                notificationStore.clearThreadNotification(roomId, message.tmid);
              } else {
                // Update thread notification for other users who are not viewing
                console.log('🧵 [Store] Thread reply received (tmid:', message.tmid, '), updating notification');
                notificationStore.addThreadNotification(roomId, message.tmid, message.u?.username);
              }
            }
            
            // Don't add to main message cache (thread replies belong to thread panel)
            return;
          }

          // Regular room messages (non-thread) - can be handled by messageStore if needed
          console.log(`📨 [Store] Regular message received for room ${roomId}:`, message._id);
        });
        
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
        
        // Calculate total refs (room + threads)
        const threadRefsTotal = Array.from(existing.threadRefCounts.values()).reduce((sum, count) => sum + count, 0);
        const totalRefs = newRefCount + threadRefsTotal;
        
        if (totalRefs > 0) {
          // Still have other subscribers (room or threads), decrement room ref count
          const updated = new Map(state.roomSubscriptions);
          updated.set(roomId, {
            ...existing,
            refCount: newRefCount,
          });
          set({ roomSubscriptions: updated });
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
        
        // Ensure room subscription exists
        if (!roomSub) {
          // Create room subscription if not exists
          console.log(`🆕 Creating room subscription for thread ${roomId}:${tmid}...`);
          const subscriptionId = rocketChatWS.subscribeToRoomMessages(roomId, (message) => {
            // Validate message
            if (!message?._id || !message?.rid || !message?.u || !message?.u._id) {
              console.warn('⚠️ Received invalid message from WebSocket, skipping:', message);
              return;
            }

            // ✅ Handle thread replies - update thread notifications
            if (message.tmid) {
              const notificationStore = useNotificationStore.getState();
              const authStore = useAuthStore.getState();
              const currentUserId = authStore.rocketChatUserId;
              
              // Check if this message is from current user (don't notify yourself)
              const isFromCurrentUser = message.u._id === currentUserId;
              
              // Check if user is currently viewing this thread (thread subscription active)
              const currentState = get();
              const roomSub = currentState.roomSubscriptions.get(roomId);
              const threadRefCount = roomSub?.threadRefCounts.get(message.tmid) || 0;
              const isViewingThread = threadRefCount > 0;
              
              if (isFromCurrentUser) {
                console.log('🧵 [Store] Thread reply from current user, skipping notification');
                // Clear notification if user sent message in thread they're viewing
                if (isViewingThread) {
                  notificationStore.clearThreadNotification(roomId, message.tmid);
                }
              } else {
                // If user is viewing this thread, don't add notification (they're actively viewing it)
                if (isViewingThread) {
                  console.log('🧵 [Store] Thread reply received but user is viewing thread, clearing notification');
                  notificationStore.clearThreadNotification(roomId, message.tmid);
                } else {
                  // Update thread notification for other users who are not viewing
                  console.log('🧵 [Store] Thread reply received (tmid:', message.tmid, '), updating notification');
                  notificationStore.addThreadNotification(roomId, message.tmid, message.u?.username);
                }
              }
              
              // Don't add to main message cache (thread replies belong to thread panel)
              return;
            }

            // Regular room messages (non-thread) - can be handled by messageStore if needed
            console.log(`📨 [Store] Regular message received for room ${roomId}:`, message._id);
          });
          
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
        
        // Update thread ref count
        const currentThreadRefCount = roomSub.threadRefCounts.get(tmid) || 0;
        const updated = new Map(state.roomSubscriptions);
        const updatedRoomSub = { ...roomSub };
        updatedRoomSub.threadRefCounts = new Map(roomSub.threadRefCounts);
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
        const updatedRoomSub = { ...roomSub };
        updatedRoomSub.threadRefCounts = new Map(roomSub.threadRefCounts);
        
        if (newThreadRefCount === 0) {
          // No more refs for this thread, remove it
          updatedRoomSub.threadRefCounts.delete(tmid);
          console.log(`🗑️ Removed thread ${roomId}:${tmid} (no more refs)`);
        } else {
          updatedRoomSub.threadRefCounts.set(tmid, newThreadRefCount);
          console.log(`♻️ Thread ${roomId}:${tmid} refCount decreased to ${newThreadRefCount}`);
        }
        
        // Calculate total refs (room + all threads)
        const threadRefsTotal = Array.from(updatedRoomSub.threadRefCounts.values()).reduce((sum, count) => sum + count, 0);
        const totalRefs = updatedRoomSub.refCount + threadRefsTotal;
        
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
          } catch (error: any) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.warn('⚠️ Failed to mark room as read:', errorMessage);
            
            // If it's a connection error, trigger reconnect
            if (errorMessage.includes('not connected') || 
                errorMessage.includes('timeout') || 
                errorMessage.includes('failed to send') ||
                errorMessage.includes('reconnect failed')) {
              console.log('🔄 Connection error detected in markRoomAsRead, triggering reconnect...');
              const state = get();
              // Only reconnect if not already connecting
              if (!state.isConnecting) {
                state.reconnect().catch(reconnectError => {
                  console.error('❌ Reconnect from markRoomAsRead failed:', reconnectError);
                });
              }
            }
          }
          
          // Clean up timer
          markRoomAsReadTimers.delete(roomId);
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

