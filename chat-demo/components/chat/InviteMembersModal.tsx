'use client';

import { useState } from 'react';
import rocketChatService from '@/services/rocketchat.service';

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

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="p-6 border-b dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                👥 Invite Members
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Error */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* User IDs Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rocket.Chat User IDs
              </label>
              <textarea
                value={userIds}
                onChange={(e) => setUserIds(e.target.value)}
                placeholder="Enter user IDs (one per line or comma-separated)&#10;e.g:&#10;abc123&#10;def456&#10;ghi789"
                rows={6}
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm resize-none"
                required
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                💡 Enter Rocket.Chat user IDs separated by comma or new line
              </p>
            </div>

            {/* Preview */}
            {userIds.trim() && (
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 px-4 py-3 rounded">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  📋 Will invite{' '}
                  <strong>
                    {userIds.split(/[,\n]/).filter((id) => id.trim().length > 0).length}
                  </strong>{' '}
                  user(s)
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !userIds.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Inviting...' : 'Invite Members'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

