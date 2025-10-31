'use client';

import { useState, useEffect } from 'react';
import rocketChatService from '@/services/rocketchat.service';
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
import type { RoomMember } from '@/types/rocketchat';

interface InviteMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomName?: string;
  roomType?: string; // 'group' | 'channel' | 'direct'
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
    console.log('🔄 InviteModal toggleMember called with userId:', userId);
    setSelectedMembers(prev => {
      console.log('📋 InviteModal Current selectedMembers:', prev);
      const newState = prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId];
      console.log('✅ InviteModal New selectedMembers:', newState);
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
        setSuccess(`Đã thêm ${response.successCount} thành viên thành công!`);
        setTimeout(() => {
        onSuccess();
        onClose();
        }, 1500);
      } else {
        setError('Không thể thêm thành viên');
      }
    } catch (err) {
      setError((err as Error).message || 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string, event: React.MouseEvent) => {
    // Stop event propagation to prevent toggleMember from firing
    event.stopPropagation();
    
    if (!confirm(`Bạn có chắc muốn xóa ${memberName} khỏi nhóm?`)) {
      return;
    }

    try {
      const response = await rocketChatService.removeMember(roomId, memberId, roomType);
      
      if (response.success) {
        setSuccess(`Đã xóa ${memberName} khỏi nhóm!`);
        setTimeout(() => {
          onSuccess(); // Refresh member list
        }, 1000);
      } else {
        setError('Không thể xóa thành viên');
      }
    } catch (err: any) {
      console.error('Failed to remove member:', err);
      // Display specific error message from API or fallback
      const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi xóa thành viên';
      setError(errorMessage);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      user.username?.toLowerCase().includes(search) ||
      user.name?.toLowerCase().includes(search)
    );
  });

  // Get avatar initials
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  // Get avatar color
  const getAvatarColor = (username: string) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
      'from-green-500 to-green-600',
      'from-yellow-500 to-yellow-600',
      'from-red-500 to-red-600',
      'from-indigo-500 to-indigo-600',
      'from-teal-500 to-teal-600',
    ];
    const index = username.charCodeAt(0) % colors.length;
    return `bg-gradient-to-br ${colors[index]}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-[460px] max-h-[80vh] p-0 gap-0 overflow-hidden flex flex-col bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-gray-800 shadow-2xl rounded-2xl">
        {/* Header - Compact & Clean */}
        <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-[17px] font-bold text-gray-900 dark:text-white leading-tight">
                  Quản lý thành viên
                </DialogTitle>
                {roomName && (
                  <DialogDescription className="text-[13px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5">
                    {roomName}
                  </DialogDescription>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
              aria-label="Đóng"
            >
              <X className="w-4.5 h-4.5 text-gray-400 dark:text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {/* Messages - Compact Style */}
          {error && (
            <div className="mb-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg text-[13px] flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 text-green-600 dark:text-green-400 px-3 py-2 rounded-lg text-[13px] flex items-center gap-2 animate-in fade-in duration-200">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="space-y-3">
            {/* Search - Compact */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm..."
                className="pl-9 h-9 text-[14px] bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-600 rounded-lg"
                autoFocus
              />
            </div>

            {/* Selected Members Count - Compact Badge */}
            {selectedMembers.length > 0 && (
              <div className="flex items-center justify-between px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 rounded-lg">
                <span className="text-[13px] font-medium text-blue-700 dark:text-blue-400">
                  Đã chọn {selectedMembers.length} người
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedMembers([])}
                  className="text-[12px] text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                >
                  Bỏ chọn
                </button>
              </div>
            )}

            {/* User List - Compact & Clean Design */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-gray-50/50 dark:bg-gray-900/50">
              <ScrollArea className="h-[320px]">
                {loadingUsers ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
                    <p className="mt-3 text-[13px] text-gray-500 dark:text-gray-400">Đang tải...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Users className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-[14px] font-medium text-gray-700 dark:text-gray-300">
                      {searchTerm ? 'Không tìm thấy' : 'Không có người dùng'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredUsers.map(user => {
                      const isSelected = selectedMembers.includes(user._id);
                      const displayName = user.name || user.username;
                      const isCurrentMember = currentMembers.some(m => m._id === user._id);
                      const isSelf = user._id === currentUserId;
                      
                      return (
                        <div
                          key={user._id}
                          className={`relative flex items-center gap-2.5 px-3 py-2.5 transition-colors group ${
                            isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-white dark:hover:bg-gray-800'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => !isCurrentMember && toggleMember(user._id)}
                            disabled={isCurrentMember}
                            className="flex-1 flex items-center gap-2.5 text-left min-w-0"
                          >
                            {/* Avatar - Compact */}
                            <div className="relative flex-shrink-0">
                              <div className={`w-8 h-8 rounded-full ${getAvatarColor(user.username)} flex items-center justify-center text-white font-semibold text-[11px] shadow-sm`}>
                                {getInitials(displayName)}
                              </div>
                              {user.status === 'online' && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
                              )}
                            </div>
                            
                            {/* Info - Compact */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[14px] font-semibold text-gray-900 dark:text-white truncate">
                                  {displayName}
                                </span>
                                {isCurrentMember && (
                                  <span className="text-[10px] font-medium px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                                    Thành viên
                                  </span>
                                )}
                                {isSelf && (
                                  <span className="text-[10px] font-medium px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                                    Bạn
                                  </span>
                                )}
                              </div>
                              <div className="text-[12px] text-gray-500 dark:text-gray-400 truncate">
                                @{user.username}
                              </div>
                            </div>
                          </button>

                          {/* Action buttons - Compact */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {/* Remove button - RED & Prominent */}
                            {isCurrentMember && !isSelf && (
                              <button
                                type="button"
                                onClick={(e) => handleRemoveMember(user._id, displayName, e)}
                                className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-all duration-200 group/remove"
                                title="Xóa khỏi nhóm"
                              >
                                <X className="w-4 h-4 text-red-500 dark:text-red-400 group-hover/remove:text-red-600 dark:group-hover/remove:text-red-300 transition-colors" />
                              </button>
                            )}

                            {/* Checkbox - only show for non-members */}
                            {!isCurrentMember && (
                              <div className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition-all ${
                                isSelected 
                                  ? 'bg-blue-500 dark:bg-blue-600 border-blue-500 dark:border-blue-600' 
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}>
                                {isSelected && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </div>
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

        {/* Footer - Compact */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1c1c1e]">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 h-9 text-[14px] font-medium border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading || selectedMembers.length === 0}
              className="flex-1 h-9 text-[14px] font-medium bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <div className="animate-spin w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full" />
                  Đang thêm...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" />
                  Thêm {selectedMembers.length > 0 ? `(${selectedMembers.length})` : ''}
                </span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
