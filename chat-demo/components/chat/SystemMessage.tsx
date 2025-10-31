'use client';

import { UserPlus, UserMinus, LogIn, LogOut, Users } from 'lucide-react';

interface SystemMessageProps {
  message: {
    text: string;
    type: string | null;
    timestamp?: string;
    user?: {
      name?: string;
      username?: string;
    };
  };
}

/**
 * SystemMessage component - Display system messages (added user, removed user, etc.)
 * Rocket.Chat message types:
 * - "au" = added user to channel/group
 * - "ru" = removed user from channel/group  
 * - "uj" = user joined
 * - "ul" = user left
 * - "room_changed_description" = room description changed
 * - "room_changed_topic" = room topic changed
 */
export default function SystemMessage({ message }: SystemMessageProps) {
  const { text, type, user } = message;
  
  // Parse system message and get appropriate icon + formatted text
  const getSystemMessageInfo = () => {
    const userName = user?.name || user?.username || 'Someone';
    
    switch (type || '') {
      case 'au': // Added user
        return {
          icon: <UserPlus className="w-3.5 h-3.5" />,
          text: text || `${userName} đã được thêm vào nhóm`,
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
        };
        
      case 'ru': // Removed user
        return {
          icon: <UserMinus className="w-3.5 h-3.5" />,
          text: text || `${userName} đã bị xóa khỏi nhóm`,
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
        };
        
      case 'uj': // User joined
        return {
          icon: <LogIn className="w-3.5 h-3.5" />,
          text: text || `${userName} đã tham gia`,
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        };
        
      case 'ul': // User left
        return {
          icon: <LogOut className="w-3.5 h-3.5" />,
          text: text || `${userName} đã rời khỏi nhóm`,
          color: 'text-orange-600 dark:text-orange-400',
          bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        };
        
      case 'room_changed_description':
      case 'room_changed_topic':
      case 'room_changed_privacy':
      case 'room_changed_avatar':
        return {
          icon: <Users className="w-3.5 h-3.5" />,
          text: text || `${userName} đã cập nhật thông tin nhóm`,
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-50 dark:bg-gray-800/50',
        };
        
      default:
        return {
          icon: <Users className="w-3.5 h-3.5" />,
          text: text || 'Thông báo hệ thống',
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-50 dark:bg-gray-800/50',
        };
    }
  };
  
  const info = getSystemMessageInfo();
  
  return (
    <div className="flex items-center justify-center my-3">
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${info.bgColor} ${info.color}`}>
        {info.icon}
        <span className="text-[12px] font-medium">
          {info.text}
        </span>
      </div>
    </div>
  );
}

