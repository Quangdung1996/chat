/**
 * Custom hooks for WebSocket subscriptions
 * Sử dụng Zustand stores để quản lý state
 */

import { useEffect, useRef, useCallback } from 'react';
import { rocketChatWS } from '@/services/rocketchat-websocket.service';
import { useWebSocketStore } from '@/store/websocketStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { useAddMessageToCache } from './use-messages';
import type { ChatMessage } from '@/types/rocketchat';

/**
 * Hook để subscribe room messages
 * Tự động update cache và notifications
 */
export function useRoomMessages(roomId: string | null, enabled = true) {
  const wsConnected = useWebSocketStore((state) => state.isConnected && state.isAuthenticated);
  const addSubscription = useWebSocketStore((state) => state.addSubscription);
  const removeSubscription = useWebSocketStore((state) => state.removeSubscription);
  const addMessageToCache = useAddMessageToCache();
  const updateLastMessageTime = useNotificationStore((state) => state.updateLastMessageTime);
  const incrementRoomUnread = useNotificationStore((state) => state.incrementRoomUnread);
  const addThreadNotification = useNotificationStore((state) => state.addThreadNotification);
  const currentUserId = useAuthStore((state) => state.rocketChatUserId);
  const subscriptionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!roomId || !wsConnected || !enabled) return;

    const handleNewMessage = (message: any) => {
      // Helper to parse Rocket.Chat timestamp format
      const parseTimestamp = (ts: any): string => {
        if (!ts) return new Date().toISOString();
        if (typeof ts === 'string') return ts;
        if (ts.$date) return new Date(ts.$date).toISOString();
        if (typeof ts === 'number') return new Date(ts).toISOString();
        return new Date().toISOString();
      };

      // Validate message
      if (!message._id || !message.rid || !message.u || !message.u._id) {
        console.warn('⚠️ Received invalid message from WebSocket, skipping:', message);
        return;
      }

      // ✅ Handle thread replies - update thread notifications
      if (message.tmid) {
        // Check if this message is from current user (don't notify yourself)
        const isFromCurrentUser = message.u._id === currentUserId;
        
        if (!isFromCurrentUser) {
          // Update thread notification for other users
          console.log('🧵 Thread reply received (tmid:', message.tmid, '), updating notification');
          addThreadNotification(roomId, message.tmid, message.u?.username);
        } else {
          console.log('🧵 Thread reply from current user, skipping notification');
        }
        
        // Don't add to main message cache (thread replies belong to thread panel)
        return;
      }

      // Convert to ChatMessage format
      const newMessage: ChatMessage = {
        messageId: message._id,
        roomId: message.rid,
        text: message.msg || '',
        timestamp: parseTimestamp(message.ts),
        createdAt: parseTimestamp(message.ts),
        user: {
          id: message.u._id,
          username: message.u.username,
          name: message.u.name || message.u.username,
        },
        updatedAt: message._updatedAt ? parseTimestamp(message._updatedAt) : undefined,
        file: message.file ? {
          _id: message.file._id,
          name: message.file.name,
          type: message.file.type,
          size: message.file.size,
          url: message.file.url,
        } : undefined,
        attachments: message.attachments,
      };

      // Add to cache
      addMessageToCache(roomId, newMessage);

      // Update last message time
      updateLastMessageTime(roomId, new Date());

      // ✅ Auto mark as read when receiving new messages in current room
      // Note: This is handled by the subscription-changed event, but we also mark here
      // to ensure immediate feedback
      rocketChatWS.markRoomAsRead(roomId).catch((error: any) => {
        console.warn('Failed to auto-mark room as read:', error);
      });
    };

    // Subscribe
    const subscriptionId = rocketChatWS.subscribeToRoomMessages(roomId, handleNewMessage);
    subscriptionIdRef.current = subscriptionId;
    addSubscription(subscriptionId);

    return () => {
      if (subscriptionIdRef.current) {
        rocketChatWS.unsubscribe(subscriptionIdRef.current);
        removeSubscription(subscriptionIdRef.current);
        subscriptionIdRef.current = null;
      }
    };
  }, [roomId, wsConnected, enabled, addMessageToCache, updateLastMessageTime, addThreadNotification, currentUserId, addSubscription, removeSubscription]);
}

/**
 * Hook để subscribe thread messages
 * Tự động update thread notifications
 */
export function useThreadMessages(
  roomId: string | null,
  threadId: string | null,
  enabled = true,
  onNewMessage?: (message: ChatMessage) => void
) {
  const wsConnected = useWebSocketStore((state) => state.isConnected && state.isAuthenticated);
  const addSubscription = useWebSocketStore((state) => state.addSubscription);
  const removeSubscription = useWebSocketStore((state) => state.removeSubscription);
  const clearThreadNotification = useNotificationStore((state) => state.clearThreadNotification);
  const currentUserId = useAuthStore((state) => state.rocketChatUserId);
  const subscriptionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!roomId || !threadId || !wsConnected || !enabled) return;

    const handleNewThreadMessage = (message: any) => {
      // Only process messages for this specific thread
      if (message.tmid !== threadId) return;

      // Helper to parse Rocket.Chat timestamp format
      const parseTimestamp = (ts: any): string => {
        if (!ts) return new Date().toISOString();
        if (typeof ts === 'string') return ts;
        if (ts.$date) return new Date(ts.$date).toISOString();
        if (typeof ts === 'number') return new Date(ts).toISOString();
        return new Date().toISOString();
      };

      // Convert to ChatMessage format
      const newMessage: ChatMessage = {
        messageId: message._id,
        roomId: message.rid,
        text: message.msg || '',
        timestamp: parseTimestamp(message.ts),
        createdAt: parseTimestamp(message.ts),
        user: {
          id: message.u._id,
          username: message.u.username,
          name: message.u.name || message.u.username,
        },
        tmid: message.tmid,
        updatedAt: message._updatedAt ? parseTimestamp(message._updatedAt) : undefined,
      };

      // ✅ Clear thread notification when viewing thread (user is actively viewing it)
      // Note: useRoomMessages already added the notification, but since user is viewing,
      // we should clear it
      clearThreadNotification(roomId, threadId);

      // Call callback if provided
      if (onNewMessage) {
        onNewMessage(newMessage);
      }

      // Mark room as read when receiving thread reply
      rocketChatWS.markRoomAsRead(roomId).catch((error: any) => {
        console.warn('Failed to mark room as read after receiving thread reply:', error);
      });
    };

    // Subscribe to room messages (will receive thread replies too)
    const subscriptionId = rocketChatWS.subscribeToRoomMessages(roomId, handleNewThreadMessage);
    subscriptionIdRef.current = subscriptionId;
    addSubscription(subscriptionId);

    return () => {
      if (subscriptionIdRef.current) {
        rocketChatWS.unsubscribe(subscriptionIdRef.current);
        removeSubscription(subscriptionIdRef.current);
        subscriptionIdRef.current = null;
      }
    };
  }, [roomId, threadId, wsConnected, enabled, clearThreadNotification, currentUserId, onNewMessage, addSubscription, removeSubscription]);
}

/**
 * Hook để subscribe user subscriptions (unread count updates)
 */
export function useUserSubscriptions(
  userId: string | null,
  enabled = true,
  onSubscriptionUpdate?: (subscription: any) => void
) {
  const wsConnected = useWebSocketStore((state) => state.isConnected && state.isAuthenticated);
  const addSubscription = useWebSocketStore((state) => state.addSubscription);
  const removeSubscription = useWebSocketStore((state) => state.removeSubscription);
  const updateFromSubscription = useNotificationStore((state) => state.updateFromSubscription);
  const subscriptionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId || !wsConnected || !enabled) return;

    const handleSubscriptionUpdate = (data: any) => {
      const { action, subscription } = data;

      if (!subscription) return;

      console.log('🔔 Subscription update:', {
        action,
        roomId: subscription.rid,
        type: subscription.t,
        unread: subscription.unread,
        alert: subscription.alert,
        name: subscription.name || subscription.fname,
      });

      // Update notification store
      updateFromSubscription(subscription);

      // Call callback if provided
      if (onSubscriptionUpdate) {
        onSubscriptionUpdate({ action, subscription });
      }
    };

    // Subscribe
    const subscriptionId = rocketChatWS.subscribeToUserSubscriptions(userId, handleSubscriptionUpdate);
    subscriptionIdRef.current = subscriptionId;
    addSubscription(subscriptionId);

    return () => {
      if (subscriptionIdRef.current) {
        rocketChatWS.unsubscribe(subscriptionIdRef.current);
        removeSubscription(subscriptionIdRef.current);
        subscriptionIdRef.current = null;
      }
    };
  }, [userId, wsConnected, enabled, updateFromSubscription, onSubscriptionUpdate, addSubscription, removeSubscription]);
}

/**
 * Hook để subscribe user rooms (new rooms, room changes)
 */
export function useUserRooms(
  userId: string | null,
  enabled = true,
  onRoomUpdate?: (data: { action: string; room: any }) => void
) {
  const wsConnected = useWebSocketStore((state) => state.isConnected && state.isAuthenticated);
  const addSubscription = useWebSocketStore((state) => state.addSubscription);
  const removeSubscription = useWebSocketStore((state) => state.removeSubscription);
  const subscriptionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId || !wsConnected || !enabled) return;

    const handleRoomUpdate = (data: any) => {
      const { action, room } = data;

      if (!room) return;

      console.log('🏠 [WS] Room update:', {
        action,
        roomId: room._id,
        type: room.t,
        name: room.name || room.fname,
      });

      // Call callback if provided
      if (onRoomUpdate) {
        onRoomUpdate({ action, room });
      }
    };

    // Subscribe
    const subscriptionId = rocketChatWS.subscribeToUserRooms(userId, handleRoomUpdate);
    subscriptionIdRef.current = subscriptionId;
    addSubscription(subscriptionId);

    return () => {
      if (subscriptionIdRef.current) {
        rocketChatWS.unsubscribe(subscriptionIdRef.current);
        removeSubscription(subscriptionIdRef.current);
        subscriptionIdRef.current = null;
      }
    };
  }, [userId, wsConnected, enabled, onRoomUpdate, addSubscription, removeSubscription]);
}

