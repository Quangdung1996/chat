'use client';

import { useState, useEffect, useRef } from 'react';
import rocketChatService from '@/services/rocketchat.service';
import RoomSettingsMenu from './RoomSettingsMenu';
import InviteMembersModal from './InviteMembersModal';
import ConfirmRemoveMemberModal from './ConfirmRemoveMemberModal';
import { Users, UserPlus, RefreshCw, X, Link as LinkIcon, LogOut, MoreVertical, Crown, Star, UserMinus2 } from 'lucide-react';
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
  
  // Role management state
  const [showRoleMenu, setShowRoleMenu] = useState<string | null>(null);
  const [roleAction, setRoleAction] = useState<{
    action: 'addOwner' | 'removeOwner' | 'addModerator' | 'removeModerator';
    memberId: string;
    memberName: string;
  } | null>(null);
  const [processingRole, setProcessingRole] = useState(false);

  // Get current user ID from Zustand store
  const currentUserId = useAuthStore((state) => state.rocketChatUserId);

  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const loadRoomInfo = async () => {
    try {
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
        
        const displayText = response.room.topic || response.room.announcement;
        setRoomDescription(displayText);
        
        const roomInfoData = {
          topic: response.room.topic,
          announcement: response.room.announcement,
          readOnly: response.room.readOnly,
        };
        setRoomInfo(roomInfoData);
        
        const isOwner = response.room.u?._id === currentUserId;
        
        onReadOnlyChange?.(readOnly, isOwner);
        
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
      await rocketChatService.leaveRoom(room.roomId, roomType);
      onRefresh?.();
      setShowLeaveModal(false);
    } catch (error) {
      console.error('Failed to leave room:', error);
      alert('Failed to leave room: ' + (error as Error).message);
    } finally {
      setLeavingRoom(false);
    }
  };

  const canManageRoles = () => {
    if (!currentUserId || room.type !== 'p') return false;
    const currentMember = members.find(m => m._id === currentUserId);
    const isOwner = currentMember?.roles?.includes('owner') || false;
    const isModerator = currentMember?.roles?.includes('moderator') || false;
    return isOwner || isModerator;
  };

  const handleRoleAction = async () => {
    if (!roleAction) return;
    
    setProcessingRole(true);
    try {
      const roomType = getRoomTypeApiName(room.type);
      
      switch (roleAction.action) {
        case 'addOwner':
          await rocketChatService.addOwner(room.roomId, roleAction.memberId, roomType);
          break;
        case 'removeOwner':
          await rocketChatService.removeOwner(room.roomId, roleAction.memberId, roomType);
          break;
        case 'addModerator':
          await rocketChatService.addModerator(room.roomId, roleAction.memberId, roomType);
          break;
        case 'removeModerator':
          await rocketChatService.removeModerator(room.roomId, roleAction.memberId, roomType);
          break;
      }
      
      await loadMembers();
      setRoleAction(null);
      
    } catch (error) {
      console.error('Failed to change role:', error);
      alert('Không thể thay đổi vai trò: ' + (error as Error).message);
    } finally {
      setProcessingRole(false);
    }
  };

  useEffect(() => {
    if (showMembers && members.length === 0) {
      loadMembers();
    }
  }, [showMembers]);

  useEffect(() => {
    loadRoomInfo();
  }, [room.roomId]);

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

  useEffect(() => {
    if (roleAction) {
      setShowRoleMenu(null);
      
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !processingRole) {
          setRoleAction(null);
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [roleAction, processingRole]);

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
                loadRoomInfo();
                onRefresh?.();
              }}
              roomInfo={roomInfo}
              members={members}
            />
          </div>
        </div>
      </div>

      {/* Members Dropdown - MS Teams style */}
      {showMembers && !isDirectMessage(room.type) && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[29]"
            onClick={() => setShowMembers(false)}
          />
          {/* Dropdown */}
          <div
            ref={dropdownRef}
            className="fixed top-[70px] right-4 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-30 max-h-[calc(100vh-80px)] overflow-hidden flex flex-col"
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
                      data-member-id={member._id}
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

                        {/* Actions - only show for groups and if user can manage */}
                        {!isCurrentUser && room.type === 'p' && canManageRoles() && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            {/* Role Management Dropdown */}
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowRoleMenu(showRoleMenu === member._id ? null : member._id);
                                }}
                                className="p-1 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-all"
                                title="Quản lý vai trò"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              
                              {/* Role Menu Dropdown */}
                              {showRoleMenu === member._id && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-[39]" 
                                    onClick={() => setShowRoleMenu(null)}
                                  />
                                  <div className={`absolute right-0 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-40 py-1 ${
                                    // Check if this is one of the last 2 members to show menu upward
                                    members.indexOf(member) >= members.length - 2 
                                      ? 'bottom-full mb-1' 
                                      : 'top-full mt-1'
                                  }`}>
                                    {/* Add/Remove Owner */}
                                    {!isOwner ? (
                                      <button
                                        onClick={() => {
                                          setRoleAction({
                                            action: 'addOwner',
                                            memberId: member._id,
                                            memberName: displayName
                                          });
                                          setShowRoleMenu(null);
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                      >
                                        <Crown className="w-4 h-4 text-yellow-500" />
                                        Gán làm Owner
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setRoleAction({
                                            action: 'removeOwner',
                                            memberId: member._id,
                                            memberName: displayName
                                          });
                                          setShowRoleMenu(null);
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                      >
                                        <UserMinus2 className="w-4 h-4 text-gray-500" />
                                        Bỏ quyền Owner
                                      </button>
                                    )}
                                    
                                    {/* Add/Remove Moderator */}
                                    {!isModerator && !isOwner ? (
                                      <button
                                        onClick={() => {
                                          setRoleAction({
                                            action: 'addModerator',
                                            memberId: member._id,
                                            memberName: displayName
                                          });
                                          setShowRoleMenu(null);
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                      >
                                        <Star className="w-4 h-4 text-blue-500" />
                                        Gán làm Moderator
                                      </button>
                                    ) : isModerator && !isOwner ? (
                                      <button
                                        onClick={() => {
                                          setRoleAction({
                                            action: 'removeModerator',
                                            memberId: member._id,
                                            memberName: displayName
                                          });
                                          setShowRoleMenu(null);
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                      >
                                        <UserMinus2 className="w-4 h-4 text-gray-500" />
                                        Bỏ quyền Moderator
                                      </button>
                                    ) : null}
                                    
                                    <div className="border-t dark:border-gray-700 my-1" />
                                    
                                    {/* Kick Member */}
                                    <button
                                      onClick={() => {
                                        handleKickMember(member._id, displayName);
                                        setShowRoleMenu(null);
                                      }}
                                      className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                    >
                                      <X className="w-4 h-4" />
                                      Kick khỏi nhóm
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Simple kick button for non-group rooms or users without manage permissions */}
                        {!isCurrentUser && (room.type !== 'p' || !canManageRoles()) && (
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
                onClick={() => setShowInviteModal(true)}
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
      
      {/* Role Change Confirmation Modal */}
      {roleAction && (
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={processingRole ? undefined : () => setRoleAction(null)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 transform transition-all duration-200 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Xác nhận thay đổi vai trò
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {roleAction.action === 'addOwner' && `Bạn có chắc muốn gán quyền Owner cho "${roleAction.memberName}"?`}
              {roleAction.action === 'removeOwner' && `Bạn có chắc muốn bỏ quyền Owner của "${roleAction.memberName}"?`}
              {roleAction.action === 'addModerator' && `Bạn có chắc muốn gán quyền Moderator cho "${roleAction.memberName}"?`}
              {roleAction.action === 'removeModerator' && `Bạn có chắc muốn bỏ quyền Moderator của "${roleAction.memberName}"?`}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRoleAction(null)}
                disabled={processingRole}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleRoleAction}
                disabled={processingRole}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                {processingRole ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}