/**
 * Rocket.Chat WebSocket Service
 * Direct connection to Rocket.Chat realtime API using DDP protocol
 * 
 * Documentation: https://developer.rocket.chat/reference/api/realtime-api
 */

import { API_CONFIG } from '@/config/api.config';
import { rocketChatService } from './rocketchat.service';
import { useAuthStore } from '@/store/authStore';

interface DDPMessage {
  msg: string;
  id?: string;
  method?: string;
  params?: any[];
  collection?: string;
  fields?: any;
  result?: any;
  error?: any;
  version?: string;
  support?: string[];
  name?: string;
}

interface Subscription {
  id: string;
  name: string;
  params: any[];
  callback: (data: any) => void;
}

class RocketChatWebSocketService {
  private ws: WebSocket | null = null;
  private messageId = 0;
  private subscriptions = new Map<string, Subscription>();
  private callbacks = new Map<string, (data: any) => void>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private isAuthenticated = false;
  private authToken: string | null = null;
  private userId: string | null = null;
  private pingInterval: NodeJS.Timeout | null = null;

  private getWebSocketUrl(): string {
    // Convert Rocket.Chat HTTP URL to WebSocket URL
    const baseUrl = API_CONFIG.rocketChatURL;
    const wsUrl = baseUrl
      .replace('http://', 'ws://')
      .replace('https://', 'wss://');
    return `${wsUrl}/websocket`;
  }

  private getNextId(): string {
    return (++this.messageId).toString();
  }

  private send(message: DDPMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      console.log('📤 Sent:', message);
    } else {
      console.error('❌ WebSocket not open, cannot send:', message);
    }
  }

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      console.log('⚠️ Already connected or connecting');
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.isConnecting = true;
        const wsUrl = this.getWebSocketUrl();
        console.log('🔌 Connecting to Rocket.Chat WebSocket:', wsUrl);

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;

          // Send connect message (DDP protocol)
          this.send({
            msg: 'connect',
            version: '1',
            support: ['1'],
          });

          // Start ping to keep connection alive
          this.startPing();

          // Authenticate if we have token
          if (this.authToken && this.userId) {
            this.authenticate(this.authToken, this.userId);
          }

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data: DDPMessage = JSON.parse(event.data);
            console.log('📥 Received:', data);
            this.handleMessage(data);
          } catch (error) {
            console.error('❌ Failed to parse message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('🔌 WebSocket closed');
          this.isConnecting = false;
          this.isAuthenticated = false;
          this.stopPing();
          this.handleReconnect();
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  private startPing() {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ msg: 'ping' });
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(err => {
          console.error('❌ Reconnect failed:', err);
        });
      }, delay);
    } else {
      console.error('❌ Max reconnect attempts reached');
    }
  }

  private handleMessage(data: DDPMessage) {
    switch (data.msg) {
      case 'connected':
        console.log('✅ DDP connected, session:', data.id);
        break;

      case 'ping':
        // Respond to ping
        this.send({ msg: 'pong' });
        break;

      case 'result':
        // Handle method call result
        if (data.id && this.callbacks.has(data.id)) {
          const callback = this.callbacks.get(data.id);
          callback?.(data.result);
          this.callbacks.delete(data.id);
        }
        break;

      case 'ready':
        // Subscription is ready
        console.log('✅ Subscriptions ready:', data);
        break;

      case 'added':
      case 'changed':
      case 'removed':
        // Collection changes
        this.handleCollectionChange(data);
        break;

      case 'error':
        console.error('❌ DDP error:', data.error);
        break;

      default:
        console.log('📨 Unhandled message type:', data.msg);
    }
  }

  private handleCollectionChange(data: DDPMessage) {
    // Find matching subscription by collection
    for (const [subId, sub] of this.subscriptions.entries()) {
      // Call subscription callback with the data
      try {
        sub.callback({
          type: data.msg,
          collection: data.collection,
          id: data.id,
          fields: data.fields,
        });
      } catch (error) {
        console.error('❌ Subscription callback error:', error);
      }
    }
  }

  /**
   * Authenticate with backend token
   * Lấy token từ backend và authenticate WebSocket
   */
  async authenticateWithBackend(userId: number): Promise<void> {
    try {
      console.log('🔐 Getting Rocket.Chat token from backend for user:', userId);
      
      // Get token from backend API
      const tokenResponse = await rocketChatService.getLoginToken(userId);
      
      if (!tokenResponse.success || !tokenResponse.authToken) {
        throw new Error('Failed to get token from backend');
      }

      console.log('✅ Got token from backend, authenticating WebSocket...');
      
      // Save token to localStorage for future use (legacy support)
      localStorage.setItem('rc_token', tokenResponse.authToken);
      localStorage.setItem('rc_uid', tokenResponse.userId);
      
      // Save token to authStore for axios interceptor
      useAuthStore.getState().setRocketChatAuth(tokenResponse.authToken, tokenResponse.userId);
      
      console.log('💾 Saved new token to localStorage and authStore');
      
      // Authenticate WebSocket with the token
      await this.authenticate(tokenResponse.authToken, tokenResponse.userId);
      
      console.log('✅ WebSocket authenticated successfully');
    } catch (error) {
      console.error('❌ Failed to authenticate with backend token:', error);
      throw error;
    }
  }

  /**
   * Authenticate with existing token
   */
  async authenticate(authToken: string, userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.authToken = authToken;
      this.userId = userId;

      // Save token to localStorage (legacy support)
      localStorage.setItem('rc_token', authToken);
      localStorage.setItem('rc_uid', userId);

      // Save token to authStore for axios interceptor
      useAuthStore.getState().setRocketChatAuth(authToken, userId);

      const id = this.getNextId();
      this.callbacks.set(id, (result: any) => {
        if (result) {
          console.log('✅ Authenticated via WebSocket');
          this.isAuthenticated = true;
          
          // Re-subscribe to all previous subscriptions
          this.resubscribeAll();
          
          resolve();
        } else {
          console.error('❌ Authentication failed');
          this.isAuthenticated = false;
          reject(new Error('Authentication failed'));
        }
      });

      this.send({
        msg: 'method',
        method: 'login',
        id,
        params: [{
          resume: authToken,
        }],
      });
    });
  }

  private resubscribeAll() {
    console.log('🔄 Re-subscribing to all subscriptions...');
    const subs = Array.from(this.subscriptions.values());
    this.subscriptions.clear();
    
    subs.forEach(sub => {
      this.subscribe(sub.name, sub.params, sub.callback);
    });
  }

  subscribe(name: string, params: any[], callback: (data: any) => void): string {
    const id = this.getNextId();
    
    this.subscriptions.set(id, {
      id,
      name,
      params,
      callback,
    });

    this.send({
      msg: 'sub',
      id,
      name,
      params,
    });

    console.log(`✅ Subscribed to ${name} with id ${id}`);
    return id;
  }

  unsubscribe(subscriptionId: string) {
    if (this.subscriptions.has(subscriptionId)) {
      this.send({
        msg: 'unsub',
        id: subscriptionId,
      });
      this.subscriptions.delete(subscriptionId);
      console.log(`✅ Unsubscribed from ${subscriptionId}`);
    }
  }

  callMethod(method: string, ...params: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = this.getNextId();
      
      this.callbacks.set(id, (result: any) => {
        resolve(result);
      });

      this.send({
        msg: 'method',
        method,
        id,
        params,
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.callbacks.has(id)) {
          this.callbacks.delete(id);
          reject(new Error('Method call timeout'));
        }
      }, 30000);
    });
  }

  disconnect() {
    console.log('🔌 Disconnecting WebSocket...');
    this.stopPing();
    this.subscriptions.clear();
    this.callbacks.clear();
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.isAuthenticated = false;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.isAuthenticated;
  }

  /**
   * Mark room as read (clear unread count)
   * @param roomId Room ID to mark as read
   */
  async markRoomAsRead(roomId: string): Promise<void> {
    try {
      console.log('📖 Marking room as read:', roomId);
      await this.callMethod('readMessages', [roomId]);
      console.log('✅ Room marked as read');
    } catch (error) {
      console.error('❌ Failed to mark room as read:', error);
      throw error;
    }
  }

  // Convenience methods for common subscriptions
  
  /**
   * Subscribe to room messages
   * @param roomId Room ID to subscribe to
   * @param callback Callback when new message arrives
   */
  subscribeToRoomMessages(roomId: string, callback: (message: any) => void): string {
    return this.subscribe('stream-room-messages', [roomId, false], (data) => {
      if (data.type === 'changed' && data.fields?.args) {
        const [message] = data.fields.args;
        callback(message);
      }
    });
  }

  /**
   * Subscribe to notify-room (for typing, etc)
   * @param roomId Room ID to subscribe to
   * @param callback Callback when notification arrives
   */
  subscribeToRoomNotifications(roomId: string, callback: (notification: any) => void): string {
    return this.subscribe('stream-notify-room', [`${roomId}/typing`, false], (data) => {
      if (data.type === 'changed' && data.fields?.args) {
        callback(data.fields.args);
      }
    });
  }

  /**
   * Subscribe to user's rooms (for room list updates)
   * @param userId User ID
   * @param callback Callback when room updates
   */
  subscribeToUserRooms(userId: string, callback: (room: any) => void): string {
    return this.subscribe('stream-notify-user', [`${userId}/rooms-changed`, false], (data) => {
      if (data.type === 'changed' && data.fields?.args) {
        const [action, room] = data.fields.args;
        callback({ action, room });
      }
    });
  }

  /**
   * Subscribe to user's subscriptions (for unread count updates)
   * @param userId User ID
   * @param callback Callback when subscription updates
   */
  subscribeToUserSubscriptions(userId: string, callback: (subscription: any) => void): string {
    return this.subscribe('stream-notify-user', [`${userId}/subscriptions-changed`, false], (data) => {
      if (data.type === 'changed' && data.fields?.args) {
        const [action, subscription] = data.fields.args;
        callback({ action, subscription });
      }
    });
  }

  /**
   * Send typing notification
   * @param roomId Room ID
   * @param username Username
   * @param isTyping Whether user is typing
   */
  async sendTyping(roomId: string, username: string, isTyping: boolean): Promise<void> {
    try {
      await this.callMethod('stream-notify-room', `${roomId}/typing`, username, isTyping);
    } catch (error) {
      console.error('❌ Failed to send typing notification:', error);
    }
  }
}

// Export singleton instance
export const rocketChatWS = new RocketChatWebSocketService();

