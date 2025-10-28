'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import rocketChatService from '@/services/rocketchat.service';
import type { Room, CreateGroupRequest, RoomFilter } from '@/types/rocketchat';

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState<RoomFilter>({});
  
  const [formData, setFormData] = useState<CreateGroupRequest>({
    groupCode: '',
    name: '',
    isPrivate: true,
    readOnly: false,
  });

  const loadRooms = async () => {
    setLoading(true);
    try {
      const response = await rocketChatService.getRooms(filter, { page: 1, pageSize: 50 });
      if (response.success && response.data) {
        setRooms(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, [filter]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await rocketChatService.createGroup(formData);
      if (response.success) {
        alert('✅ Tạo phòng thành công!');
        setShowCreateForm(false);
        setFormData({
          groupCode: '',
          name: '',
          isPrivate: true,
          readOnly: false,
        });
        loadRooms();
      }
    } catch (error) {
      alert('❌ Lỗi: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Quản lý phòng chat"
        description="Tạo và quản lý các phòng chat / nhóm"
        action={
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
          >
            {showCreateForm ? '❌ Đóng' : '➕ Tạo phòng mới'}
          </button>
        }
      />

      {/* Create Form */}
      {showCreateForm && (
        <Card title="Tạo phòng mới" className="mb-6">
          <form onSubmit={handleCreateRoom} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mã nhóm *
              </label>
              <input
                type="text"
                required
                value={formData.groupCode}
                onChange={(e) => setFormData({ ...formData, groupCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="IT-PROJECT-2025"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tên phòng *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Phòng IT - Dự án 2025"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Department ID
              </label>
              <input
                type="number"
                value={formData.departmentId || ''}
                onChange={(e) =>
                  setFormData({ ...formData, departmentId: parseInt(e.target.value) || undefined })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Project ID
              </label>
              <input
                type="number"
                value={formData.projectId || ''}
                onChange={(e) =>
                  setFormData({ ...formData, projectId: parseInt(e.target.value) || undefined })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isPrivate}
                  onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">🔒 Riêng tư</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.readOnly}
                  onChange={(e) => setFormData({ ...formData, readOnly: e.target.checked })}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">📢 Chỉ đọc</span>
              </label>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg"
              >
                {loading ? 'Đang tạo...' : '✨ Tạo phòng'}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Filter */}
      <Card title="🔍 Tìm kiếm" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Tìm theo tên..."
            value={filter.search || ''}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          />
          <input
            type="number"
            placeholder="Department ID"
            value={filter.departmentId || ''}
            onChange={(e) =>
              setFilter({ ...filter, departmentId: parseInt(e.target.value) || undefined })
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          />
          <input
            type="number"
            placeholder="Project ID"
            value={filter.projectId || ''}
            onChange={(e) =>
              setFilter({ ...filter, projectId: parseInt(e.target.value) || undefined })
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={loadRooms}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
          >
            🔄 Tải lại
          </button>
        </div>
      </Card>

      {/* Rooms List */}
      <Card title={`📋 Danh sách phòng (${rooms.length})`}>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Đang tải...</div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Chưa có phòng nào</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <div
                key={room.roomId}
                className="border dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{room.name}</h3>
                  <span className="text-lg">
                    {room.isPrivate ? '🔒' : '🌐'}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    <span className="font-medium">Code:</span> {room.groupCode}
                  </p>
                  <p>
                    <span className="font-medium">Members:</span> {room.memberCount}
                  </p>
                  {room.readOnly && (
                    <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                      📢 Read-only
                    </span>
                  )}
                  {room.archived && (
                    <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                      📦 Archived
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

