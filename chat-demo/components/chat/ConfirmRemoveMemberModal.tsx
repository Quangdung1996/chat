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
import { AlertTriangle, UserMinus, X } from 'lucide-react';

interface ConfirmRemoveMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  memberName: string;
  loading?: boolean;
}

export default function ConfirmRemoveMemberModal({
  isOpen,
  onClose,
  onConfirm,
  memberName,
  loading = false,
}: ConfirmRemoveMemberModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[400px] p-0 gap-0 overflow-hidden bg-white dark:bg-[#1c1c1e] shadow-2xl rounded-2xl border-0">
        {/* Header with Icon - Warning Style */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex flex-col items-center text-center gap-4">
            {/* Warning Icon */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-rose-600 dark:from-red-600 dark:to-rose-700 flex items-center justify-center shadow-lg shadow-red-500/30 animate-in zoom-in duration-300">
              <AlertTriangle className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            
            {/* Title & Description */}
            <div className="space-y-2">
              <DialogTitle className="text-[18px] font-bold text-gray-900 dark:text-white">
                Xóa thành viên?
              </DialogTitle>
              <DialogDescription className="text-[14px] text-gray-600 dark:text-gray-400 leading-relaxed">
                Bạn có chắc chắn muốn xóa <span className="font-semibold text-gray-900 dark:text-white">{memberName}</span> khỏi nhóm?
              </DialogDescription>
              <p className="text-[12px] text-gray-500 dark:text-gray-500 mt-1">
                Thành viên này sẽ không còn quyền truy cập vào nhóm.
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
            
            {/* Confirm Delete Button */}
            <Button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 h-11 text-[14px] font-semibold bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 dark:from-red-600 dark:to-rose-700 text-white rounded-xl shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:shadow-none transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                  Đang xóa...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserMinus className="w-4 h-4" />
                  Xóa thành viên
                </span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

