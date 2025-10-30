'use client';

import { useState, useEffect } from 'react';
import rocketChatService from '@/services/rocketchat.service';
import type { CreateGroupRequest } from '@/types/rocketchat';

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

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                🏠 Tạo phòng mới
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Error */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Room Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tên phòng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ví dụ: Phòng dự án website"
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Tên hiển thị của phòng chat
              </p>
            </div>

            {/* Group Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mã nhóm (tùy chọn)
              </label>
              <input
                type="text"
                value={formData.groupCode}
                onChange={(e) => setFormData({ ...formData, groupCode: e.target.value })}
                placeholder="Ví dụ: DEPT-PROJ-001"
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Để trống sẽ tự động sinh mã duy nhất
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mô tả
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Phòng này dùng để làm gì?"
                rows={3}
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
              />
            </div>

            {/* Room Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Loại phòng
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={formData.isPrivate}
                    onChange={() => setFormData({ ...formData, isPrivate: true })}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    🔒 Nhóm riêng tư (chỉ mời)
                  </span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!formData.isPrivate}
                    onChange={() => setFormData({ ...formData, isPrivate: false })}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    📢 Kênh công khai (ai cũng tham gia được)
                  </span>
                </label>
              </div>
            </div>

            {/* Additional Options */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isReadOnly}
                  onChange={(e) => setFormData({ ...formData, isReadOnly: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  📢 Chỉ đọc (chỉ quản trị viên được đăng)
                </span>
              </label>
            </div>

            {/* Member Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                👥 Thêm thành viên (tùy chọn)
              </label>
              
              {/* Search */}
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔍 Tìm kiếm thành viên..."
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white mb-2"
              />

              {/* Selected Members Count */}
              {selectedMembers.length > 0 && (
                <div className="mb-2 text-sm text-blue-600 dark:text-blue-400">
                  ✓ Đã chọn {selectedMembers.length} thành viên
                </div>
              )}

              {/* User List */}
              <div className="border dark:border-gray-600 rounded-lg max-h-48 overflow-y-auto">
                {loadingUsers ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    Đang tải danh sách...
                  </div>
                ) : users.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    Không có người dùng
                  </div>
                ) : (
                  <div className="divide-y dark:divide-gray-700">
                    {users
                      .filter(user => {
                        if (!searchTerm) return true;
                        const search = searchTerm.toLowerCase();
                        return (
                          user.username?.toLowerCase().includes(search) ||
                          user.name?.toLowerCase().includes(search)
                        );
                      })
                      .map(user => (
                        <label
                          key={user._id}
                          className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(user._id)}
                            onChange={() => toggleMember(user._id)}
                            className="rounded text-blue-600"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {user.name || user.username}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              @{user.username}
                            </div>
                          </div>
                        </label>
                      ))}
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Có thể bỏ qua và thêm thành viên sau
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Đang tạo...' : 'Tạo phòng'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

