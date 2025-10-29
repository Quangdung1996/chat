'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import rocketChatService from '@/services/rocketchat.service';

interface Contact {
  userId: number;
  rocketUserId: string;
  username: string;
  fullName: string;
  email: string;
  department?: string;
  isActive: boolean;
  avatar?: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock data - TODO: Replace with real API call
  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const response = await rocketChatService.getUsers();
      
      if (response.success && response.users) {
        // Map RocketChat users to Contact format
        const mappedContacts: Contact[] = response.users.map((user: any) => ({
          userId: 0, // Not available from Rocket.Chat directly
          rocketUserId: user._id,
          username: user.username,
          fullName: user.name || user.username,
          email: user.emails?.[0]?.address || '',
          department: '',
          isActive: user.active,
          avatar: user.avatarUrl,
        }));
        
        setContacts(mappedContacts);
        setFilteredContacts(mappedContacts);
      }
    } catch (error) {
      console.error('Failed to load contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Search filter
  useEffect(() => {
    if (!searchTerm) {
      setFilteredContacts(contacts);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = contacts.filter(
      (contact) =>
        contact.fullName.toLowerCase().includes(term) ||
        contact.email.toLowerCase().includes(term) ||
        contact.username.toLowerCase().includes(term) ||
        contact.department?.toLowerCase().includes(term)
    );
    setFilteredContacts(filtered);
  }, [searchTerm, contacts]);

  const handleStartChat = async (contact: Contact) => {
    try {
      // TODO: Create/Get DM room and navigate to chat
      console.log('Starting chat with:', contact.fullName);
      alert(`Tính năng chat với ${contact.fullName} sẽ được thêm vào sau!`);
      // Navigate to /messages?dmWith={contact.rocketUserId}
    } catch (error) {
      console.error('Failed to start chat:', error);
    }
  };

  const getInitials = (fullName: string): string => {
    const parts = fullName.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (userId: number): string => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-red-500',
    ];
    return colors[userId % colors.length];
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="📇 Danh bạ"
        description="Tìm và chat với đồng nghiệp trong tổ chức"
      />

      <div className="space-y-6">
        {/* Search Bar */}
        <Card>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 text-xl">🔍</span>
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, phòng ban..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </Card>

        {/* Contacts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500 dark:text-gray-400">Đang tải...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <span className="text-6xl">👥</span>
              <p className="mt-4 text-gray-500 dark:text-gray-400">
                {searchTerm ? 'Không tìm thấy người dùng nào' : 'Chưa có người dùng nào'}
              </p>
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <Card key={contact.userId}>
                <div className="flex flex-col items-center text-center space-y-4">
                  {/* Avatar */}
                  <div
                    className={`w-20 h-20 rounded-full ${getAvatarColor(
                      contact.userId
                    )} flex items-center justify-center text-white text-2xl font-bold`}
                  >
                    {getInitials(contact.fullName)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 w-full">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {contact.fullName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      @{contact.username}
                    </p>
                    {contact.department && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        📁 {contact.department}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      ✉️ {contact.email}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => handleStartChat(contact)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      💬 Chat
                    </button>
                    <button
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      title="Thông tin"
                    >
                      ℹ️
                    </button>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        contact.isActive ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    ></span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {contact.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                    </span>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Summary */}
        {!loading && filteredContacts.length > 0 && (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            Hiển thị {filteredContacts.length} / {contacts.length} người dùng
          </div>
        )}
      </div>
    </div>
  );
}

