'use client';

import { useState } from 'react';
import rocketChatService from '@/services/rocketchat.service';
import type { UserSubscription } from '@/types/rocketchat';

interface RoomSettingsMenuProps {
  room: UserSubscription;
  onUpdate: () => void;
}

export default function RoomSettingsMenu({ room, onUpdate }: RoomSettingsMenuProps) {
  // Don't show settings for DMs
  if (room.type === 'd') {
    return null;
  }

  const [showMenu, setShowMenu] = useState(false);
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
      setShowMenu(false);
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
      setShowMenu(false);
    } catch (error) {
      alert('Failed to delete room: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReadOnly = async (announcementOnly: boolean) => {
    setLoading(true);
    try {
      await rocketChatService.setAnnouncementMode(room.roomId, announcementOnly, roomType);
      onUpdate();
      setShowMenu(false);
    } catch (error) {
      alert('Failed to update room: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Settings Button */}
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-20">
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowRenameModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  ✏️ Rename Room
                </button>
                
                <button
                  onClick={handleToggleReadOnly}
                  disabled={loading}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50"
                >
                  {room.isReadOnly ? '🔓 Disable' : '📢 Enable'} Read-Only
                </button>

                <button
                  onClick={handleArchive}
                  disabled={loading || room.isArchived}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50"
                >
                  📦 Archive Room
                </button>

                <div className="border-t dark:border-gray-700 my-1" />

                <button
                  onClick={() => {
                    setShowDeleteConfirm(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2"
                >
                  🗑️ Delete Room
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Rename Modal */}
      {showRenameModal && (
        <RenameModal
          currentName={room.roomName}
          onRename={handleRename}
          onClose={() => setShowRenameModal(false)}
          loading={loading}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <DeleteConfirmModal
          roomName={room.roomName}
          onConfirm={handleDelete}
          onClose={() => setShowDeleteConfirm(false)}
          loading={loading}
        />
      )}
    </>
  );
}

// Rename Modal Component
function RenameModal({
  currentName,
  onRename,
  onClose,
  loading,
}: {
  currentName: string;
  onRename: (newName: string) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [newName, setNewName] = useState(currentName);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Rename Room
          </h3>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white mb-4"
            autoFocus
          />
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={() => onRename(newName)}
              disabled={loading || !newName.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
            >
              {loading ? 'Renaming...' : 'Rename'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Delete Confirmation Modal
function DeleteConfirmModal({
  roomName,
  onConfirm,
  onClose,
  loading,
}: {
  roomName: string;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">
            ⚠️ Delete Room?
          </h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Are you sure you want to delete <strong>"{roomName}"</strong>?
            This action cannot be undone!
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

