'use client';

import { useRef, useState } from 'react';
import { Paperclip, X, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { rocketChatService } from '@/services/rocketchat.service';

interface FileUploadButtonProps {
  roomId: string;
  onUploadComplete?: () => void;
  disabled?: boolean;
}

export default function FileUploadButton({ 
  roomId, 
  onUploadComplete,
  disabled = false 
}: FileUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File quá lớn. Kích thước tối đa là 10MB');
        setTimeout(() => setError(null), 3000);
        return;
      }
      setSelectedFile(file);
      setShowPreview(true);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);
    
    try {
      const response = await rocketChatService.uploadFile(
        roomId,
        selectedFile,
        undefined, // description
        message || undefined
      );

      if (response.success) {
        // Reset state
        setSelectedFile(null);
        setMessage('');
        setShowPreview(false);
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // Callback
        onUploadComplete?.();
      } else {
        throw new Error('Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.message || 'Không thể upload file. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setMessage('');
    setShowPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
      return '🖼️';
    } else if (['pdf'].includes(ext || '')) {
      return '📄';
    } else if (['doc', 'docx'].includes(ext || '')) {
      return '📝';
    } else if (['xls', 'xlsx'].includes(ext || '')) {
      return '📊';
    } else if (['zip', 'rar', '7z'].includes(ext || '')) {
      return '🗜️';
    } else if (['mp4', 'avi', 'mov', 'mkv'].includes(ext || '')) {
      return '🎥';
    } else if (['mp3', 'wav', 'ogg'].includes(ext || '')) {
      return '🎵';
    }
    return '📎';
  };

  return (
    <>
      {/* File Input (Hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />

      {/* Error Toast - Shown outside modal */}
      {error && !showPreview && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/90 border border-red-200 dark:border-red-800 rounded-lg shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Upload Button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading}
        className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-[#5b5fc7] dark:hover:text-[#5b5fc7] hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Đính kèm file"
      >
        <Paperclip className="w-5 h-5" />
      </button>

      {/* Preview Modal */}
      {showPreview && selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#2c2c2e] rounded-lg shadow-xl w-full max-w-md mx-4">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Upload File
              </h3>
              <button
                onClick={handleCancel}
                disabled={uploading}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-4 py-4 space-y-4">
              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              {/* File Preview */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-3xl">
                  {getFileIcon(selectedFile.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>

              {/* Message Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tin nhắn kèm theo (tùy chọn)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Thêm mô tả cho file..."
                  rows={3}
                  disabled={uploading}
                  className="w-full px-3 py-2 bg-white dark:bg-[#3a3a3c] border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#5b5fc7]/30 focus:border-[#5b5fc7] disabled:opacity-50"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleCancel}
                disabled={uploading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 text-sm font-medium text-white bg-[#5b5fc7] hover:bg-[#464a9e] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang tải...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

