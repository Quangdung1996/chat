'use client';

import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import rocketChatService from '@/services/rocketchat.service';
import type { AddMembersRequest, RoomMember, UpdateMemberRoleRequest } from '@/types/rocketchat';

export default function MembersPage() {
  const [roomId, setRoomId] = useState('');
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [userIds, setUserIds] = useState('');

  const loadMembers = async () => {
    if (!roomId) return;
    setLoading(true);
    try {
      const response = await rocketChatService.getRoomMembers(roomId);
      if (response.success && response.data) {
        setMembers(response.data);
      }
    } catch (error) {
      alert('❌ Lỗi: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMembers = async () => {
    if (!roomId || !userIds) return;
    setLoading(true);
    try {
      const ids = userIds.split(',').map((id) => parseInt(id.trim()));
      const request: AddMembersRequest = { roomId, userIds: ids };
      const response = await rocketChatService.addMembers(request);
      if (response.success) {
        alert(`✅ Đã thêm ${response.data?.added || 0} thành viên`);
        setUserIds('');
        loadMembers();
      }
    } catch (error) {
      alert('❌ Lỗi: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!confirm('Xác nhận xóa thành viên này?')) return;
    setLoading(true);
    try {
      const response = await rocketChatService.removeMember(roomId, userId);
      if (response.success) {
        alert('✅ Đã xóa thành viên');
        loadMembers();
      }
    } catch (error) {
      alert('❌ Lỗi: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: number, newRole: 'owner' | 'moderator' | 'member') => {
    setLoading(true);
    try {
      const request: UpdateMemberRoleRequest = { roomId, userId, role: newRole };
      const response = await rocketChatService.updateMemberRole(request);
      if (response.success) {
        alert('✅ Đã cập nhật vai trò');
        loadMembers();
      }
    } catch (error) {
      alert('❌ Lỗi: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleReconcile = async () => {
    if (!roomId) return;
    setLoading(true);
    try {
      const response = await rocketChatService.reconcileMembers(roomId);
      if (response.success) {
        alert('✅ Đối soát thành công');
        loadMembers();
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
        title="Quản lý thành viên"
        description="Thêm, xóa và phân quyền thành viên trong phòng chat"
      />

      {/* Select Room */}
      <Card title="Chọn phòng" className="mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Nhập Room ID..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={loadMembers}
            disabled={!roomId || loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg"
          >
            📋 Tải danh sách
          </button>
          <button
            onClick={handleReconcile}
            disabled={!roomId || loading}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg"
          >
            🔄 Đối soát
          </button>
        </div>
      </Card>

      {/* Add Members */}
      {roomId && (
        <Card title="Thêm thành viên" className="mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={userIds}
              onChange={(e) => setUserIds(e.target.value)}
              placeholder="User IDs (phân cách bởi dấu phẩy, vd: 1,2,3)"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={handleAddMembers}
              disabled={!userIds || loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg"
            >
              ➕ Thêm
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            💡 Hệ thống sẽ tự động delay giữa các requests để tránh rate limit
          </p>
        </Card>
      )}

      {/* Members List */}
      {roomId && (
        <Card title={`👥 Danh sách thành viên (${members.length})`}>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Đang tải...</div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Chưa có thành viên</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">User ID</th>
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Tên</th>
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Username</th>
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Vai trò</th>
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Ngày tham gia</th>
                    <th className="text-center py-3 px-4 text-gray-700 dark:text-gray-300">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.userId} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="py-3 px-4 text-gray-900 dark:text-white">{member.userId}</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white">{member.fullName}</td>
                      <td className="py-3 px-4">
                        <span className="text-blue-600 dark:text-blue-400 font-mono text-sm">
                          @{member.username}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleUpdateRole(member.userId, e.target.value as any)
                          }
                          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm"
                        >
                          <option value="member">👤 Member</option>
                          <option value="moderator">⭐ Moderator</option>
                          <option value="owner">👑 Owner</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
                        {new Date(member.joinedAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleRemoveMember(member.userId)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 font-semibold text-sm"
                        >
                          🗑️ Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

