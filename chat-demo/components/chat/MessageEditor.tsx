'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Dropcursor from '@tiptap/extension-dropcursor';
import { Extension } from '@tiptap/core';
import { useEffect, forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Smile, Bold, Italic, Strikethrough, Code, Paperclip, X, Upload, Loader2, AlertCircle } from 'lucide-react';
import { rocketChatService } from '@/services/rocketchat.service';
import '@/styles/tiptap.css';

// Custom extension to handle Enter key (send) and Shift+Enter (new line)
const EnterKeyHandler = Extension.create({
  name: 'enterKeyHandler',

  addKeyboardShortcuts() {
    return {
      'Enter': () => {
        // Call the custom onSubmit handler
        const onSubmit = this.options.onSubmit;
        if (onSubmit) {
          onSubmit();
          return true; // Prevent default behavior
        }
        return false;
      },
      'Shift-Enter': () => {
        // Insert a new line
        return this.editor.commands.first(({ commands }) => [
          () => commands.newlineInCode(),
          () => commands.createParagraphNear(),
          () => commands.liftEmptyBlock(),
          () => commands.splitBlock(),
        ]);
      },
    };
  },
});

interface MessageEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  roomId: string; // For file upload
}

export interface MessageEditorRef {
  focus: () => void;
  clear: () => void;
}

const MessageEditor = forwardRef<MessageEditorRef, MessageEditorProps>(
  ({ value, onChange, onSubmit, placeholder = 'Nhập tin nhắn...', disabled = false, roomId }, ref) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);

    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          // Disable heading, blockquote, etc. for simple chat
          heading: false,
          blockquote: false,
          codeBlock: false,
          horizontalRule: false,
        }),
        Placeholder.configure({
          placeholder,
        }),
        Image.configure({
          inline: true,
          allowBase64: true,
        }),
        Dropcursor,
        EnterKeyHandler.configure({
          onSubmit,
        }),
      ],
      content: value,
      editorProps: {
        attributes: {
          class: 'prose prose-sm max-w-none focus:outline-none min-h-[36px] max-h-[120px] overflow-y-auto px-3 py-2 text-[14px] text-gray-900 dark:text-white',
        },
        handleDrop: (view, event, slice, moved) => {
          if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
            const file = event.dataTransfer.files[0];
            event.preventDefault();
            handleFileSelect(file);
            return true;
          }
          return false;
        },
        handlePaste: (view, event) => {
          const items = event.clipboardData?.items;
          if (items) {
            for (let i = 0; i < items.length; i++) {
              if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                  event.preventDefault();
                  handleFileSelect(file);
                  return true;
                }
              }
            }
          }
          return false;
        },
      },
      onUpdate: ({ editor }) => {
        const text = editor.getText();
        onChange(text);
      },
      editable: !disabled,
    });

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      focus: () => {
        editor?.commands.focus();
      },
      clear: () => {
        editor?.commands.clearContent();
      },
    }));

    // File handling functions
    const handleFileSelect = (file: File) => {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File quá lớn. Kích thước tối đa là 10MB');
        setTimeout(() => setError(null), 3000);
        return;
      }
      setSelectedFile(file);
      setShowPreview(true);
      setError(null);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
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
          undefined,
          message || undefined
        );

        if (response.success) {
          setSelectedFile(null);
          setMessage('');
          setShowPreview(false);
          
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
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

    // Sync external value changes (e.g., when clearing after send)
    useEffect(() => {
      if (editor && value === '' && editor.getText() !== '') {
        editor.commands.clearContent();
      }
    }, [value, editor]);

    // Handle Enter key
    useEffect(() => {
      if (!editor) return;

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          onSubmit();
        }
      };

      const editorElement = editor.view.dom;
      editorElement.addEventListener('keydown', handleKeyDown);

      return () => {
        editorElement.removeEventListener('keydown', handleKeyDown);
      };
    }, [editor, onSubmit]);

    if (!editor) {
      return null;
    }

    return (
      <>
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled || uploading}
        />

        {/* Error Toast */}
        {error && !showPreview && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/90 border border-red-200 dark:border-red-800 rounded-lg shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex items-center gap-1 px-2 py-1 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#2a2a2c] rounded-t">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              disabled={disabled}
              className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-700' : ''
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
            
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={disabled}
              className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-700' : ''
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
            
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              disabled={disabled}
              className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                editor.isActive('strike') ? 'bg-gray-200 dark:bg-gray-700' : ''
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Strikethrough"
            >
              <Strikethrough className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
            
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleCode().run()}
              disabled={disabled}
              className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                editor.isActive('code') ? 'bg-gray-200 dark:bg-gray-700' : ''
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Inline Code"
            >
              <Code className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>

            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Attach file (or drag & drop)"
            >
              <Paperclip className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
            
            <button
              type="button"
              disabled={disabled}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Emoji"
            >
              <Smile className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
          </div>

          {/* Editor Content */}
          <div className="relative bg-white dark:bg-[#3a3a3c] border border-t-0 border-gray-300 dark:border-gray-600 rounded-b">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* File Preview Modal */}
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
);

MessageEditor.displayName = 'MessageEditor';

export default MessageEditor;

