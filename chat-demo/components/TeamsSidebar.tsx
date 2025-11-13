'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle, Settings2 } from 'lucide-react';

export default function TeamsSidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Chat', icon: MessageCircle },
  ];

  return (
    <div className="w-[72px] flex-shrink-0 bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-xl flex flex-col items-center py-5 border-r border-gray-200/50 dark:border-gray-700/50 shadow-sm">
      {/* App Logo - Apple Style */}
      <div className="w-12 h-12 mb-6 bg-gradient-to-br from-[#007aff] to-[#5856d6] rounded-[14px] flex items-center justify-center text-2xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer hover:scale-105">
        💬
      </div>

      {/* Navigation Items - Minimal & Clean */}
      <div className="space-y-1 w-full px-3">
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
                  w-full h-14 flex flex-col items-center justify-center rounded-xl
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-[#007aff]/10 dark:bg-[#0a84ff]/20 text-[#007aff] dark:text-[#0a84ff]' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100/60 dark:hover:bg-gray-700/40 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                <Icon className="w-6 h-6 mb-0.5" strokeWidth={2} />
                <span className={`text-[10px] font-medium ${isActive ? 'text-[#007aff] dark:text-[#0a84ff]' : ''}`}>
                  {item.label.split(' ')[0]}
                </span>
              </div>
              
              {/* Tooltip - Refined */}
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900/95 dark:bg-gray-800/95 backdrop-blur-sm text-white text-[13px] rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 shadow-lg">
                {item.label}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-gray-900/95 dark:border-r-gray-800/95" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings at bottom - Refined */}
      <Link
        href="/settings"
        className="group relative mb-2"
        title="Cài đặt"
      >
        <div className="w-12 h-12 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100/60 dark:hover:bg-gray-700/40 hover:text-gray-900 dark:hover:text-white transition-all duration-200">
          <Settings2 className="w-5 h-5" strokeWidth={2} />
        </div>
        
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900/95 dark:bg-gray-800/95 backdrop-blur-sm text-white text-[13px] rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 shadow-lg">
          Cài đặt
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-gray-900/95 dark:border-r-gray-800/95" />
        </div>
      </Link>
    </div>
  );
}

