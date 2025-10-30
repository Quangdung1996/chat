'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import rocketChatService from '@/services/rocketchat.service';
import UserMenu from '@/components/UserMenu';
import CreateRoomModal from './CreateRoomModal';
import { Search, Plus, X, ChevronDown } from 'lucide-react';
import type { UserSubscription } from '@/types/rocketchat';

interface ChatSidebarProps {
  selectedRoom: UserSubscription | null;
  onSelectRoom: (room: UserSubscription) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function ChatSidebar({
  selectedRoom,
  onSelectRoom,
  isMobileOpen,
  onCloseMobile,
}: ChatSidebarProps) {
  const user = useAuthStore((state) => state.user);
  const [rooms, setRooms] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadRooms();
    }
  }, [user?.id]);

  const loadRooms = async () => {
    if (!user?.id) {
      console.warn('User ID not available');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await rocketChatService.getUserRooms(user.id);
      if (response.success && response.rooms) {
        setRooms(response.rooms || []);
      }
    } catch (error) {
      console.error('Failed to load rooms:', error);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = (rooms || []).filter((room) =>
    room.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Overlay cho mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:relative inset-y-0 left-0 z-50
          w-80 bg-gray-50 dark:bg-gray-800 border-r dark:border-gray-700
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Chat</h1>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowCreateModal(true)}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="New chat"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-md text-sm focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-gray-500"
            />
          </div>
        </div>

        {/* Rooms List - Teams Style */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full" />
              <p className="mt-2 text-sm">Loading...</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <p className="text-sm">No conversations found</p>
            </div>
          ) : (
            <>
              {/* Recent Section */}
              <div className="px-4 py-2 bg-white dark:bg-gray-800">
                <button className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                  <ChevronDown className="w-4 h-4" />
                  Recent
                </button>
              </div>

              {/* Conversations */}
              <div className="bg-white dark:bg-gray-800">
                {filteredRooms.map((room) => {
                  const displayName = room.fullName || room.name;
                  const hasUnread = room.unreadCount > 0;
                  const isActive = selectedRoom?.id === room.id;

                  // Get initials for avatar
                  const getInitials = (name: string) => {
                    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                  };

                  // Avatar color based on type
                  const getAvatarColor = () => {
                    if (room.type === 'd') return 'bg-gradient-to-br from-blue-400 to-blue-600';
                    if (room.type === 'p') return 'bg-gradient-to-br from-purple-400 to-purple-600';
                    return 'bg-gradient-to-br from-green-400 to-green-600';
                  };

                  return (
                    <button
                      key={room.id}
                      onClick={() => {
                        onSelectRoom(room);
                        onCloseMobile();
                      }}
                      className={`
                        w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                        ${isActive ? 'bg-gray-100 dark:bg-gray-700 border-l-2 border-blue-600' : ''}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className={`relative flex-shrink-0 w-10 h-10 rounded-full ${getAvatarColor()} flex items-center justify-center text-white font-semibold text-sm shadow-sm`}>
                          {getInitials(displayName)}
                          {/* Online status (for DMs) */}
                          {room.type === 'd' && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className={`text-sm truncate ${hasUnread ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                              {displayName}
                            </span>
                            {hasUnread && (
                              <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                {room.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {room.type === 'd' ? 'Direct message' : room.type === 'p' ? 'Private group' : 'Public channel'}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
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
        onSuccess={loadRooms}
      />
    </>
  );
}

