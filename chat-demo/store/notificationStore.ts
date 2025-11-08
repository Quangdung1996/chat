/**
 * Notification Store - Zustand
 * Quản lý notifications, unread counts, và thread notifications tập trung
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { UserSubscription } from '@/types/rocketchat';

interface ThreadNotification {
  roomId: string;
  threadId: string; // parent message ID
  count: number;
  lastReplyTime?: Date;
  lastReplyBy?: string;
}

interface NotificationState {
  // Room unread counts (roomId -> unreadCount)
  roomUnreadCounts: Map<string, number>;
  
  // Thread notifications (roomId -> threadId -> count)
  threadNotifications: Map<string, Map<string, ThreadNotification>>;
  
  // Room alert states (roomId -> alert)
  roomAlerts: Map<string, boolean>;
  
  // Last message timestamps for sorting
  lastMessageTimes: Map<string, Date>;
  
  // Actions
  updateRoomUnread: (roomId: string, count: number) => void;
  incrementRoomUnread: (roomId: string, amount?: number) => void;
  clearRoomUnread: (roomId: string) => void;
  
  // Thread notifications
  addThreadNotification: (roomId: string, threadId: string, replyBy?: string) => void;
  clearThreadNotification: (roomId: string, threadId: string) => void;
  clearAllThreadNotifications: (roomId: string) => void;
  getThreadNotificationCount: (roomId: string, threadId: string) => number;
  getTotalThreadNotifications: (roomId: string) => number;
  getAllThreadNotificationsCount: () => number;
  
  // Room alerts
  setRoomAlert: (roomId: string, alert: boolean) => void;
  
  // Last message time
  updateLastMessageTime: (roomId: string, time: Date) => void;
  
  // Batch update from subscription
  updateFromSubscription: (subscription: any) => void;
  
  // Initialize from rooms list
  initializeFromRooms: (rooms: UserSubscription[]) => void;
  
  // Reset all
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set, get) => ({
      // Initial state
      roomUnreadCounts: new Map(),
      threadNotifications: new Map(),
      roomAlerts: new Map(),
      lastMessageTimes: new Map(),

      // Update room unread count
      updateRoomUnread: (roomId, count) => {
        set((state) => {
          const newCounts = new Map(state.roomUnreadCounts);
          newCounts.set(roomId, Math.max(0, count));
          return { roomUnreadCounts: newCounts };
        });
      },

      // Increment room unread count
      incrementRoomUnread: (roomId, amount = 1) => {
        set((state) => {
          const newCounts = new Map(state.roomUnreadCounts);
          const current = newCounts.get(roomId) || 0;
          newCounts.set(roomId, current + amount);
          return { roomUnreadCounts: newCounts };
        });
      },

      // Clear room unread count
      clearRoomUnread: (roomId) => {
        set((state) => {
          const newCounts = new Map(state.roomUnreadCounts);
          newCounts.set(roomId, 0);
          return { roomUnreadCounts: newCounts };
        });
      },

      // Add thread notification
      addThreadNotification: (roomId, threadId, replyBy) => {
        set((state) => {
          const newThreadNotifications = new Map(state.threadNotifications);
          
          // Get or create room's thread map
          let roomThreads = newThreadNotifications.get(roomId);
          if (!roomThreads) {
            roomThreads = new Map();
            newThreadNotifications.set(roomId, roomThreads);
          } else {
            roomThreads = new Map(roomThreads);
          }
          
          // Get or create thread notification
          const existing = roomThreads.get(threadId);
          const notification: ThreadNotification = {
            roomId,
            threadId,
            count: (existing?.count || 0) + 1,
            lastReplyTime: new Date(),
            lastReplyBy: replyBy,
          };
          
          roomThreads.set(threadId, notification);
          newThreadNotifications.set(roomId, roomThreads);
          
          return { threadNotifications: newThreadNotifications };
        });
      },

      // Clear thread notification
      clearThreadNotification: (roomId, threadId) => {
        set((state) => {
          const newThreadNotifications = new Map(state.threadNotifications);
          const roomThreads = newThreadNotifications.get(roomId);
          
          if (roomThreads) {
            const newRoomThreads = new Map(roomThreads);
            newRoomThreads.delete(threadId);
            
            if (newRoomThreads.size === 0) {
              newThreadNotifications.delete(roomId);
            } else {
              newThreadNotifications.set(roomId, newRoomThreads);
            }
          }
          
          return { threadNotifications: newThreadNotifications };
        });
      },

      // Clear all thread notifications for a room
      clearAllThreadNotifications: (roomId) => {
        set((state) => {
          const newThreadNotifications = new Map(state.threadNotifications);
          newThreadNotifications.delete(roomId);
          return { threadNotifications: newThreadNotifications };
        });
      },

      // Get thread notification count
      getThreadNotificationCount: (roomId, threadId) => {
        const state = get();
        const roomThreads = state.threadNotifications.get(roomId);
        if (!roomThreads) return 0;
        const notification = roomThreads.get(threadId);
        return notification?.count || 0;
      },

      // Get total thread notifications for a room
      getTotalThreadNotifications: (roomId) => {
        const state = get();
        const roomThreads = state.threadNotifications.get(roomId);
        if (!roomThreads) return 0;
        
        let total = 0;
        roomThreads.forEach((notification) => {
          total += notification.count;
        });
        return total;
      },

      // Get total thread notifications from all rooms
      getAllThreadNotificationsCount: () => {
        const state = get();
        let total = 0;
        
        state.threadNotifications.forEach((roomThreads) => {
          roomThreads.forEach((notification) => {
            total += notification.count;
          });
        });
        
        return total;
      },

      // Set room alert
      setRoomAlert: (roomId, alert) => {
        set((state) => {
          const newAlerts = new Map(state.roomAlerts);
          newAlerts.set(roomId, alert);
          return { roomAlerts: newAlerts };
        });
      },

      // Update last message time
      updateLastMessageTime: (roomId, time) => {
        set((state) => {
          const newTimes = new Map(state.lastMessageTimes);
          newTimes.set(roomId, time);
          return { lastMessageTimes: newTimes };
        });
      },

      // Update from Rocket.Chat subscription event
      updateFromSubscription: (subscription) => {
        if (!subscription?.rid) return;
        
        set((state) => {
          const newCounts = new Map(state.roomUnreadCounts);
          const newAlerts = new Map(state.roomAlerts);
          const newTimes = new Map(state.lastMessageTimes);
          const newThreadNotifications = new Map(state.threadNotifications);
          
          const roomId = subscription.rid;
          
          // Update unread count
          if (subscription.unread !== undefined) {
            newCounts.set(roomId, subscription.unread || 0);
          }
          
          // Update alert
          if (subscription.alert !== undefined) {
            newAlerts.set(roomId, subscription.alert);
          }
          
          // Update last message time if subscription changed
          newTimes.set(roomId, new Date());
          
          // ✨ Sync thread notifications from subscription data
          // Rocket.Chat subscription may contain 'tunread' (thread unread) array
          // Format: tunread: [{ _id: threadId, unread: count }]
          // Also handle backend format: threadUnread: [{ threadId, unread }]
          const tunreadData = subscription.tunread || subscription.threadUnread;
          if (tunreadData && Array.isArray(tunreadData)) {
            const roomThreads = new Map<string, ThreadNotification>();
            tunreadData.forEach((thread: any) => {
              // Handle both formats: { _id, unread } or { threadId, unread }
              const threadId = thread._id || thread.threadId;
              const count = thread.unread;
              if (threadId && count !== undefined) {
                roomThreads.set(threadId, {
                  roomId,
                  threadId,
                  count,
                });
              }
            });
            newThreadNotifications.set(roomId, roomThreads);
          }
          
          return {
            roomUnreadCounts: newCounts,
            roomAlerts: newAlerts,
            lastMessageTimes: newTimes,
            threadNotifications: newThreadNotifications,
          };
        });
      },

      // Initialize from rooms list (on mount)
      initializeFromRooms: (rooms) => {
        set((state) => {
          const newCounts = new Map(state.roomUnreadCounts);
          const newAlerts = new Map(state.roomAlerts);
          const newTimes = new Map(state.lastMessageTimes);
          const newThreadNotifications = new Map(state.threadNotifications);
          
          rooms.forEach((room) => {
            newCounts.set(room.roomId, room.unreadCount || 0);
            newAlerts.set(room.roomId, room.alert || false);
            if (room.lastMessageTime) {
              newTimes.set(room.roomId, room.lastMessageTime);
            }
            
            // ✨ Sync thread notifications from room data
            if (room.threadNotifications && room.threadNotifications.length > 0) {
              const roomThreads = new Map<string, ThreadNotification>();
              room.threadNotifications.forEach((thread) => {
                roomThreads.set(thread.threadId, {
                  roomId: room.roomId,
                  threadId: thread.threadId,
                  count: thread.count,
                });
              });
              newThreadNotifications.set(room.roomId, roomThreads);
            }
          });
          
          return {
            roomUnreadCounts: newCounts,
            roomAlerts: newAlerts,
            lastMessageTimes: newTimes,
            threadNotifications: newThreadNotifications,
          };
        });
      },

      // Reset all
      reset: () => {
        set({
          roomUnreadCounts: new Map(),
          threadNotifications: new Map(),
          roomAlerts: new Map(),
          lastMessageTimes: new Map(),
        });
      },
    }),
    { name: 'NotificationStore' }
  )
);

// Selector hooks for better performance
export const useRoomUnreadCount = (roomId: string) => {
  return useNotificationStore((state) => state.roomUnreadCounts.get(roomId) || 0);
};

export const useRoomAlert = (roomId: string) => {
  return useNotificationStore((state) => state.roomAlerts.get(roomId) || false);
};

export const useThreadNotifications = (roomId: string) => {
  return useNotificationStore((state) => {
    const roomThreads = state.threadNotifications.get(roomId);
    if (!roomThreads) return [];
    
    return Array.from(roomThreads.values());
  });
};

export const useTotalThreadNotifications = (roomId: string) => {
  return useNotificationStore((state) => state.getTotalThreadNotifications(roomId));
};

export const useAllThreadNotificationsCount = () => {
  // Subscribe directly to threadNotifications Map to ensure re-render on changes
  return useNotificationStore((state) => {
    let total = 0;
    state.threadNotifications.forEach((roomThreads) => {
      roomThreads.forEach((notification) => {
        total += notification.count;
      });
    });
    return total;
  });
};

