'use client';

import { useState, useEffect } from 'react';
import rocketChatService from '@/services/rocketchat.service';
import type { UserSubscription, RoomMember } from '@/types/rocketchat';
import { useAuthStore } from '@/store/authStore';
import { getRoomTypeApiName } from '@/utils/roomTypeUtils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, Megaphone, Pin, X } from 'lucide-react';

interface RoomAnnouncementSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  room: UserSubscription;
  roomInfo?: {
    topic?: string;
    announcement?: string;
    readOnly?: boolean;
  };
  members?: RoomMember[];
  onUpdate?: () => void;
}

export default function RoomAnnouncementSettings({
  isOpen,
  onClose,
  room,
  roomInfo,
  members = [],
  onUpdate,
}: RoomAnnouncementSettingsProps) {
  const currentUserId = useAuthStore((state) => state.rocketChatUserId);
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState(roomInfo?.topic || '');
  const [announcement, setAnnouncement] = useState(roomInfo?.announcement || '');
  const [announcementMode, setAnnouncementMode] = useState(roomInfo?.readOnly || false);
  const [isOwnerOrModerator, setIsOwnerOrModerator] = useState(false);

  const roomType = getRoomTypeApiName(room.type);

  // Check if current user is owner or moderator
  useEffect(() => {
    if (members.length > 0 && currentUserId) {
      const currentMember = members.find((m) => m._id === currentUserId);
      const isOwner = currentMember?.roles?.includes('owner') || false;
      const isModerator = currentMember?.roles?.includes('moderator') || false;
      setIsOwnerOrModerator(isOwner || isModerator);
    } else {
      // Fallback: check from room info (owner check)
      // This is a basic check, should be enhanced with member list
      setIsOwnerOrModerator(true); // Allow for now, backend will validate
    }
  }, [members, currentUserId]);

  // Update form when roomInfo changes
  useEffect(() => {
    if (roomInfo) {
      setTopic(roomInfo.topic || '');
      setAnnouncement(roomInfo.announcement || '');
      setAnnouncementMode(roomInfo.readOnly || false);
    }
  }, [roomInfo]);

  const handleSave = async () => {
    if (!isOwnerOrModerator) {
      alert('Chỉ owner hoặc moderator mới có quyền thay đổi cài đặt này');
      return;
    }

    setLoading(true);
    try {
      const promises: Promise<any>[] = [];

      // Update topic
      if (topic !== (roomInfo?.topic || '')) {
        promises.push(rocketChatService.setRoomTopic(room.roomId, topic, roomType));
      }

      // Update announcement
      if (announcement !== (roomInfo?.announcement || '')) {
        promises.push(rocketChatService.setRoomAnnouncement(room.roomId, announcement, roomType));
      }

      // Update announcement mode
      if (announcementMode !== (roomInfo?.readOnly || false)) {
        promises.push(rocketChatService.setAnnouncementMode(room.roomId, announcementMode, roomType));
      }

      await Promise.all(promises);
      onUpdate?.();
      onClose();
    } catch (error) {
      console.error('Failed to update room settings:', error);
      alert('Có lỗi xảy ra khi cập nhật cài đặt. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOwnerOrModerator) {
    return null; // Don't show if not owner/moderator
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            Cài đặt thông báo nhóm
          </DialogTitle>
          <DialogDescription>
            Chỉ owner và moderator mới có quyền thay đổi các cài đặt này
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Announcement Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="announcement-mode" className="text-base font-semibold">
                Chế độ Read-Only (Chỉ đọc)
              </Label>
              <p className="text-sm text-muted-foreground">
                {announcementMode ? 
                  '🔒 Đang BẬT - Chỉ owner và moderator có thể gửi tin nhắn' : 
                  '🔓 Đang TẮT - Tất cả thành viên có thể gửi tin nhắn'
                }
              </p>
            </div>
            <Switch
              id="announcement-mode"
              checked={announcementMode}
              onCheckedChange={setAnnouncementMode}
              disabled={loading}
            />
          </div>

          {/* Topic */}
          <div className="space-y-2">
            <Label htmlFor="topic" className="text-base font-semibold">
              Chủ đề nhóm
            </Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ví dụ: Dự án Website 2024 - Sprint 1"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Chủ đề hoặc mục đích của nhóm
            </p>
          </div>

          {/* Announcement */}
          <div className="space-y-2">
            <Label htmlFor="announcement" className="text-base font-semibold">
              Thông báo
            </Label>
            <Textarea
              id="announcement"
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="Thông báo quan trọng cho thành viên..."
              rows={4}
              disabled={loading}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Thông báo sẽ hiển thị nổi bật trong nhóm
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              'Lưu thay đổi'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

