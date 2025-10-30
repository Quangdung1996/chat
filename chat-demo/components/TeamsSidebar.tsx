'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Hash, Users, Calendar, Phone, FolderOpen, Settings } from 'lucide-react';

export default function TeamsSidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Chat', icon: MessageSquare },
    { href: '/channels', label: 'Channels', icon: Hash },
    { href: '/teams', label: 'Teams', icon: Users },
    { href: '/calendar', label: 'Calendar', icon: Calendar },
    { href: '/calls', label: 'Calls', icon: Phone },
    { href: '/files', label: 'Files', icon: FolderOpen },
  ];

  return (
    <div className="w-16 bg-purple-700 dark:bg-gray-900 flex flex-col items-center py-4 space-y-2">
      {/* App Logo */}
      <div className="w-12 h-12 mb-4 bg-white rounded-lg flex items-center justify-center text-2xl">
        💬
      </div>

      {/* Navigation Items */}
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        const Icon = item.icon;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              w-12 h-12 flex flex-col items-center justify-center rounded-lg
              transition-all duration-200 group relative
              ${isActive 
                ? 'bg-purple-600 dark:bg-purple-800 text-white' 
                : 'text-white/70 hover:bg-purple-600 dark:hover:bg-purple-800 hover:text-white'
              }
            `}
            title={item.label}
          >
            {/* Active indicator */}
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
            )}
            
            <Icon className="w-6 h-6" />
            
            {/* Tooltip */}
            <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              {item.label}
            </div>
          </Link>
        );
      })}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings at bottom */}
      <Link
        href="/settings"
        className="w-12 h-12 flex items-center justify-center rounded-lg text-white/70 hover:bg-purple-600 dark:hover:bg-purple-800 hover:text-white transition-colors group relative"
        title="Settings"
      >
        <Settings className="w-6 h-6" />
        
        <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
          Settings
        </div>
      </Link>
    </div>
  );
}

