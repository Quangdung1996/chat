'use client';

import { useState, useEffect } from 'react';
import rocketChatService from '@/services/rocketchat.service';
import RoomSettingsMenu from './RoomSettingsMenu';
import InviteMembersModal from './InviteMembersModal';
import { Users, UserPlus, RefreshCw } from 'lucide-react';
import type { UserSubscription, RoomMember } from '@/types/rocketchat';

interface RoomHeaderProps {
  room: UserSubscription;
  onRefresh: () => void;
}

export default function RoomHeader({ room, onRefresh }: RoomHeaderProps) {
  const [showMembers, setShowMembers] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const loadMembers = async () => {
    setLoadingMembers(true);
    try {
      // Determine room type for API call
      const roomType = room.type === 'p' ? 'group' : room.type === 'c' ? 'channel' : 'direct';
      
      const response = await rocketChatService.getRoomMembers(room.roomId, roomType);
      
      if (response.success && response.members) {
        setMembers(response.members);
        console.log(`✅ Loaded ${response.members.length} members for room ${room.roomId}`);
      } else {
        console.warn('Failed to load members:', response);
        setMembers([]);
      }
    } catch (error) {
      console.error('Failed to load members:', error);
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (showMembers && members.length === 0) {
      loadMembers();
    }
  }, [showMembers]);

  return (
    <>
      {/* Apple Style Header with Frosted Glass */}
      <div className="flex-shrink-0 bg-white/80 dark:bg-[#2c2c2e]/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 px-5 py-3">
        <div className="flex items-center justify-between">
          {/* Room Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#007aff] to-[#5856d6] flex items-center justify-center text-white text-sm flex-shrink-0 shadow-md">
              {room.type === 'd' ? '💬' : room.type === 'p' ? '🔒' : '📢'}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-[17px] font-semibold text-gray-900 dark:text-white truncate leading-tight">
                {room.fullName || room.name}
              </h2>
              <div className="flex items-center gap-2.5 mt-0.5">
                <button
                  onClick={() => setShowMembers(!showMembers)}
                  className="text-[13px] text-gray-500 dark:text-gray-400 hover:text-[#007aff] dark:hover:text-[#0a84ff] flex items-center gap-1 transition-colors duration-200"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{members.length || '...'} thành viên</span>
                </button>
                {room.unreadCount > 0 && (
                  <span className="flex items-center gap-1.5 text-[11px] bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    {room.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions - Minimalist */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setShowInviteModal(true)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-[#007aff] dark:hover:text-[#0a84ff] hover:bg-gray-100/60 dark:hover:bg-gray-700/40 rounded-lg transition-all duration-200"
              title="Mời thành viên"
            >
              <UserPlus className="w-5 h-5" />
            </button>

            <button
              onClick={onRefresh}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-[#007aff] dark:hover:text-[#0a84ff] hover:bg-gray-100/60 dark:hover:bg-gray-700/40 rounded-lg transition-all duration-200"
              title="Làm mới"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            <RoomSettingsMenu room={room} onUpdate={onRefresh} />
          </div>
        </div>
      </div>

      {/* Invite Members Modal */}
      <InviteMembersModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        roomId={room.roomId}
        onSuccess={() => {
          loadMembers();
          onRefresh();
        }}
      />

      {/* Members Sidebar */}
      {showMembers && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowMembers(false)}
          />

          {/* Sidebar */}
          <div className="fixed right-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-800 shadow-xl z-50 overflow-y-auto">
            <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Thành viên ({members.length})
              </h3>
              <button
                onClick={() => setShowMembers(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                ✕
              </button>
            </div>

            {loadingMembers ? (
              <div className="p-4 text-center">
                <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full text-blue-600" />
              </div>
            ) : (
              <div className="divide-y dark:divide-gray-700">
                {members.map((member) => {
                  const displayName = member.name || member.username;
                  const isOwner = member.roles?.includes('owner');
                  const isModerator = member.roles?.includes('moderator');
                  
                  return (
                    <div key={member.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-center gap-3">
                        {/* Avatar with status */}
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-semibold">
                            {member.username.slice(0, 2).toUpperCase()}
                          </div>
                          {member.status === 'online' && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                          )}
                        </div>
                        
                        {/* User info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">
                            {displayName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            @{member.username}
                          </p>
                        </div>
                        
                        {/* Role badge */}
                        {(isOwner || isModerator) && (
                          <span
                            className={`text-xs px-2 py-1 rounded flex-shrink-0 ${
                              isOwner
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}
                          >
                            {isOwner ? '👑 Owner' : '⭐ Mod'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

