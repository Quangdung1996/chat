'use client';

import { useState, useEffect, useRef } from 'react';
import rocketChatService from '@/services/rocketchat.service';
import RoomSettingsMenu from './RoomSettingsMenu';
import InviteMembersModal from './InviteMembersModal';
import ConfirmRemoveMemberModal from './ConfirmRemoveMemberModal';
import { Users, UserPlus, RefreshCw, X, Link as LinkIcon, LogOut } from 'lucide-react';
import type { UserSubscription, RoomMember } from '@/types/rocketchat';
import { useAuthStore } from '@/store/authStore';
import { 
  isDirectMessage, 
  getRoomTypeIcon, 
  getRoomTypeApiName 
} from '@/utils/roomTypeUtils';

interface RoomHeaderProps {
  room: UserSubscription;
  onRefresh?: () => void;
  onReadOnlyChange?: (isReadOnly: boolean, isOwner?: boolean) => void;
  onRoomInfoChange?: (info: { topic?: string; announcement?: string }) => void;
}

export default function RoomHeader({ room, onRefresh, onReadOnlyChange, onRoomInfoChange }: RoomHeaderProps) {
  const [showMembers, setShowMembers] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [roomDescription, setRoomDescription] = useState<string | undefined>();
  const [roomInfo, setRoomInfo] = useState<{
    topic?: string;
    announcement?: string;
    readOnly?: boolean;
  } | undefined>();
  
  // Confirm modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);
  const [removingMember, setRemovingMember] = useState(false);
  
  // Leave room modal state
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leavingRoom, setLeavingRoom] = useState(false);

  // Get current user ID from Zustand store
  const currentUserId = useAuthStore((state) => state.rocketChatUserId);

  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const loadRoomInfo = async () => {
    try {
      // ✅ Chỉ fetch room info cho group/channel, không cần cho direct message
      if (isDirectMessage(room.type)) {
        setIsReadOnly(false);
        onReadOnlyChange?.(false);
        console.log(`✅ Direct message room ${room.roomId} - skip room info`);
        return;
      }

      const roomType = getRoomTypeApiName(room.type);
      const response = await rocketChatService.getRoomInfo(room.roomId, roomType);
      
      if (response.success && response.room) {
        const readOnly = response.room.readOnly;
        setIsReadOnly(readOnly);
        
        // ✅ Priority: topic > announcement
        const displayText = response.room.topic || response.room.announcement;
        setRoomDescription(displayText);
        
        // ✅ Store room info for settings
        const roomInfoData = {
          topic: response.room.topic,
          announcement: response.room.announcement,
          readOnly: response.room.readOnly,
        };
        setRoomInfo(roomInfoData);
        
        // ✅ Check if current user is the owner using room info
        const isOwner = response.room.u?._id === currentUserId;
        
        // Notify parent with readonly status and owner info
        onReadOnlyChange?.(readOnly, isOwner);
        
        // ✅ Notify parent with topic and announcement
        onRoomInfoChange?.({
          topic: response.room.topic,
          announcement: response.room.announcement,
        });
        console.log(`✅ Room ${room.roomId} readOnly: ${readOnly}, isOwner: ${isOwner}, owner: ${response.room.u?.username}, topic: ${response.room.topic}, announcement: ${response.room.announcement}`);
      }
    } catch (error) {
      console.error('Failed to load room info:', error);
      setIsReadOnly(false);
      onReadOnlyChange?.(false);
    }
  };

  const loadMembers = async () => {
    setLoadingMembers(true);
    try {
      // Determine room type for API call
      const roomType = getRoomTypeApiName(room.type);

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

  const handleKickMember = (memberId: string, memberName: string) => {
    setMemberToRemove({ id: memberId, name: memberName });
    setConfirmModalOpen(true);
  };

  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;

    setRemovingMember(true);

    try {
      const roomType = getRoomTypeApiName(room.type);
      const response = await rocketChatService.removeMember(room.roomId, memberToRemove.id, roomType);

      if (response.success) {
        setConfirmModalOpen(false);
        setMemberToRemove(null);
        // Reload members list
        await loadMembers();
        onRefresh?.();
      }
    } catch (error) {
      console.error('Failed to kick member:', error);
    } finally {
      setRemovingMember(false);
    }
  };

  const handleCancelRemove = () => {
    setConfirmModalOpen(false);
    setMemberToRemove(null);
  };

  const handleLeaveGroup = async () => {
    setLeavingRoom(true);
    try {
      const roomType = getRoomTypeApiName(room.type);
      const response = await rocketChatService.leaveRoom(room.roomId, roomType);

      if (response.success) {
        setShowLeaveModal(false);
        setShowMembers(false);
        onRefresh?.();
      } else {
        alert('Không thể rời khỏi phòng. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Failed to leave room:', error);
      alert('Có lỗi xảy ra khi rời khỏi phòng.');
    } finally {
      setLeavingRoom(false);
    }
  };

  useEffect(() => {
    if (showMembers && members.length === 0) {
      loadMembers();
    }
  }, [showMembers]);

  // Load room info when component mounts or room changes
  useEffect(() => {
    loadRoomInfo();
  }, [room.roomId]);

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
              {getRoomTypeIcon(room.type)}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-[17px] font-semibold text-gray-900 dark:text-white truncate leading-tight">
                {room.fullName || room.name}
              </h2>
              {roomDescription && (
                <p className="text-[12px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {roomDescription}
                </p>
              )}
              <div className="flex items-center gap-2.5 mt-0.5">
                {/* ✅ Chỉ show members count cho group/channel, không cần cho direct message */}
                {!isDirectMessage(room.type) && (
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
                )}
                {isReadOnly && (
                  <span className="flex items-center gap-1.5 text-[11px] bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 px-2 py-0.5 rounded-full font-medium">
                    🔒 Read-only
                  </span>
                )}
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
            {/* ✅ Chỉ show invite button cho group/channel, không cần cho direct message */}
            {!isDirectMessage(room.type) && (
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
            )}

            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-[#007aff] dark:hover:text-[#0a84ff] hover:bg-gray-100/60 dark:hover:bg-gray-700/40 rounded-lg transition-all duration-200"
                title="Làm mới"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            )}

            <RoomSettingsMenu 
              room={room} 
              onUpdate={() => {
                // Reload room info when settings are updated
                loadRoomInfo();
                onRefresh?.();
              }}
              roomInfo={roomInfo}
              members={members}
            />
          </div>
        </div>
      </div>

      {/* Members Dropdown - MS Teams style - MOVED OUTSIDE to avoid stacking context */}
      {/* ✅ Chỉ show members dropdown cho group/channel, không cần cho direct message */}
      {showMembers && !isDirectMessage(room.type) && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[99998]"
            onClick={() => setShowMembers(false)}
          />
          {/* Dropdown */}
          <div
            ref={dropdownRef}
            className="fixed top-[70px] right-4 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-[99999] max-h-[calc(100vh-80px)] overflow-hidden flex flex-col"
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
                  const isCurrentUser = member._id === currentUserId;

                  return (
                    <div
                      key={member._id}
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
                              <span className="text-xs text-gray-500 dark:text-gray-400">(Tôi)</span>
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

                        {/* Kick button - show for all members except current user. API will handle permissions */}
                        {!isCurrentUser && (
                          <button
                            onClick={() => handleKickMember(member._id, displayName)}
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
                onClick={() => setShowLeaveModal(true)}
                className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Leave</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Invite Members Modal */}
      <InviteMembersModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        roomId={room.roomId}
        roomName={room.name}
        roomType={getRoomTypeApiName(room.type)}
        currentMembers={members}
        onSuccess={() => {
          loadMembers();
          onRefresh?.();
        }}
      />

      {/* Confirm Remove Member Modal */}
      <ConfirmRemoveMemberModal
        isOpen={confirmModalOpen}
        memberName={memberToRemove?.name || ''}
        onConfirm={handleConfirmRemove}
        onClose={handleCancelRemove}
        loading={removingMember}
      />

      {/* Confirm Leave Room Modal */}
      <ConfirmRemoveMemberModal
        isOpen={showLeaveModal}
        memberName={room.name}
        onConfirm={handleLeaveGroup}
        onClose={() => setShowLeaveModal(false)}
        loading={leavingRoom}
        mode="leave"
        roomType={room.type}
      />
    </>
  );
}

