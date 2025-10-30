'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle, Users as UsersIcon, UserCircle2, Settings2 } from 'lucide-react';

export default function TeamsSidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Chat', icon: MessageCircle },
    { href: '/channels', label: 'Channels', icon: UsersIcon },
    { href: '/contacts', label: 'Danh bạ', icon: UserCircle2 },
  ];

  return (
    <div className="w-20 flex-shrink-0 bg-gradient-to-b from-blue-600 to-blue-700 dark:from-gray-900 dark:to-gray-950 flex flex-col items-center py-6 shadow-xl border-r border-blue-500/20">
      {/* App Logo */}
      <div className="w-14 h-14 mb-8 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer hover:scale-105 transform duration-200">
        💬
      </div>

      {/* Navigation Items */}
      <div className="space-y-3 w-full px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className="block group relative"
              title={item.label}
            >
              <div
                className={`
                  w-full aspect-square flex flex-col items-center justify-center rounded-xl
                  transition-all duration-200 relative overflow-hidden
                  ${isActive 
                    ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm' 
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full shadow-lg" />
                )}
                
                <Icon className="w-6 h-6" strokeWidth={2.5} />
                
                {/* Label below icon */}
                <span className="text-[10px] mt-1 font-medium">
                  {item.label.split(' ')[0]}
                </span>
              </div>
              
              {/* Tooltip */}
              <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 shadow-xl">
                {item.label}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings at bottom */}
      <Link
        href="/settings"
        className="group relative"
        title="Cài đặt"
      >
        <div className="w-14 h-14 flex items-center justify-center rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-all duration-200">
          <Settings2 className="w-6 h-6" strokeWidth={2.5} />
        </div>
        
        <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 shadow-xl">
          Cài đặt
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
        </div>
      </Link>
    </div>
  );
}

