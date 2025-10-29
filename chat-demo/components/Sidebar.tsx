'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Sidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Trang chủ', icon: '🏠', title: 'Trang chủ' },
    { href: '/contacts', label: 'Danh bạ', icon: '📇', title: 'Danh bạ' },
    { href: '/rooms', label: 'Phòng', icon: '💬', title: 'Phòng chat' },
    { href: '/messages', label: 'Tin nhắn', icon: '📨', title: 'Tin nhắn' },
    { href: '/users', label: 'Users', icon: '👥', title: 'Quản lý User' },
    { href: '/settings', label: 'Cài đặt', icon: '⚙️', title: 'Cài đặt' },
  ];

  return (
    <div className="w-20 bg-gray-900 dark:bg-gray-950 flex flex-col items-center py-4 space-y-2">
      {/* Logo */}
      <div className="mb-4">
        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-2xl">
          💬
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 flex flex-col items-center space-y-2 w-full">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.title}
              className={`relative w-16 h-16 flex flex-col items-center justify-center rounded-lg transition-all group ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r"></div>
              )}
              
              {/* Icon */}
              <span className="text-2xl mb-1">{item.icon}</span>
              
              {/* Label */}
              <span className="text-xs font-medium truncate max-w-full px-1">
                {item.label}
              </span>

              {/* Tooltip on hover */}
              <div className="absolute left-20 bg-gray-800 text-white px-3 py-2 rounded-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                {item.title}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-800 rotate-45"></div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* User Profile at bottom */}
      <div className="mt-auto pt-4">
        <button
          className="w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-white font-bold transition-colors"
          title="Profile"
        >
          U
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

