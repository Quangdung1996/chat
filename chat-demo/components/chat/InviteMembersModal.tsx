'use client';

import { useState, useEffect } from 'react';
import rocketChatService from '@/services/rocketchat.service';
import { toastHelpers } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Users, UserPlus, X, Check, AlertCircle, UserMinus } from 'lucide-react';
import type { RoomMember, RoomTypeApiName } from '@/types/rocketchat';
import ConfirmRemoveMemberModal from './ConfirmRemoveMemberModal';
import { getInitials, getAvatarColor } from '@/utils/avatarUtils';

interface InviteMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomName?: string;
  roomType?: RoomTypeApiName;
  currentMembers?: RoomMember[]; // Pass existing members
  onSuccess: () => void;
}

interface User {
  _id: string;
  username: string;
  name?: string;
  emails?: { address: string }[];
  status?: string;
}

export default function InviteMembersModal({
  isOpen,
  onClose,
  roomId,
  roomName,
  roomType = 'group',
  currentMembers = [],
  onSuccess,
}: InviteMembersModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  // Confirm modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);
  const [removingMember, setRemovingMember] = useState(false);

  // Get current user ID from localStorage
  useEffect(() => {
    const userId = localStorage.getItem('rocketChatUserId');
    if (userId) {
      setCurrentUserId(userId);
    }
  }, []);

  // Load users when modal opens
  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedMembers([]);
      setSearchTerm('');
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await rocketChatService.getUsers(100, 0);
      if (response.success && response.users) {
        setUsers(response.users);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Không thể tải danh sách người dùng');
    } finally {
      setLoadingUsers(false);
    }
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev => {
      const newState = prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId];
      return newState;
    });
  };

  const handleSubmit = async () => {
    if (selectedMembers.length === 0) {
      setError('Vui lòng chọn ít nhất một thành viên');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Add members
      const response = await rocketChatService.addMembers(roomId, selectedMembers, roomType);

      if (response.success) {
        const successMsg = `Đã thêm ${response.successCount} thành viên thành công!`;
        setSuccess(successMsg);
        toastHelpers.success(successMsg);
        setTimeout(() => {
        onSuccess();
        onClose();
        }, 1500);
      } else {
        const errorMsg = 'Không thể thêm thành viên';
        setError(errorMsg);
        toastHelpers.error(errorMsg);
      }
    } catch (err) {
      const errorMsg = (err as Error).message || 'Đã xảy ra lỗi';
      setError(errorMsg);
      toastHelpers.error('Lỗi thêm thành viên', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMemberClick = (memberId: string, memberName: string, event: React.MouseEvent) => {
    // Stop event propagation to prevent toggleMember from firing
    event.stopPropagation();
    
    // Open confirm modal
    setMemberToRemove({ id: memberId, name: memberName });
    setConfirmModalOpen(true);
  };

  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;

    setRemovingMember(true);
    setError(null);

    try {
      const response = await rocketChatService.removeMember(roomId, memberToRemove.id, roomType);
      
      if (response.success) {
        const successMsg = `Đã xóa ${memberToRemove.name} khỏi nhóm!`;
        setSuccess(successMsg);
        toastHelpers.success(successMsg);
        setConfirmModalOpen(false);
        setMemberToRemove(null);
        setTimeout(() => {
          onSuccess(); // Refresh member list
        }, 1000);
      } else {
        const errorMsg = 'Không thể xóa thành viên';
        setError(errorMsg);
        toastHelpers.error(errorMsg);
      }
    } catch (err: any) {
      console.error('Failed to remove member:', err);
      // Display specific error message from API or fallback
      const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi xóa thành viên';
      setError(errorMessage);
      toastHelpers.error('Lỗi xóa thành viên', errorMessage);
    } finally {
      setRemovingMember(false);
    }
  };

  const handleCancelRemove = () => {
    setConfirmModalOpen(false);
    setMemberToRemove(null);
  };

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      user.username?.toLowerCase().includes(search) ||
      user.name?.toLowerCase().includes(search)
    );
  });


  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-[440px] max-h-[75vh] p-0 gap-0 overflow-hidden flex flex-col bg-white dark:bg-[#1c1c1e] shadow-2xl rounded-xl border-0">
        {/* Header - Modern & Clean */}
        <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800/50 bg-gradient-to-b from-gray-50/50 to-transparent dark:from-gray-900/20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-[16px] font-bold text-gray-900 dark:text-white">
                  Thêm thành viên
                </DialogTitle>
                {roomName && (
                  <DialogDescription className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {roomName}
                  </DialogDescription>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-5 py-4 overflow-hidden">
          {/* Messages - Minimal Style */}
          {error && (
            <div className="mb-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg text-[12px] flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-3 py-2 rounded-lg text-[12px] flex items-center gap-2">
              <Check className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="space-y-3">
            {/* Search Bar - Clean */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm tên hoặc username..."
                className="pl-9 pr-3 h-10 text-[13px] bg-gray-50/80 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:border-blue-400 dark:focus:border-blue-500 rounded-lg transition-colors"
                autoFocus
              />
            </div>

            {/* Selected Count Badge - Minimal */}
            {selectedMembers.length > 0 && (
              <div className="flex items-center justify-between px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <span className="text-[12px] font-medium text-blue-700 dark:text-blue-400">
                  {selectedMembers.length} người được chọn
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedMembers([])}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Xóa
                </button>
              </div>
            )}

            {/* User List - Minimal Height Items */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
              <ScrollArea className="h-[300px]">
                {loadingUsers ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin inline-block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                    <p className="mt-2 text-[12px] text-gray-500 dark:text-gray-400">Đang tải...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    <p className="text-[13px] font-medium text-gray-600 dark:text-gray-400">
                      {searchTerm ? 'Không tìm thấy' : 'Không có người dùng'}
                    </p>
                  </div>
                ) : (
                  <div>
                    {filteredUsers.map(user => {
                      const isSelected = selectedMembers.includes(user._id);
                      const displayName = user.name || user.username;
                      const isCurrentMember = currentMembers.some(m => m._id === user._id);
                      const isSelf = user._id === currentUserId;
                      
                      return (
                        <div
                          key={user._id}
                          className={`relative flex items-center gap-2 px-3 py-2 border-b border-gray-50 dark:border-gray-800/50 last:border-0 transition-colors ${
                            isSelected 
                              ? 'bg-blue-50/50 dark:bg-blue-900/10' 
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => !isCurrentMember && toggleMember(user._id)}
                            disabled={isCurrentMember}
                            className="flex-1 flex items-center gap-2 text-left min-w-0"
                          >
                            {/* Avatar - Small */}
                            <div className="relative flex-shrink-0">
                              <div className={`w-7 h-7 rounded-full ${getAvatarColor(user.username)} flex items-center justify-center text-white font-semibold text-[10px]`}>
                                {getInitials(displayName)}
                              </div>
                              {user.status === 'online' && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 border border-white dark:border-gray-900 rounded-full" />
                              )}
                            </div>
                            
                            {/* Info - Minimal */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">
                                  {displayName}
                                </span>
                                {isCurrentMember && (
                                  <span className="text-[9px] font-medium px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-sm">
                                    Thành viên
                                  </span>
                                )}
                                {isSelf && (
                                  <span className="text-[9px] font-medium px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-sm">
                                    Bạn
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                @{user.username}
                              </div>
                            </div>
                          </button>

                          {/* Actions - Minimal */}
                          <div className="flex items-center flex-shrink-0">
                            {/* Remove button - Red */}
                            {isCurrentMember && !isSelf && (
                              <button
                                type="button"
                                onClick={(e) => handleRemoveMemberClick(user._id, displayName, e)}
                                className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors group/remove"
                                title="Xóa"
                              >
                                <X className="w-3.5 h-3.5 text-red-500 dark:text-red-400 group-hover/remove:text-red-600" />
                              </button>
                            )}

                            {/* Checkbox - Clickable */}
                            {!isCurrentMember && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMember(user._id);
                                }}
                                className="p-0.5 hover:opacity-80 transition-opacity"
                                title={isSelected ? 'Bỏ chọn' : 'Chọn'}
                              >
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                                  isSelected 
                                    ? 'bg-blue-500 dark:bg-blue-600 border-blue-500 dark:border-blue-600' 
                                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                                }`}>
                                  {isSelected && (
                                    <Check className="w-2.5 h-2.5 text-white" />
                                  )}
                                </div>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Footer - Clean */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100 dark:border-gray-800/50 bg-gradient-to-t from-gray-50/30 to-transparent dark:from-gray-900/20">
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 h-10 text-[13px] font-semibold border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading || selectedMembers.length === 0}
              className="flex-1 h-10 text-[13px] font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 text-white rounded-lg shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none"
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <div className="animate-spin w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full" />
                  Đang thêm...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4" />
                  Thêm {selectedMembers.length > 0 ? `(${selectedMembers.length})` : ''}
                </span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    
    {/* Confirm Remove Member Modal - OUTSIDE parent Dialog */}
    <ConfirmRemoveMemberModal
      isOpen={confirmModalOpen}
      onClose={handleCancelRemove}
      onConfirm={handleConfirmRemove}
      memberName={memberToRemove?.name || ''}
      loading={removingMember}
    />
    </>
  );
}
