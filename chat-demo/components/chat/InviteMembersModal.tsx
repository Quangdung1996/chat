'use client';

import { useState } from 'react';
import rocketChatService from '@/services/rocketchat.service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface InviteMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  onSuccess: () => void;
}

export default function InviteMembersModal({
  isOpen,
  onClose,
  roomId,
  onSuccess,
}: InviteMembersModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userIds, setUserIds] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Parse user IDs
      const ids = userIds
        .split(/[,\n]/)
        .map((id) => id.trim())
        .filter((id) => id.length > 0);

      if (ids.length === 0) {
        setError('Please enter at least one user ID');
        setLoading(false);
        return;
      }

      // Add members
      const response = await rocketChatService.addMembers(roomId, ids);

      if (response.success) {
        onSuccess();
        onClose();
        setUserIds('');
      } else {
        setError('Failed to add members');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const userCount = userIds
    .split(/[,\n]/)
    .filter((id) => id.trim().length > 0).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>👥 Invite Members</DialogTitle>
          <DialogDescription>
            Add members to this room by entering their Rocket.Chat user IDs
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error */}
          {error && (
            <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* User IDs Input */}
          <div className="space-y-2">
            <Label htmlFor="userIds">Rocket.Chat User IDs</Label>
            <textarea
              id="userIds"
              value={userIds}
              onChange={(e) => setUserIds(e.target.value)}
              placeholder="Enter user IDs (one per line or comma-separated)&#10;e.g:&#10;abc123&#10;def456&#10;ghi789"
              rows={6}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none font-mono"
              required
            />
            <p className="text-xs text-muted-foreground">
              💡 Enter Rocket.Chat user IDs separated by comma or new line
            </p>
          </div>

          {/* Preview */}
          {userIds.trim() && (
            <div className="bg-primary/10 border border-primary/20 px-4 py-3 rounded-md">
              <p className="text-sm">
                📋 Will invite{' '}
                <strong>{userCount}</strong>{' '}
                user(s)
              </p>
            </div>
          )}

          {/* Actions */}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !userIds.trim()}
            >
              {loading ? 'Inviting...' : 'Invite Members'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
