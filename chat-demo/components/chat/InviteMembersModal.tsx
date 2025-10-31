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

            {/* User List - Refined Design */}
            <div className="border border-gray-200/50 dark:border-gray-700/50 rounded-xl overflow-hidden bg-white/50 dark:bg-gray-900/20">
              <ScrollArea className="h-[340px]">
                {loadingUsers ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin inline-block w-8 h-8 border-3 border-[#007aff] dark:border-[#0a84ff] border-t-transparent rounded-full" />
                    <p className="mt-4 text-[14px] font-medium text-gray-600 dark:text-gray-400">Đang tải danh sách...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Users className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">
                      {searchTerm ? 'Không tìm thấy người dùng' : 'Không có người dùng'}
                    </p>
                    {searchTerm && (
                      <p className="text-[13px] text-gray-500 dark:text-gray-400">
                        Thử từ khóa tìm kiếm khác
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
                    {filteredUsers.map(user => {
                      const isSelected = selectedMembers.includes(user._id);
                      const displayName = user.name || user.username;
                      const isCurrentMember = currentMembers.some(m => m._id === user._id);
                      const isSelf = user._id === currentUserId;
                      
                      return (
                        <div
                          key={user._id}
                          className={`relative flex items-center gap-3 px-4 py-3.5 transition-all duration-200 group ${
                            isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-gray-50/80 dark:hover:bg-gray-800/30'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => !isCurrentMember && toggleMember(user._id)}
                            disabled={isCurrentMember}
                            className="flex-1 flex items-center gap-3 text-left"
                          >
                            {/* Avatar with enhanced shadow */}
                            <div className="relative flex-shrink-0">
                              <div className={`w-10 h-10 rounded-full ${getAvatarColor(user.username)} flex items-center justify-center text-white font-semibold text-[13px] shadow-md group-hover:shadow-lg transition-shadow duration-200`}>
                                {getInitials(displayName)}
                              </div>
                              {/* Online status indicator - enhanced */}
                              {user.status === 'online' && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-[2.5px] border-white dark:border-[#1c1c1e] rounded-full shadow-sm" />
                              )}
                            </div>
                            
                            {/* Info - Better typography */}
                            <div className="flex-1 min-w-0">
                              <div className="text-[15px] font-semibold text-gray-900 dark:text-white truncate leading-tight mb-0.5 flex items-center gap-2">
                                {displayName}
                                {isCurrentMember && (
                                  <span className="text-[11px] font-semibold px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                                    Đã tham gia
                                  </span>
                                )}
                                {isSelf && (
                                  <span className="text-[11px] font-semibold px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                                    Bạn
                                  </span>
                                )}
                              </div>
                              <div className="text-[13px] text-gray-500 dark:text-gray-400 truncate flex items-center gap-2">
                                <span>@{user.username}</span>
                                {user.status === 'online' && (
                                  <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                    Online
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>

                          {/* Action buttons area */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Remove button - show for all existing members except self. API will handle permissions */}
                            {isCurrentMember && !isSelf && (
                              <button
                                type="button"
                                onClick={(e) => handleRemoveMember(user._id, displayName, e)}
                                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors group/remove"
                                title="Xóa khỏi nhóm"
                              >
                                <UserMinus className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover/remove:text-red-600 dark:group-hover/remove:text-red-400 transition-colors" />
                              </button>
                            )}

                            {/* Checkbox - only show for non-members */}
                            {!isCurrentMember && (
                              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                                isSelected 
                                  ? 'bg-[#007aff] dark:bg-[#0a84ff] border-[#007aff] dark:border-[#0a84ff] scale-110' 
                                  : 'border-gray-300 dark:border-gray-600 group-hover:border-gray-400 dark:group-hover:border-gray-500'
                              }`}>
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 text-white animate-in zoom-in-50 duration-200" />
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

            {/* Info text - Subtle hint */}
            <div className="flex items-center justify-center gap-2 text-[13px] text-gray-500 dark:text-gray-400">
              <div className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500" />
              <span>Chọn người dùng bạn muốn thêm vào nhóm</span>
            </div>
          </div>
        </div>

        {/* Footer - Apple Style with gradient */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-b from-transparent to-gray-50/30 dark:to-gray-900/30">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 h-11 text-[15px] font-semibold border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl transition-all duration-200"
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading || selectedMembers.length === 0}
              className="flex-1 h-11 text-[15px] font-semibold bg-[#007aff] hover:bg-[#0051d5] dark:bg-[#0a84ff] dark:hover:bg-[#0066cc] text-white rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25 disabled:shadow-none disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                  Đang thêm...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
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
