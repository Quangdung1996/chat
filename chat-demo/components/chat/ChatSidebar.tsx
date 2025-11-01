'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import rocketChatService from '@/services/rocketchat.service';
import { rocketChatWS } from '@/services/rocketchat-websocket.service';
import UserMenu from '@/components/UserMenu';
import CreateRoomModal from './CreateRoomModal';
import { Search, Plus, X, ChevronDown, MessageSquare, Loader2, XCircle } from 'lucide-react';
import type { UserSubscription } from '@/types/rocketchat';

// 🔧 Selector functions - tránh infinite loop với Zustand
const selectUser = (state: any) => state.user;
const selectToken = (state: any) => state.token;
const selectRocketChatUserId = (state: any) => state.rocketChatUserId;

interface ChatSidebarProps {
  selectedRoom: UserSubscription | null;
  onSelectRoom: (room: UserSubscription) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface User {
  _id: string;
  username: string;
  name?: string;
  status?: string;
  emails?: { address: string }[];
}

export default function ChatSidebar({
  selectedRoom,
  onSelectRoom,
  isMobileOpen,
  onCloseMobile,
}: ChatSidebarProps) {
  // ✅ Use stable selector functions
  const user = useAuthStore(selectUser);
  const token = useAuthStore(selectToken);
  const rocketChatUserId = useAuthStore(selectRocketChatUserId);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // ✅ State management without useSWR
  const [rooms, setRooms] = useState<UserSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [wsReady, setWsReady] = useState(false); // ✅ Track when WebSocket is ready
  
  // New states for user search
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creatingDM, setCreatingDM] = useState<string | null>(null);
  
  // 🔧 FIX: Track pending room additions to prevent race condition duplicates
  const pendingRoomAdditions = useRef<Set<string>>(new Set());

  // ✅ Load rooms on mount
  useEffect(() => {
    if (!user?.id) return;
    
    const loadRooms = async () => {
      setIsLoading(true);
      try {
        const response = await rocketChatService.getUserRooms(user.id);
        if (response.success && response.rooms) {
          // 🐛 DEBUG: Log initial rooms data
          console.log('📦 Initial rooms loaded:', response.rooms.map(r => ({
            name: r.fullName || r.name,
            type: r.type,
            unreadCount: r.unreadCount,
            alert: r.alert
          })));
          
          setRooms(response.rooms);
          setError(null);
        } else {
          throw new Error('Failed to load rooms');
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRooms();
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadUsers(); // Load users for contact search
    }
  }, [user?.id]);

  // ✅ Auto-connect WebSocket when entering home page (if not already connected)
  useEffect(() => {
    const initWebSocket = async () => {
      if (!token || !rocketChatUserId) {
        setWsReady(false);
        return;
      }

      // Check if already connected
      if (rocketChatWS.isConnected()) {
        console.log('✅ WebSocket already connected');
        setWsReady(true);
        return;
      }

      try {
        console.log('🔌 Connecting WebSocket...');
        await rocketChatWS.connect();
        await rocketChatWS.authenticateWithStoredToken();
        console.log('✅ WebSocket connected and authenticated');
        setWsReady(true); // ✅ Mark as ready AFTER successful authentication
      } catch (error) {
        console.error('❌ Failed to connect WebSocket:', error);
        setWsReady(false);
      }
    };

    initWebSocket();
  }, [token, rocketChatUserId]);

  // ✅ Rocket.Chat WebSocket: Subscribe to user's subscriptions (unread count updates)
  // 🔥 IMPORTANT: This runs ALWAYS when connected, not just when selectedRoom exists
  useEffect(() => {
    if (!rocketChatUserId || !wsReady) {
      console.log('⏳ Waiting for WebSocket to be ready...', { rocketChatUserId, wsReady });
      return;
    }

    // Handler cho subscription updates (unread count, etc)
    const handleSubscriptionUpdate = (data: any) => {
      const { action, subscription } = data;
      
      if (!subscription) return;

      // 🐛 DEBUG: Log subscription update
      console.log('🔔 Subscription update:', {
        action,
        roomId: subscription.rid,
        type: subscription.t,
        unread: subscription.unread,
        alert: subscription.alert,
        name: subscription.name || subscription.fname
      });

      // Update rooms state
      setRooms(currentRooms => {
        const roomIndex = currentRooms.findIndex(r => r.roomId === subscription.rid);
        
        if (roomIndex >= 0) {
          // ✅ ONLY update specific fields, don't spread subscription to avoid overwriting with undefined
          const existingRoom = currentRooms[roomIndex];
          const newRooms = [...currentRooms];
          
          newRooms[roomIndex] = {
            ...existingRoom, // Keep all existing fields
            unreadCount: subscription.unread || 0,
            alert: subscription.alert !== undefined ? subscription.alert : existingRoom.alert,
            lastMessageTime: new Date(), // ✅ Update timestamp when subscription changes (new message)
            // ✅ Only update name/fullName if they exist in subscription
            ...(subscription.name && { name: subscription.name }),
            ...(subscription.fname && { fullName: subscription.fname }),
          };

          console.log('✅ Updated room:', {
            name: newRooms[roomIndex].fullName || newRooms[roomIndex].name,
            type: newRooms[roomIndex].type,
            unreadCount: newRooms[roomIndex].unreadCount
          });
          
          return newRooms;
        }
        
        console.warn('⚠️ Room not found in currentRooms:', subscription.rid);
        return currentRooms;
      });
    };

    // Subscribe to user's subscription updates using Rocket.Chat userId
    const subId = rocketChatWS.subscribeToUserSubscriptions(
      rocketChatUserId,
      handleSubscriptionUpdate
    );

    return () => {
      console.log('🔕 Unsubscribing from user subscriptions');
      rocketChatWS.unsubscribe(subId);
    };
  }, [rocketChatUserId, wsReady]); // ✅ Subscribe when WS ready, don't re-subscribe on room change

  // ✅ Rocket.Chat WebSocket: Subscribe to user's rooms (new rooms, room changes)
  useEffect(() => {
    if (!rocketChatUserId || !wsReady) return;

    // Handler cho room updates (new rooms, room deleted, etc)
    const handleRoomUpdate = async (data: any) => {
      const { action, room } = data;
      
      if (!room) return;

      // 🐛 DEBUG: Log room update
      console.log('🏠 [WS] Room update:', {
        action,
        roomId: room._id,
        type: room.t,
        name: room.name || room.fname,
        hasUnread: room.unread !== undefined,
        unread: room.unread
      });

      // Handle different actions
      if (action === 'inserted' || action === 'updated') {
        setRooms(currentRooms => {
          const roomIndex = currentRooms.findIndex(r => r.roomId === room._id);
          
          if (roomIndex >= 0) {
            // ✅ Update existing room - ONLY update fields that exist
            const existingRoom = currentRooms[roomIndex];
            const newRooms = [...currentRooms];
            
            // ⚠️ WORKAROUND: rooms-changed event doesn't have unread count
            // For groups (type='p'), infer unread count from lastMessage
            let unreadCount = existingRoom.unreadCount || 0;
            
            if (room.t === 'p' && room.lastMessage) {
              // Check if this is a NEW message (different from last known message)
              const lastMsgId = room.lastMessage._id;
              const prevLastMsgId = existingRoom.lastMessage?._id;
              
              if (lastMsgId && lastMsgId !== prevLastMsgId) {
                // New message arrived
                const messageUserId = room.lastMessage.u?._id;
                
                // Only increment unread if message is from another user
                if (messageUserId !== rocketChatUserId) {
                  unreadCount = (existingRoom.unreadCount || 0) + 1;
                }
              }
            }
            
            newRooms[roomIndex] = {
              ...existingRoom, // Keep all existing fields
              // ✅ Only update fields if they exist in WebSocket data
              ...(room._id && { id: room._id, roomId: room._id }),
              ...(room.name && { name: room.name }),
              ...(room.fname && { fullName: room.fname }),
              ...(room.t && { type: room.t }),
              ...(room.lastMessage && { lastMessage: room.lastMessage }),
              unreadCount,
              lastMessageTime: new Date(), // ✅ Update timestamp on room update
            };
            
            console.log('✅ [WS] Updated room state:', {
              name: newRooms[roomIndex].fullName || newRooms[roomIndex].name,
              type: newRooms[roomIndex].type,
              unreadCount: newRooms[roomIndex].unreadCount
            });
            
            return newRooms;
          } else if (action === 'inserted') {
            // 🔧 FIX: Double-check for duplicates (race condition protection)
            // 1. Check if this room is already being added by another concurrent event
            if (pendingRoomAdditions.current.has(room._id)) {
              console.log('⚠️ [WS] Room is already being added (pending), skipping:', room._id);
              return currentRooms;
            }
            
            // 2. Check if room already exists in current state
            const exists = currentRooms.some(r => r.roomId === room._id);
            if (exists) {
              console.log('⚠️ [WS] Room already exists in state, skipping:', room._id);
              return currentRooms;
            }
            
            // 🔒 Mark this room as being added (prevents concurrent duplicates)
            pendingRoomAdditions.current.add(room._id);
            
            // ✅ Add new room - create full object with required fields
            const newRoom: UserSubscription = {
              id: room._id,
              roomId: room._id,
              name: room.name || room.fname || 'Unknown',
              fullName: room.fname || room.name || 'Unknown',
              type: room.t || 'd',
              unreadCount: room.unread || 0,
              alert: room.alert || false,
              open: room.open !== undefined ? room.open : true,
              user: room.user || {
                id: rocketChatUserId || '',
                username: '',
                name: ''
              },
              lastMessageTime: new Date(), // ✅ New rooms get current timestamp
            };
            
            console.log('✅ [WS] Adding new room:', {
              roomId: newRoom.roomId,
              name: newRoom.fullName,
              type: newRoom.type
            });
            
            // 🔓 Clear pending status after a short delay (cleanup)
            setTimeout(() => {
              pendingRoomAdditions.current.delete(room._id);
            }, 1000);
            
            return [newRoom, ...currentRooms];
          }
          
          return currentRooms;
        });
      } else if (action === 'removed') {
        // Remove room from list
        setRooms(currentRooms => {
          return currentRooms.filter(r => r.roomId !== room._id);
        });
      }
    };

    // Subscribe to user's room updates using Rocket.Chat userId
    const subId = rocketChatWS.subscribeToUserRooms(
      rocketChatUserId,
      handleRoomUpdate
    );

    return () => {
      rocketChatWS.unsubscribe(subId);
    };
  }, [rocketChatUserId, wsReady]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await rocketChatService.getUsers(100, 0);
      if (response.success && response.users) {
        setUsers(response.users);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // ✅ Handle room selection: Clear unread count optimistically and mark as read via WebSocket
  const handleSelectRoom = async (room: UserSubscription) => {
    console.log('🔵 handleSelectRoom called:', {
      roomId: room.roomId,
      name: room.name,
      unreadCount: room.unreadCount,
      wsConnected: rocketChatWS.isConnected()
    });

    // Optimistic update: Reset unread count immediately
    if (room.unreadCount > 0) {
      setRooms(currentRooms => 
        currentRooms.map(r => 
          r.id === room.id 
            ? { ...r, unreadCount: 0 } 
            : r
        )
      );
      
      // Mark as read via WebSocket
      try {
        await rocketChatWS.markRoomAsRead(room.roomId);
      } catch (error) {
        console.error('❌ Failed to mark room as read:', error);
        // Revert optimistic update if failed
        setRooms(currentRooms => 
          currentRooms.map(r => 
            r.id === room.id 
              ? { ...r, unreadCount: room.unreadCount } 
              : r
          )
        );
      }
    }
    
    // Call parent callback
    onSelectRoom(room);
  };

  const handleStartChat = async (contactUser: User) => {
    setCreatingDM(contactUser._id);
    try {
      if (!user?.id) {
        console.error('No user found in authStore');
        return;
      }
      
      const currentUserId = user.id;
      
      // Create DM room
      const response = await rocketChatService.createDirectMessage(
        currentUserId,
        contactUser.username
      );
      
      if (response.success && response.roomId) {
        // ✅ Reload rooms
        const roomsResponse = await rocketChatService.getUserRooms(currentUserId);
        if (roomsResponse.success && roomsResponse.rooms) {
          setRooms(roomsResponse.rooms);
        }
        
        // Wait a bit for the room to appear in the list
        setTimeout(() => {
          setRooms(currentRooms => {
            const newRoom = currentRooms.find(r => r.roomId === response.roomId);
            if (newRoom) {
              handleSelectRoom(newRoom);
            }
            return currentRooms;
          });
        }, 500);
        
        // Clear search
        setSearchQuery('');
      }
    } catch (error) {
      console.error('Failed to create DM:', error);
    } finally {
      setCreatingDM(null);
    }
  };

  const filteredRooms = (rooms || [])
    .filter((room) =>
      room.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // Sort by lastMessageTime (newest first)
      const timeA = a.lastMessageTime?.getTime() || 0;
      const timeB = b.lastMessageTime?.getTime() || 0;
      if (timeB !== timeA) {
        return timeB - timeA;
      }
      // Fallback to name if timestamps are equal
      return (a.fullName || a.name).localeCompare(b.fullName || b.name);
    });

  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return false; // Only show when searching
    const search = searchQuery.toLowerCase();
    return (
      u.username?.toLowerCase().includes(search) ||
      u.name?.toLowerCase().includes(search)
    );
  });

  return (
    <>
      {/* Overlay cho mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar - Apple Style */}
      <div
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-80 bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50
          transform transition-transform duration-300 ease-in-out lg:transform-none
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col h-screen shadow-xl lg:shadow-none
        `}
      >
        {/* Header - Clean & Minimal */}
        <div className="px-4 pt-5 pb-3">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-[28px] font-bold text-gray-900 dark:text-white tracking-tight">Tin nhắn</h1>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowCreateModal(true)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-[#007aff] dark:hover:text-[#0a84ff] hover:bg-gray-100/60 dark:hover:bg-gray-700/40 rounded-lg transition-all duration-200"
                title="Tạo cuộc trò chuyện mới"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </button>
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search - Enhanced iOS Style */}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 dark:text-gray-500 transition-all duration-200 group-focus-within:text-[#007aff] dark:group-focus-within:text-[#0a84ff]" />
            <input
              type="text"
              placeholder="Tìm kiếm cuộc trò chuyện..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-gray-100/80 dark:bg-[#3a3a3c]/80 backdrop-blur-sm border-0 rounded-xl text-[15px] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 dark:focus:ring-[#0a84ff]/30 focus:bg-white dark:focus:bg-[#2c2c2e] transition-all duration-200 shadow-sm focus:shadow-md"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                aria-label="Xóa tìm kiếm"
              >
                <XCircle className="w-[18px] h-[18px] fill-current opacity-60 hover:opacity-100" />
              </button>
            )}
          </div>
        </div>

        {/* Rooms List - Apple Messages Style */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin inline-block w-6 h-6 border-[2.5px] border-current border-t-transparent rounded-full text-[#007aff]" />
              <p className="mt-3 text-[15px] text-gray-500 dark:text-gray-400">Đang tải...</p>
            </div>
          ) : (
            <>
              {/* Conversations Section */}
              {filteredRooms.length > 0 && (
                <div className="mb-4">
                  {searchQuery && (
                    <div className="px-4 py-2">
                      <h3 className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Cuộc trò chuyện
                      </h3>
                    </div>
                  )}
                  <div className="px-2">
                    {filteredRooms.map((room) => {
                      const displayName = room.fullName || room.name;
                      const isActive = selectedRoom?.id === room.id;
                      // Chỉ show badge khi có unread VÀ KHÔNG phải room đang active
                      const hasUnread = room.unreadCount > 0 && !isActive;

                      // Get initials for avatar
                      const getInitials = (name: string) => {
                        return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                      };

                      // Avatar color based on type - Apple style
                      const getAvatarColor = () => {
                        if (room.type === 'd') return 'bg-gradient-to-br from-[#007aff] to-[#5856d6]';
                        if (room.type === 'p') return 'bg-gradient-to-br from-[#5856d6] to-[#af52de]';
                        return 'bg-gradient-to-br from-[#34c759] to-[#30d158]';
                      };

                      return (
                        <button
                          key={room.id}
                          onClick={() => {
                            handleSelectRoom(room);
                            onCloseMobile();
                          }}
                          className={`
                            w-full px-3 py-2.5 text-left rounded-xl transition-all duration-200
                            ${isActive 
                              ? 'bg-[#007aff]/10 dark:bg-[#0a84ff]/20' 
                              : 'hover:bg-gray-100/60 dark:hover:bg-gray-700/40'
                            }
                          `}
                        >
                          <div className="flex items-center gap-3">
                            {/* Avatar - Refined */}
                            <div className={`relative flex-shrink-0 w-11 h-11 rounded-full ${getAvatarColor()} flex items-center justify-center text-white font-semibold text-[15px] shadow-md`}>
                              {getInitials(displayName)}
                              {/* Online status (for DMs) */}
                              {room.type === 'd' && (
                                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#34c759] border-[2.5px] border-white dark:border-[#1c1c1e] rounded-full" />
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline justify-between gap-2 mb-0.5">
                                <span className={`text-[17px] truncate ${
                                  hasUnread 
                                    ? 'font-semibold text-gray-900 dark:text-white' 
                                    : 'font-normal text-gray-900 dark:text-white'
                                }`}>
                                  {displayName}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <p className={`text-[15px] truncate ${
                                  hasUnread 
                                    ? 'text-gray-900 dark:text-white font-medium' 
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  {room.type === 'd' ? 'Tin nhắn trực tiếp' : room.type === 'p' ? 'Nhóm riêng tư' : 'Kênh công khai'}
                                </p>
                                {hasUnread && (
                                  <span className="flex-shrink-0 min-w-[20px] h-5 bg-[#007aff] dark:bg-[#0a84ff] text-white text-[13px] font-semibold rounded-full flex items-center justify-center px-1.5">
                                    {room.unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Contacts Section - Only show when searching */}
              {searchQuery && filteredUsers.length > 0 && (
                <div>
                  <div className="px-4 py-2">
                    <h3 className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Danh bạ
                    </h3>
                  </div>
                  <div className="px-2">
                    {filteredUsers.map((contactUser) => {
                      const displayName = contactUser.name || contactUser.username;
                      const isCreating = creatingDM === contactUser._id;

                      // Get initials for avatar
                      const getInitials = (name: string) => {
                        return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                      };

                      // Get avatar color
                      const getAvatarColor = (username: string) => {
                        const colors = [
                          'from-[#007aff] to-[#0051d5]',
                          'from-[#5856d6] to-[#3634a3]',
                          'from-[#ff2d55] to-[#c7254e]',
                          'from-[#34c759] to-[#248a3d]',
                          'from-[#ff9500] to-[#c93400]',
                          'from-[#af52de] to-[#8e24aa]',
                        ];
                        const index = username.charCodeAt(0) % colors.length;
                        return `bg-gradient-to-br ${colors[index]}`;
                      };

                      return (
                        <button
                          key={contactUser._id}
                          onClick={() => !isCreating && handleStartChat(contactUser)}
                          disabled={isCreating}
                          className="w-full px-3 py-2.5 text-left rounded-xl transition-all duration-200 hover:bg-gray-100/60 dark:hover:bg-gray-700/40 disabled:opacity-50"
                        >
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className={`relative flex-shrink-0 w-11 h-11 rounded-full ${getAvatarColor(contactUser.username)} flex items-center justify-center text-white font-semibold text-[15px] shadow-md`}>
                              {isCreating ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                getInitials(displayName)
                              )}
                              {contactUser.status === 'online' && !isCreating && (
                                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#34c759] border-[2.5px] border-white dark:border-[#1c1c1e] rounded-full" />
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline justify-between gap-2 mb-0.5">
                                <span className="text-[17px] truncate font-normal text-gray-900 dark:text-white">
                                  {displayName}
                                </span>
                                {!isCreating && (
                                  <MessageSquare className="flex-shrink-0 w-4 h-4 text-[#007aff] dark:text-[#0a84ff]" />
                                )}
                              </div>
                              <p className="text-[15px] truncate text-gray-500 dark:text-gray-400">
                                {isCreating ? 'Đang tạo cuộc trò chuyện...' : `@${contactUser.username}`}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!searchQuery && filteredRooms.length === 0 && (
                <div className="p-12 text-center">
                  <p className="text-[15px] text-gray-500 dark:text-gray-400">Chưa có cuộc trò chuyện nào</p>
                  <p className="text-[13px] text-gray-400 dark:text-gray-500 mt-1">Tìm kiếm người dùng để bắt đầu</p>
                </div>
              )}

              {/* No Results */}
              {searchQuery && filteredRooms.length === 0 && filteredUsers.length === 0 && (
                <div className="p-12 text-center">
                  <p className="text-[15px] text-gray-500 dark:text-gray-400">Không tìm thấy kết quả</p>
                  <p className="text-[13px] text-gray-400 dark:text-gray-500 mt-1">Thử từ khóa khác</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
          <UserMenu />
        </div>
      </div>

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={async () => {
          if (!user?.id) return;
          const response = await rocketChatService.getUserRooms(user.id);
          if (response.success && response.rooms) {
            setRooms(response.rooms);
          }
        }}
      />
    </>
  );
}

