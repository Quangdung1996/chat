'use client';

import { Hash, Megaphone } from 'lucide-react';
import { isDirectMessage } from '@/utils/roomTypeUtils';

interface RoomInfoBannerProps {
  topic?: string;
  announcement?: string;
  roomType: string;
}

export default function RoomInfoBanner({ topic, announcement, roomType }: RoomInfoBannerProps) {
  // Không hiển thị cho direct message
  if (isDirectMessage(roomType as any)) {
    return null;
  }

  // Chỉ hiển thị nếu có topic hoặc announcement
  if (!topic && !announcement) {
    return null;
  }

  return (
    <div className="flex-shrink-0 bg-white/80 dark:bg-[#2c2c2e]/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 px-5 py-2.5">
      <div className="flex items-start gap-4">
        {/* Topic */}
        {topic && (
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <div className="flex-shrink-0 w-6 h-6 rounded-md bg-[#007aff]/10 dark:bg-[#0a84ff]/20 flex items-center justify-center mt-0.5">
              <Hash className="w-3.5 h-3.5 text-[#007aff] dark:text-[#0a84ff]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">
                Chủ đề nhóm
              </div>
              <p className="text-[13px] text-gray-900 dark:text-white leading-snug break-words line-clamp-2">
                {topic}
              </p>
            </div>
          </div>
        )}

        {/* Divider - chỉ hiển thị nếu có cả topic và announcement */}
        {topic && announcement && (
          <div className="w-px h-12 bg-gray-200/50 dark:bg-gray-700/50 self-stretch" />
        )}

        {/* Announcement */}
        {announcement && (
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <div className="flex-shrink-0 w-6 h-6 rounded-md bg-[#007aff]/10 dark:bg-[#0a84ff]/20 flex items-center justify-center mt-0.5">
              <Megaphone className="w-3.5 h-3.5 text-[#007aff] dark:text-[#0a84ff]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">
                Thông báo
              </div>
              <p className="text-[13px] text-gray-900 dark:text-white leading-snug break-words whitespace-pre-wrap line-clamp-2">
                {announcement}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

