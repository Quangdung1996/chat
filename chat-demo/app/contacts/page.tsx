'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import TeamsSidebar from '@/components/TeamsSidebar';
import rocketChatService from '@/services/rocketchat.service';
import { Search, MessageSquare, Loader2 } from 'lucide-react';

interface User {
  _id: string;
  username: string;
  name: string;
  status?: string;
  emails?: { address: string }[];
}

export default function ContactsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await rocketChatService.getUsers(100, 0);
      if (response.success && response.users) {
        setUsers(response.users);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const getAvatarColor = (username: string) => {
    const colors = [
      'bg-gradient-to-br from-blue-400 to-blue-600',
      'bg-gradient-to-br from-purple-400 to-purple-600',
      'bg-gradient-to-br from-pink-400 to-pink-600',
      'bg-gradient-to-br from-green-400 to-green-600',
      'bg-gradient-to-br from-yellow-400 to-yellow-600',
      'bg-gradient-to-br from-red-400 to-red-600',
      'bg-gradient-to-br from-indigo-400 to-indigo-600',
      'bg-gradient-to-br from-teal-400 to-teal-600',
    ];
    const index = username.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
        <TeamsSidebar />
        
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
          {/* Header */}
          <div className="border-b dark:border-gray-700 p-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Danh bạ</h1>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm người dùng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full max-w-md pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-gray-500"
              />
            </div>
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Đang tải danh bạ...</p>
                </div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4">🔍</div>
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchQuery ? 'Không tìm thấy người dùng' : 'Danh bạ trống'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    className="bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700 hover:shadow-lg transition-shadow"
                  >
                    {/* Avatar */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative">
                        <div
                          className={`w-12 h-12 rounded-full ${getAvatarColor(
                            user.username
                          )} flex items-center justify-center text-white font-semibold text-sm shadow-sm`}
                        >
                          {getInitials(user.name || user.username)}
                        </div>
                        {user.status === 'online' && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {user.name || user.username}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          @{user.username}
                        </p>
                      </div>
                    </div>

                    {/* Email */}
                    {user.emails && user.emails.length > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 truncate">
                        📧 {user.emails[0].address}
                      </p>
                    )}

                    {/* Actions */}
                    <button
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm font-medium"
                      title="Gửi tin nhắn"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Nhắn tin</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

