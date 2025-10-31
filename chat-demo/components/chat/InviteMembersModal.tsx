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
import { Search, Users, UserPlus, X, Check, AlertCircle } from 'lucide-react';

interface InviteMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomName?: string;
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
  onSuccess,
}: InviteMembersModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

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
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
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
      const response = await rocketChatService.addMembers(roomId, selectedMembers);

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
      <DialogContent className="w-[95vw] max-w-[550px] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 p-4 sm:p-6 pb-3 sm:pb-4 border-b">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg sm:text-2xl font-bold flex items-center gap-2 mb-1">
                <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                <span className="truncate">Thêm thành viên</span>
              </DialogTitle>
              {roomName && (
                <DialogDescription className="text-xs sm:text-base">
                  Thêm người dùng vào <strong>{roomName}</strong>
                </DialogDescription>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4">
          {/* Messages */}
          {error && (
            <div className="mb-3 sm:mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-3 sm:mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm flex items-start gap-2">
              <Check className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <div className="space-y-3 sm:space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm theo tên hoặc username..."
                className="pl-9 sm:pl-10 h-10 sm:h-11 text-sm sm:text-base"
                autoFocus
              />
            </div>

            {/* Selected Members Count */}
            {selectedMembers.length > 0 && (
              <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium">
                    Đã chọn {selectedMembers.length} thành viên
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMembers([])}
                  className="h-auto py-1 px-2 text-[10px] sm:text-xs"
                >
                  Bỏ chọn tất cả
                </Button>
              </div>
            )}

            {/* User List */}
            <div className="border rounded-lg overflow-hidden">
              <ScrollArea className="h-[300px] sm:h-[360px]">
                {loadingUsers ? (
                  <div className="p-6 sm:p-8 text-center">
                    <div className="animate-spin inline-block w-5 h-5 sm:w-6 sm:h-6 border-2 border-current border-t-transparent rounded-full text-primary" />
                    <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-muted-foreground">Đang tải danh sách...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-6 sm:p-8 text-center">
                    <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground/50 mb-2 sm:mb-3" />
                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-1">
                      {searchTerm ? 'Không tìm thấy người dùng' : 'Không có người dùng'}
                    </p>
                    {searchTerm && (
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        Thử từ khóa tìm kiếm khác
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredUsers.map(user => {
                      const isSelected = selectedMembers.includes(user._id);
                      const displayName = user.name || user.username;
                      
                      return (
                        <button
                          key={user._id}
                          type="button"
                          onClick={() => toggleMember(user._id)}
                          className={`w-full flex items-center gap-2 sm:gap-3 p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                            isSelected ? 'bg-primary/5' : ''
                          }`}
                        >
                          {/* Avatar */}
                          <div className={`relative flex-shrink-0 w-9 h-9 sm:w-11 sm:h-11 rounded-full ${getAvatarColor(user.username)} flex items-center justify-center text-white font-semibold text-xs sm:text-sm shadow-sm`}>
                            {getInitials(displayName)}
                            {/* Online status indicator */}
                            {user.status === 'online' && (
                              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
                            )}
                          </div>
                          
                          {/* Info */}
                          <div className="flex-1 min-w-0 text-left">
                            <div className="text-xs sm:text-sm font-medium truncate">
                              {displayName}
                            </div>
                            <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                              @{user.username}
                              {user.status === 'online' && (
                                <span className="ml-1 sm:ml-2 text-green-600 dark:text-green-400">● Trực tuyến</span>
                              )}
                            </div>
                          </div>

                          {/* Checkbox */}
                          <Checkbox
                            checked={isSelected}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-shrink-0"
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Info text */}
            <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
              💡 Chọn người dùng bạn muốn thêm vào nhóm
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 sm:p-6 pt-3 sm:pt-4 border-t bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 text-xs sm:text-sm h-9 sm:h-10"
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading || selectedMembers.length === 0}
              className="flex-1 text-xs sm:text-sm h-9 sm:h-10"
            >
              {loading ? (
                <>
                  <div className="animate-spin w-3 h-3 sm:w-4 sm:h-4 border-2 border-current border-t-transparent rounded-full mr-1 sm:mr-2" />
                  Đang thêm...
                </>
              ) : (
                <>
                  <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Thêm {selectedMembers.length > 0 ? `(${selectedMembers.length})` : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
