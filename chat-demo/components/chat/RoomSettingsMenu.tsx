'use client';

import { useState } from 'react';
import rocketChatService from '@/services/rocketchat.service';
import type { UserSubscription } from '@/types/rocketchat';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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

interface RoomSettingsMenuProps {
  room: UserSubscription;
  onUpdate: () => void;
}

export default function RoomSettingsMenu({ room, onUpdate }: RoomSettingsMenuProps) {
  // Don't show settings for DMs
  if (room.type === 'd') {
    return null;
  }

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const roomType = room.type === 'p' ? 'group' : 'channel';

  const handleRename = async (newName: string) => {
    setLoading(true);
    try {
      await rocketChatService.renameRoom(room.roomId, newName, roomType);
      onUpdate();
      setShowRenameModal(false);
    } catch (error) {
      alert('Failed to rename room: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    setLoading(true);
    try {
      await rocketChatService.archiveRoom(room.roomId, roomType);
      onUpdate();
    } catch (error) {
      alert('Failed to archive room: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await rocketChatService.deleteRoom(room.roomId, roomType);
      onUpdate();
      setShowDeleteConfirm(false);
    } catch (error) {
      alert('Failed to delete room: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReadOnly = async () => {
    setLoading(true);
    try {
      await rocketChatService.setAnnouncementMode(room.roomId, !room.isReadOnly, roomType);
      onUpdate();
    } catch (error) {
      alert('Failed to update room: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Settings Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Room Settings"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setShowRenameModal(true)}>
            ✏️ Rename Room
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={handleToggleReadOnly}
            disabled={loading}
          >
            {room.isReadOnly ? '🔓 Disable' : '📢 Enable'} Read-Only
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleArchive}
            disabled={loading || room.isArchived}
          >
            📦 Archive Room
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem 
            onClick={() => setShowDeleteConfirm(true)}
            className="text-destructive focus:text-destructive"
          >
            🗑️ Delete Room
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Rename Modal */}
      <RenameModal
        isOpen={showRenameModal}
        currentName={room.roomName}
        onRename={handleRename}
        onClose={() => setShowRenameModal(false)}
        loading={loading}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        roomName={room.roomName}
        onConfirm={handleDelete}
        onClose={() => setShowDeleteConfirm(false)}
        loading={loading}
      />
    </>
  );
}

// Rename Modal Component
function RenameModal({
  isOpen,
  currentName,
  onRename,
  onClose,
  loading,
}: {
  isOpen: boolean;
  currentName: string;
  onRename: (newName: string) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [newName, setNewName] = useState(currentName);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Room</DialogTitle>
          <DialogDescription>
            Enter a new name for this room
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-2">
          <Label htmlFor="roomName">Room Name</Label>
          <Input
            id="roomName"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter room name"
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={() => onRename(newName)}
            disabled={loading || !newName.trim()}
          >
            {loading ? 'Renaming...' : 'Rename'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Delete Confirmation Dialog
function DeleteConfirmDialog({
  isOpen,
  roomName,
  onConfirm,
  onClose,
  loading,
}: {
  isOpen: boolean;
  roomName: string;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>⚠️ Delete Room?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>&ldquo;{roomName}&rdquo;</strong>?
            This action cannot be undone!
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
