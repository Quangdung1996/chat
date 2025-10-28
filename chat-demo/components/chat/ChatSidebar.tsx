'use client';

import { useState, useEffect } from 'react';
import rocketChatService from '@/services/rocketchat.service';
import UserMenu from '@/components/UserMenu';
import type { Room } from '@/types/rocketchat';

interface ChatSidebarProps {
  selectedRoom: Room | null;
  onSelectRoom: (room: Room) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function ChatSidebar({
  selectedRoom,
  onSelectRoom,
  isMobileOpen,
  onCloseMobile,
}: ChatSidebarProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const response = await rocketChatService.getRooms({}, { page: 1, pageSize: 100 });
      if (response.success && response.data) {
        setRooms(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
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
          w-80 bg-white dark:bg-gray-800 border-r dark:border-gray-700
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="p-4 border-b dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              💬 Chat Demo
            </h1>
            <button
              onClick={onCloseMobile}
              className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              ✕
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm phòng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
            <svg
              className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Rooms List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full" />
              <p className="mt-2 text-sm">Đang tải...</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <p className="text-sm">Không tìm thấy phòng nào</p>
            </div>
          ) : (
            <div className="divide-y dark:divide-gray-700">
              {filteredRooms.map((room) => (
                <button
                  key={room.roomId}
                  onClick={() => {
                    onSelectRoom(room);
                    onCloseMobile();
                  }}
                  className={`
                    w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                    ${selectedRoom?.roomId === room.roomId ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* Room Icon */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl">
                      {room.isPrivate ? '🔒' : '📢'}
                    </div>

                    {/* Room Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {room.name}
                        </h3>
                        {room.memberCount > 0 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                            {room.memberCount}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {room.groupCode}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {room.readOnly && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-0.5 rounded">
                            Read-only
                          </span>
                        )}
                        {room.archived && (
                          <span className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400 px-2 py-0.5 rounded">
                            Archived
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer - User Menu & Refresh */}
        <div className="p-4 border-t dark:border-gray-700 space-y-3">
          <button
            onClick={loadRooms}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
          >
            🔄 Tải lại danh sách
          </button>
          <UserMenu />
        </div>
      </div>
    </>
  );
}

