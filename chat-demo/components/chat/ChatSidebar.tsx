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
  targetRoomId?: string | null;
  onRoomSelected?: () => void;
}

export default function ChatSidebar({
  selectedRoom,
  onSelectRoom,
  isMobileOpen,
  onCloseMobile,
  targetRoomId,
  onRoomSelected,
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

  // Auto-select room khi có targetRoomId từ URL
  useEffect(() => {
    if (targetRoomId && rooms.length > 0) {
      const targetRoom = rooms.find(room => room.roomId === targetRoomId);
      if (targetRoom) {
        onSelectRoom(targetRoom);
        onRoomSelected?.(); // Clear targetRoomId sau khi đã select
      }
    }
  }, [targetRoomId, rooms, onSelectRoom, onRoomSelected]);

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

          {/* Search - iOS Style */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-[#3a3a3c] border-0 rounded-lg text-[17px] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007aff]/20 dark:focus:ring-[#0a84ff]/20 transition-all"
            />
          </div>
        </div>

        {/* Rooms List - Apple Messages Style */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin inline-block w-6 h-6 border-[2.5px] border-current border-t-transparent rounded-full text-[#007aff]" />
              <p className="mt-3 text-[15px] text-gray-500 dark:text-gray-400">Đang tải...</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-[15px] text-gray-500 dark:text-gray-400">Không tìm thấy cuộc trò chuyện</p>
            </div>
          ) : (
            <>
              {/* Conversations - Clean List */}
              <div className="px-2">
                {filteredRooms.map((room) => {
                  const displayName = room.fullName || room.name;
                  const hasUnread = room.unreadCount > 0;
                  const isActive = selectedRoom?.id === room.id;

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
                        onSelectRoom(room);
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

