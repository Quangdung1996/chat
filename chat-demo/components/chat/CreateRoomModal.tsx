'use client';

import { useState, useEffect } from 'react';
import rocketChatService from '@/services/rocketchat.service';
import type { CreateGroupRequest } from '@/types/rocketchat';
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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Users, Eye, X, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { getInitials, getAvatarColor } from '@/utils/avatarUtils';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface User {
  _id: string;
  username: string;
  name?: string;
  emails?: { address: string }[];
}

type Step = 'info' | 'members';

export default function CreateRoomModal({ isOpen, onClose, onSuccess }: CreateRoomModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  
  // Debug selectedMembers changes
  useEffect(() => {
    console.log('🔄 selectedMembers changed:', selectedMembers);
  }, [selectedMembers]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<CreateGroupRequest>({
    groupCode: '',
    name: '',
    isPrivate: true,
    topic: '',
    announcement: '',
    isReadOnly: false,
    members: [],
  });

  // Load users when modal opens
  useEffect(() => {
    if (isOpen && users.length === 0) {
      loadUsers();
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep('info');
      setFormData({
        groupCode: '',
        name: '',
        isPrivate: true,
        topic: '',
        announcement: '',
        isReadOnly: false,
        members: [],
      });
      setSelectedMembers([]);
      setSearchTerm('');
      setError(null);
    }
  }, [isOpen]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await rocketChatService.getUsers(100, 0);
      if (response.success && response.users) {
        console.log('📥 Loaded users:', response.users.map(u => ({ 
          username: u.username, 
          id: u._id,
          idType: typeof u._id 
        })));
        
        // Check for duplicate IDs
        const ids = response.users.map(u => u._id);
        const uniqueIds = new Set(ids);
        if (ids.length !== uniqueIds.size) {
          console.error('⚠️ DUPLICATE USER IDs DETECTED!', {
            total: ids.length,
            unique: uniqueIds.size
          });
        }
        
        setUsers(response.users);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
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

  const handleNext = () => {
    if (!formData.name && !formData.groupCode) {
      setError('Vui lòng nhập tên phòng');
      return;
    }
    setError(null);
    setCurrentStep('members');
  };

  const handleBack = () => {
    setCurrentStep('info');
    setError(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Convert userIds to usernames (RocketChat API requires usernames for groups.create)
      const memberUsernames = selectedMembers
        .map(userId => {
          const user = users.find(u => u._id === userId);
          return user?.username;
        })
        .filter((username): username is string => username !== undefined);

      console.log('🔄 Converting members:', {
        selectedMemberIds: selectedMembers,
        memberUsernames,
      });

      // Create room with selected members
      const requestData = {
        ...formData,
        members: memberUsernames,
      };

      const response = await rocketChatService.createGroup(requestData);

      if (response.success) {
        // Success
        onSuccess();
        onClose();
      } else {
        setError(response.message || 'Không thể tạo phòng');
      }
    } catch (err) {
      setError((err as Error).message);
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


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 p-4 sm:p-6 pb-3 sm:pb-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <DialogTitle className="text-lg sm:text-2xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              Tạo nhóm chat mới
            </DialogTitle>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
          
          {/* Steps indicator */}
          <div className="flex items-center gap-1 sm:gap-2 mt-3 sm:mt-4">
            <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
              currentStep === 'info' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground'
            }`}>
              <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                1
              </span>
              <span className="hidden sm:inline">Thông tin</span>
            </div>
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
              currentStep === 'members' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground'
            }`}>
              <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span className="hidden sm:inline">Thành viên</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4">
          {/* Error */}
          {error && (
            <div className="mb-3 sm:mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm flex items-start gap-2">
              <X className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Info */}
          {currentStep === 'info' && (
            <div className="space-y-4 sm:space-y-5">
              {/* Room Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs sm:text-sm font-semibold flex items-center gap-1">
                  Tên nhóm <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Nhóm dự án Website 2024"
                  className="h-10 sm:h-11 text-sm sm:text-base"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Tên hiển thị của nhóm chat
                </p>
              </div>

              {/* Topic */}
              <div className="space-y-2">
                <Label htmlFor="topic" className="text-sm font-semibold">
                  Chủ đề nhóm
                </Label>
                <Input
                  id="topic"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  placeholder="Ví dụ: Dự án Website 2024 - Sprint 1"
                  className="h-10 sm:h-11 text-sm sm:text-base"
                />
                <p className="text-xs text-muted-foreground">
                  Chủ đề hoặc mục đích của nhóm
                </p>
              </div>

              {/* Announcement */}
              <div className="space-y-2">
                <Label htmlFor="announcement" className="text-sm font-semibold">
                  Thông báo
                </Label>
                <textarea
                  id="announcement"
                  value={formData.announcement}
                  onChange={(e) => setFormData({ ...formData, announcement: e.target.value })}
                  placeholder="Thông báo quan trọng cho thành viên..."
                  rows={3}
                  className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Thông báo sẽ hiển thị nổi bật trong nhóm
                </p>
              </div>


              {/* Additional Options */}
              <div className="space-y-3 pt-2">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setFormData({ ...formData, isReadOnly: !formData.isReadOnly })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setFormData({ ...formData, isReadOnly: !formData.isReadOnly });
                    }
                  }}
                  className={`w-full p-3 sm:p-4 rounded-xl border-2 transition-all text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    formData.isReadOnly
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${
                        formData.isReadOnly ? 'bg-primary text-primary-foreground' : 'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs sm:text-sm">Chế độ chỉ đọc</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground">Chỉ quản trị viên được gửi tin nhắn</div>
                      </div>
                    </div>
                    <Checkbox
                      checked={formData.isReadOnly}
                      className="flex-shrink-0 pointer-events-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Members */}
          {currentStep === 'members' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Thêm thành viên</h3>
                <p className="text-sm text-muted-foreground">
                  Chọn người dùng để mời vào nhóm (có thể bỏ qua và thêm sau)
                </p>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm theo tên hoặc username..."
                  className="pl-10 h-11"
                />
              </div>

              {/* Selected Members Count */}
              {selectedMembers.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg">
                  <Check className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">
                    Đã chọn {selectedMembers.length} thành viên
                  </span>
                </div>
              )}

              {/* User List */}
              <div className="border rounded-lg overflow-hidden">
                <ScrollArea className="h-[320px]">
                  {loadingUsers ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full text-primary" />
                      <p className="mt-3 text-sm text-muted-foreground">Đang tải danh sách...</p>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="p-8 text-center">
                      <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-sm text-muted-foreground">
                        {searchTerm ? 'Không tìm thấy người dùng' : 'Không có người dùng'}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredUsers.map((user, idx) => {
                        const isSelected = selectedMembers.includes(user._id);
                        const displayName = user.name || user.username;
                        
                        if (idx < 3) { // Log first 3 users only
                          console.log(`👤 User #${idx}:`, {
                            username: user.username,
                            userId: user._id,
                            userIdType: typeof user._id,
                            isSelected,
                            selectedMembers: [...selectedMembers],
                            includesCheck: selectedMembers.includes(user._id)
                          });
                        }
                        
                        return (
                          <div
                            key={user._id}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              console.log(`🖱️ Clicked user: ${user.username} (${user._id})`);
                              toggleMember(user._id);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                toggleMember(user._id);
                              }
                            }}
                            className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                              isSelected ? 'bg-primary/5' : ''
                            }`}
                          >
                            {/* Avatar */}
                            <div className={`relative flex-shrink-0 w-11 h-11 rounded-full ${getAvatarColor(user.username)} flex items-center justify-center text-white font-semibold text-sm shadow-sm`}>
                              {getInitials(displayName)}
                            </div>
                            
                            {/* Info */}
                            <div className="flex-1 min-w-0 text-left">
                              <div className="text-sm font-medium truncate">
                                {displayName}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                @{user.username}
                              </div>
                            </div>

                            {/* Checkbox */}
                            <Checkbox
                              checked={isSelected}
                              className="pointer-events-none"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 sm:p-6 pt-3 sm:pt-4 border-t bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            {currentStep === 'info' ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 text-xs sm:text-sm h-9 sm:h-10"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 text-xs sm:text-sm h-9 sm:h-10"
                >
                  Tiếp theo
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 text-xs sm:text-sm h-9 sm:h-10"
                >
                  <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Quay lại
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 text-xs sm:text-sm h-9 sm:h-10"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin w-3 h-3 sm:w-4 sm:h-4 border-2 border-current border-t-transparent rounded-full mr-1 sm:mr-2" />
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Tạo nhóm
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
