'use client';

import { useState, useEffect, useRef } from 'react';
import rocketChatService from '@/services/rocketchat.service';
import RoomSettingsMenu from './RoomSettingsMenu';
import InviteMembersModal from './InviteMembersModal';
import { Users, UserPlus, RefreshCw, X, Link as LinkIcon, LogOut } from 'lucide-react';
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
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if current user is owner or moderator
  const currentUserMember = members.find(m => m.id === currentUserId);
  const isOwnerOrMod = currentUserMember?.roles?.includes('owner') || currentUserMember?.roles?.includes('moderator');

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

  const handleKickMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Bạn có chắc muốn kick ${memberName} khỏi group?`)) {
      return;
    }

    try {
      const roomType = room.type === 'p' ? 'group' : room.type === 'c' ? 'channel' : 'direct';
      const response = await rocketChatService.manageMember(room.roomId, memberId, 'kick', roomType);
      
      if (response.success) {
        // Reload members list
        await loadMembers();
        onRefresh();
      } else {
        alert('Không thể kick thành viên. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Failed to kick member:', error);
      alert('Có lỗi xảy ra khi kick thành viên.');
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm('Bạn có chắc muốn rời khỏi group này?')) {
      return;
    }

    try {
      const roomType = room.type === 'p' ? 'group' : room.type === 'c' ? 'channel' : 'direct';
      const response = await rocketChatService.leaveRoom(room.roomId, roomType);
      
      if (response.success) {
        onRefresh();
        setShowMembers(false);
      } else {
        alert('Không thể rời group. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Failed to leave group:', error);
      alert('Có lỗi xảy ra khi rời group.');
    }
  };

  // Get current user ID from localStorage
  useEffect(() => {
    const userId = localStorage.getItem('rocketChatUserId');
    if (userId) {
      setCurrentUserId(userId);
    }
  }, []);

  useEffect(() => {
    if (showMembers && members.length === 0) {
      loadMembers();
    }
  }, [showMembers]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMembers(false);
      }
    };

    if (showMembers) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
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
                  onClick={() => {
                    setShowMembers(!showMembers);
                    if (!showMembers && members.length === 0) {
                      loadMembers();
                    }
                  }}
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
          <div className="flex items-center gap-0.5 relative">
            <button
              onClick={() => {
                setShowMembers(!showMembers);
                if (!showMembers && members.length === 0) {
                  loadMembers();
                }
              }}
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

            {/* Members Dropdown - MS Teams style */}
            {showMembers && (
              <div
                ref={dropdownRef}
                className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-[500px] overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className="px-4 py-3 border-b dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    People ({members.length})
                  </h3>
                </div>

                {/* Members List */}
                {loadingMembers ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full text-blue-600" />
                  </div>
                ) : (
                  <div className="overflow-y-auto flex-1">
                    {members.map((member) => {
                      const displayName = member.name || member.username;
                      const isOwner = member.roles?.includes('owner');
                      const isModerator = member.roles?.includes('moderator');
                      const isCurrentUser = member.id === currentUserId;
                      
                      return (
                        <div
                          key={member.id}
                          className="px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            {/* Avatar with status */}
                            <div className="relative flex-shrink-0">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                                {member.username.slice(0, 2).toUpperCase()}
                              </div>
                              {member.status === 'online' && (
                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                              )}
                            </div>
                            
                            {/* User info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {displayName}
                                </p>
                                {isCurrentUser && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">(You)</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  @{member.username}
                                </p>
                                {(isOwner || isModerator) && (
                                  <span className="text-xs text-yellow-600 dark:text-yellow-400">
                                    {isOwner ? '👑' : '⭐'}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Kick button - only show if current user is owner/mod and target is not current user */}
                            {isOwnerOrMod && !isCurrentUser && (
                              <button
                                onClick={() => handleKickMember(member.id, displayName)}
                                className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                title="Kick thành viên"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Footer Actions */}
                <div className="border-t dark:border-gray-700 p-2">
                  <button
                    onClick={() => {
                      setShowInviteModal(true);
                      setShowMembers(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add people</span>
                  </button>
                  <button
                    onClick={handleLeaveGroup}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Leave</span>
                  </button>
                </div>
              </div>
            )}
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
    </>
  );
}

