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
import { Search, Users, Lock, Globe, Eye, X, Check, ArrowRight, ArrowLeft } from 'lucide-react';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<CreateGroupRequest>({
    groupCode: '',
    name: '',
    isPrivate: true,
    description: '',
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
        description: '',
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
      // Create room with selected members
      const requestData = {
        ...formData,
        members: selectedMembers,
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
    ];
    const index = username.charCodeAt(0) % colors.length;
    return `bg-gradient-to-br ${colors[index]}`;
  };

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

              {/* Group Code */}
              <div className="space-y-2">
                <Label htmlFor="groupCode" className="text-xs sm:text-sm font-semibold">
                  Mã nhóm (tùy chọn)
                </Label>
                <Input
                  id="groupCode"
                  value={formData.groupCode}
                  onChange={(e) => setFormData({ ...formData, groupCode: e.target.value })}
                  placeholder="Ví dụ: PROJ-WEB-2024"
                  className="h-10 sm:h-11 text-sm sm:text-base font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Để trống, hệ thống sẽ tự động tạo mã duy nhất
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold">
                  Mô tả nhóm
                </Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Nhóm này dùng để thảo luận về..."
                  rows={3}
                  className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              </div>

              {/* Room Type */}
              <div className="space-y-3">
                <Label className="text-xs sm:text-sm font-semibold">Loại nhóm</Label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isPrivate: true })}
                    className={`p-3 sm:p-4 rounded-xl border-2 transition-all text-left ${
                      formData.isPrivate
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className={`p-1.5 sm:p-2 rounded-lg ${
                        formData.isPrivate ? 'bg-primary text-primary-foreground' : 'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-xs sm:text-sm mb-0.5 sm:mb-1">Riêng tư</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground">Chỉ thành viên được mời</div>
                      </div>
                      {formData.isPrivate && (
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isPrivate: false })}
                    className={`p-3 sm:p-4 rounded-xl border-2 transition-all text-left ${
                      !formData.isPrivate
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className={`p-1.5 sm:p-2 rounded-lg ${
                        !formData.isPrivate ? 'bg-primary text-primary-foreground' : 'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-xs sm:text-sm mb-0.5 sm:mb-1">Công khai</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground">Mọi người có thể tham gia</div>
                      </div>
                      {!formData.isPrivate && (
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* Additional Options */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isReadOnly: !formData.isReadOnly })}
                  className={`w-full p-3 sm:p-4 rounded-xl border-2 transition-all text-left ${
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
                      onClick={(e) => e.stopPropagation()}
                      className="flex-shrink-0"
                    />
                  </div>
                </button>
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
                      {filteredUsers.map(user => {
                        const isSelected = selectedMembers.includes(user._id);
                        const displayName = user.name || user.username;
                        
                        return (
                          <button
                            key={user._id}
                            type="button"
                            onClick={() => toggleMember(user._id)}
                            className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
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
                              onClick={(e) => e.stopPropagation()}
                            />
                          </button>
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
