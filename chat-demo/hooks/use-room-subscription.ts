/**
 * Hooks để subscribe vào room/thread messages
 * Sử dụng centralized subscription management từ websocketStore
 * Tự động ref-counted, chỉ subscribe 1 lần cho mỗi room/thread
 */

import { useEffect } from 'react';
import { useWebSocketStore } from '@/store/websocketStore';

/**
 * Subscribe to room messages (ref-counted)
 */
export function useRoomSubscription(roomId: string | null) {
  const subscribeToRoom = useWebSocketStore(state => state.subscribeToRoom);
  const unsubscribeFromRoom = useWebSocketStore(state => state.unsubscribeFromRoom);
  const isConnected = useWebSocketStore(state => state.isConnected && state.isAuthenticated);

  useEffect(() => {
    if (!roomId || !isConnected) {
      return;
    }

    // Subscribe (ref-counted trong store)
    subscribeToRoom(roomId);

    // Cleanup: unsubscribe khi unmount
    return () => {
      unsubscribeFromRoom(roomId);
    };
  }, [roomId, isConnected, subscribeToRoom, unsubscribeFromRoom]);
}

/**
 * Subscribe to thread messages (ref-counted)
 */
export function useThreadSubscription(roomId: string | null, tmid: string | null) {
  const subscribeToThread = useWebSocketStore(state => state.subscribeToThread);
  const unsubscribeFromThread = useWebSocketStore(state => state.unsubscribeFromThread);
  const isConnected = useWebSocketStore(state => state.isConnected && state.isAuthenticated);

  useEffect(() => {
    if (!roomId || !tmid || !isConnected) {
      return;
    }

    // Subscribe (ref-counted trong store)
    subscribeToThread(roomId, tmid);

    // Cleanup: unsubscribe khi unmount
    return () => {
      unsubscribeFromThread(roomId, tmid);
    };
  }, [roomId, tmid, isConnected, subscribeToThread, unsubscribeFromThread]);
}

