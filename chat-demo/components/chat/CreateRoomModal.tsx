'use client';

import { useState } from 'react';
import rocketChatService from '@/services/rocketchat.service';
import type { CreateGroupRequest } from '@/types/rocketchat';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateRoomModal({ isOpen, onClose, onSuccess }: CreateRoomModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateGroupRequest>({
    groupCode: '',
    name: '',
    isPrivate: true,
    description: '',
    isReadOnly: false,
  });

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

      // Create room with current data
      // Backend will auto-generate groupCode from name if needed
      const response = await rocketChatService.createGroup(formData);

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
        });
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

            {/* Optional Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ID Phòng ban
                </label>
                <input
                  type="number"
                  value={formData.departmentId || ''}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="Tùy chọn"
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ID Dự án
                </label>
                <input
                  type="number"
                  value={formData.projectId || ''}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="Tùy chọn"
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
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

