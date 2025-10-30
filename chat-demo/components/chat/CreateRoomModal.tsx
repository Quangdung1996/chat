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

export default function CreateRoomModal({ isOpen, onClose, onSuccess }: CreateRoomModalProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate - at least one of name or groupCode is required
      if (!formData.name && !formData.groupCode) {
        setError('Vui lòng nhập ít nhất tên phòng hoặc mã nhóm');
        setLoading(false);
        return;
      }

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
        
        // Reset form
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
      } else {
        setError(response.message || 'Failed to create room');
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🏠 Tạo phòng mới</DialogTitle>
          <DialogDescription>
            Tạo một phòng chat mới và mời thành viên tham gia
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error */}
          {error && (
            <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Room Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Tên phòng <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ví dụ: Phòng dự án website"
            />
            <p className="text-xs text-muted-foreground">
              Tên hiển thị của phòng chat
            </p>
          </div>

          {/* Group Code */}
          <div className="space-y-2">
            <Label htmlFor="groupCode">Mã nhóm (tùy chọn)</Label>
            <Input
              id="groupCode"
              value={formData.groupCode}
              onChange={(e) => setFormData({ ...formData, groupCode: e.target.value })}
              placeholder="Ví dụ: DEPT-PROJ-001"
            />
            <p className="text-xs text-muted-foreground">
              Để trống sẽ tự động sinh mã duy nhất
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Phòng này dùng để làm gì?"
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          {/* Room Type */}
          <div className="space-y-3">
            <Label>Loại phòng</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="private"
                  checked={formData.isPrivate}
                  onCheckedChange={() => setFormData({ ...formData, isPrivate: true })}
                />
                <Label 
                  htmlFor="private"
                  className="text-sm font-normal cursor-pointer"
                >
                  🔒 Nhóm riêng tư (chỉ mời)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="public"
                  checked={!formData.isPrivate}
                  onCheckedChange={() => setFormData({ ...formData, isPrivate: false })}
                />
                <Label 
                  htmlFor="public"
                  className="text-sm font-normal cursor-pointer"
                >
                  📢 Kênh công khai (ai cũng tham gia được)
                </Label>
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="readOnly"
              checked={formData.isReadOnly}
              onCheckedChange={(checked) => setFormData({ ...formData, isReadOnly: checked as boolean })}
            />
            <Label 
              htmlFor="readOnly"
              className="text-sm font-normal cursor-pointer"
            >
              📢 Chỉ đọc (chỉ quản trị viên được đăng)
            </Label>
          </div>

          {/* Member Selection */}
          <div className="space-y-2">
            <Label>👥 Thêm thành viên (tùy chọn)</Label>
            
            {/* Search */}
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Tìm kiếm thành viên..."
            />

            {/* Selected Members Count */}
            {selectedMembers.length > 0 && (
              <div className="text-sm text-primary">
                ✓ Đã chọn {selectedMembers.length} thành viên
              </div>
            )}

            {/* User List */}
            <div className="border rounded-md">
              <ScrollArea className="h-48">
                {loadingUsers ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    Đang tải danh sách...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    {searchTerm ? 'Không tìm thấy người dùng' : 'Không có người dùng'}
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredUsers.map(user => (
                      <div
                        key={user._id}
                        className="flex items-center space-x-3 p-3 hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => toggleMember(user._id)}
                      >
                        <Checkbox
                          checked={selectedMembers.includes(user._id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {user.name || user.username}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            @{user.username}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
            <p className="text-xs text-muted-foreground">
              Có thể bỏ qua và thêm thành viên sau
            </p>
          </div>

          {/* Actions */}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Đang tạo...' : 'Tạo phòng'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
