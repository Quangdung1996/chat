'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import TeamsSidebar from '@/components/TeamsSidebar';
import rocketChatService from '@/services/rocketchat.service';
import { useAuthStore } from '@/store/authStore';
import { Search, MessageSquare, Loader2, Mail } from 'lucide-react';

interface User {
  _id: string;
  username: string;
  name: string;
  status?: string;
  emails?: { address: string }[];
}

export default function ContactsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [creatingDM, setCreatingDM] = useState<string | null>(null);

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

  const handleStartChat = async (contactUser: User) => {
    setCreatingDM(contactUser._id);
    try {
      // Lấy current user ID từ authStore
      if (!user?.id) {
        console.error('No user found in authStore');
        return;
      }
      
      const currentUserId = user.id;
      
      // Tạo DM room
      const response = await rocketChatService.createDirectMessage(
        currentUserId,
        contactUser.username
      );
      
      console.log('🔍 [DEBUG] createDirectMessage response:', response);
      
      if (response.success && response.roomId) {
        console.log('✅ [DEBUG] Redirecting with roomId:', response.roomId);
        
        // Set flag để force reload rooms khi về trang home
        sessionStorage.setItem('forceReloadRooms', 'true');
        sessionStorage.setItem('targetRoomId', response.roomId);
        
        // Delay nhỏ để đảm bảo backend đã sync xong
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Redirect về trang chat với roomId để tự động mở room
        router.push(`/?roomId=${response.roomId}`);
      } else {
        console.warn('⚠️ [DEBUG] No roomId in response or not success');
      }
    } catch (error) {
      console.error('Failed to create DM:', error);
    } finally {
      setCreatingDM(null);
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
      'from-[#007aff] to-[#0051d5]',
      'from-[#5856d6] to-[#3634a3]',
      'from-[#ff2d55] to-[#c7254e]',
      'from-[#34c759] to-[#248a3d]',
      'from-[#ff9500] to-[#c93400]',
      'from-[#ff3b30] to-[#c62828]',
      'from-[#af52de] to-[#8e24aa]',
      'from-[#5ac8fa] to-[#0091ea]',
    ];
    const index = username.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-[#f5f5f7] dark:bg-black">
        <TeamsSidebar />
        
        <div className="flex-1 flex flex-col bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-xl">
          {/* Header - Apple Style */}
          <div className="border-b border-gray-200/50 dark:border-gray-700/50 px-8 pt-8 pb-6">
            <h1 className="text-[34px] font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
              Danh bạ
            </h1>
            
            {/* Search - iOS Style */}
            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-[10px] bg-gray-100/80 dark:bg-[#2c2c2e]/80 backdrop-blur-xl border-0 rounded-[10px] text-[17px] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007aff]/50 dark:focus:ring-[#0a84ff]/50 transition-all"
              />
            </div>
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto px-8 py-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-[#007aff] dark:text-[#0a84ff] mx-auto mb-4" strokeWidth={2} />
                  <p className="text-[17px] text-gray-500 dark:text-gray-400">Đang tải danh bạ...</p>
                </div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-[#2c2c2e] flex items-center justify-center">
                    <Search className="w-12 h-12 text-gray-400" strokeWidth={2} />
                  </div>
                  <h3 className="text-[22px] font-semibold text-gray-900 dark:text-white mb-2">
                    {searchQuery ? 'Không tìm thấy' : 'Danh bạ trống'}
                  </h3>
                  <p className="text-[17px] text-gray-500 dark:text-gray-400">
                    {searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Chưa có người dùng nào'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    className="group bg-white/60 dark:bg-[#2c2c2e]/60 backdrop-blur-xl rounded-[20px] p-5 border border-gray-200/50 dark:border-gray-700/30 hover:shadow-xl hover:scale-[1.02] hover:bg-white dark:hover:bg-[#2c2c2e] transition-all duration-200"
                  >
                    {/* Avatar & Info */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="relative flex-shrink-0">
                        <div
                          className={`w-16 h-16 rounded-full bg-gradient-to-br ${getAvatarColor(
                            user.username
                          )} flex items-center justify-center text-white font-semibold text-[20px] shadow-lg`}
                        >
                          {getInitials(user.name || user.username)}
                        </div>
                        {user.status === 'online' && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#34c759] border-[3px] border-white dark:border-[#2c2c2e] rounded-full shadow-sm" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <h3 className="text-[17px] font-semibold text-gray-900 dark:text-white truncate mb-1">
                          {user.name || user.username}
                        </h3>
                        <p className="text-[15px] text-gray-500 dark:text-gray-400 truncate">
                          @{user.username}
                        </p>
                      </div>
                    </div>

                    {/* Email */}
                    {user.emails && user.emails.length > 0 && (
                      <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-gray-50 dark:bg-[#1c1c1e]/50 rounded-[10px]">
                        <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <p className="text-[13px] text-gray-600 dark:text-gray-400 truncate">
                          {user.emails[0].address}
                        </p>
                      </div>
                    )}

                    {/* Action Button */}
                    <button
                      onClick={() => handleStartChat(user)}
                      disabled={creatingDM === user._id}
                      className="w-full flex items-center justify-center gap-2 px-4 py-[11px] bg-[#007aff] hover:bg-[#0051d5] disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-[12px] transition-all duration-200 text-[15px] font-semibold shadow-sm hover:shadow-md active:scale-[0.98]"
                      title="Gửi tin nhắn"
                    >
                      {creatingDM === user._id ? (
                        <>
                          <Loader2 className="w-[18px] h-[18px] animate-spin" />
                          <span>Đang mở...</span>
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-[18px] h-[18px]" strokeWidth={2.5} />
                          <span>Nhắn tin</span>
                        </>
                      )}
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

