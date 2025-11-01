'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, UserMinus, LogOut } from 'lucide-react';
import { type RoomType } from '@/types/rocketchat';
import { isDirectMessage } from '@/utils/roomTypeUtils';

interface ConfirmRemoveMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  memberName: string;
  loading?: boolean;
  mode?: 'remove' | 'leave'; // 'remove' for removing member, 'leave' for leaving room
  roomType?: RoomType; // room type for leave mode
}

export default function ConfirmRemoveMemberModal({
  isOpen,
  onClose,
  onConfirm,
  memberName,
  loading = false,
  mode = 'remove',
  roomType,
}: ConfirmRemoveMemberModalProps) {
  // Get room type label for leave mode
  const getRoomTypeLabel = () => {
    if (!roomType) return 'nhóm';
    if (isDirectMessage(roomType)) return 'cuộc trò chuyện';
    return roomType === 'p' ? 'nhóm riêng tư' : 'kênh';
  };

  const isLeaveMode = mode === 'leave';
  const typeLabel = getRoomTypeLabel();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[400px] p-0 gap-0 overflow-hidden bg-white dark:bg-[#1c1c1e] shadow-2xl rounded-2xl border-0">
        {/* Header with Icon - Warning Style */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex flex-col items-center text-center gap-4">
            {/* Warning Icon */}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-300 ${
              isLeaveMode 
                ? 'bg-gradient-to-br from-orange-500 to-red-600 dark:from-orange-600 dark:to-red-700 shadow-orange-500/30'
                : 'bg-gradient-to-br from-red-500 to-rose-600 dark:from-red-600 dark:to-rose-700 shadow-red-500/30'
            }`}>
              <AlertTriangle className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            
            {/* Title & Description */}
            <div className="space-y-2">
              <DialogTitle className="text-[18px] font-bold text-gray-900 dark:text-white">
                {isLeaveMode ? `Rời khỏi ${typeLabel}?` : 'Xóa thành viên?'}
              </DialogTitle>
              <DialogDescription className="text-[14px] text-gray-600 dark:text-gray-400 leading-relaxed">
                {isLeaveMode ? (
                  <>
                    Bạn có chắc chắn muốn rời khỏi <span className="font-semibold text-gray-900 dark:text-white">{memberName}</span>?
                  </>
                ) : (
                  <>
                    Bạn có chắc chắn muốn xóa <span className="font-semibold text-gray-900 dark:text-white">{memberName}</span> khỏi nhóm?
                  </>
                )}
              </DialogDescription>
              <p className="text-[12px] text-gray-500 dark:text-gray-500 mt-1">
                {isLeaveMode ? (
                  roomType === 'd' 
                    ? 'Cuộc trò chuyện sẽ bị ẩn khỏi danh sách của bạn.'
                    : `Bạn sẽ không còn nhận được tin nhắn từ ${typeLabel} này.`
                ) : (
                  'Thành viên này sẽ không còn quyền truy cập vào nhóm.'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Footer - Action Buttons */}
        <div className="px-6 pb-6 pt-2">
          <div className="flex items-center gap-3">
            {/* Cancel Button */}
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 h-11 text-[14px] font-semibold border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Hủy
            </Button>
            
            {/* Confirm Button */}
            <Button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 h-11 text-[14px] font-semibold text-white rounded-xl shadow-lg disabled:opacity-50 disabled:shadow-none transition-all hover:scale-[1.02] active:scale-[0.98] ${
                isLeaveMode
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 dark:from-orange-600 dark:to-red-700 shadow-orange-500/30'
                  : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 dark:from-red-600 dark:to-rose-700 shadow-red-500/30'
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                  {isLeaveMode ? 'Đang rời...' : 'Đang xóa...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {isLeaveMode ? <LogOut className="w-4 h-4" /> : <UserMinus className="w-4 h-4" />}
                  {isLeaveMode ? `Rời ${typeLabel}` : 'Xóa thành viên'}
                </span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

