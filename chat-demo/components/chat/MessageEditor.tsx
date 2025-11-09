'use client';

import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Smile, Bold, Italic, Strikethrough, Code, Paperclip, X, Upload, Loader2, AlertCircle } from 'lucide-react';
import { rocketChatService } from '@/services/rocketchat.service';
import dynamic from 'next/dynamic';

// Dynamic import emoji picker to avoid SSR issues
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

// Lexical imports
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { 
  $getRoot, 
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_ENTER_COMMAND,
  EditorState,
  TextFormatType,
  $createTextNode,
  $createParagraphNode,
  $isElementNode,
  $setSelection,
  $createRangeSelection
} from 'lexical';
import { useEffect } from 'react';

// Lexical theme
const theme = {
  text: {
    bold: 'font-bold',
    italic: 'italic',
    strikethrough: 'line-through',
    code: 'bg-gray-100 dark:bg-gray-700 rounded px-1 py-0.5 font-mono text-sm',
  },
  paragraph: 'mb-0',
};

interface MessageEditorProps {
  onSubmit: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  roomId: string;
}

export interface MessageEditorRef {
  focus: () => void;
  clear: () => void;
  getText: () => string;
}

// Plugin to handle Enter key submission
function EnterKeyPlugin({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event: KeyboardEvent) => {
        if (event.shiftKey) {
          // Shift+Enter = new line (default behavior)
          return false;
        }
        // Enter = submit
        event.preventDefault();
        
        // Get text content before clearing
        const textContent = editor.getEditorState().read(() => {
          return $getRoot().getTextContent();
        });
        
        // Only submit if there's content
        if (textContent.trim()) {
          onSubmit(textContent.trim());
          
          // Clear editor after submit
          editor.update(() => {
            const root = $getRoot();
            root.clear();
          });
        }
        
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, onSubmit]);

  return null;
}

// Plugin to expose editor methods via ref
function EditorRefPlugin({ editorRef, onEmojiInsert }: { editorRef: React.MutableRefObject<any>, onEmojiInsert?: (insertFn: (emoji: string) => void) => void }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const insertEmoji = (emoji: string) => {
      // Focus editor first to ensure we have a selection
      editor.focus();
      
      editor.update(() => {
        const selection = $getSelection();
        const root = $getRoot();
        const emojiNode = $createTextNode(emoji);
        
        if ($isRangeSelection(selection)) {
          // Insert at current selection
          selection.insertNodes([emojiNode]);
        } else {
          // No selection, get last paragraph or create one
          const lastChild = root.getLastChild();
          if (lastChild && $isElementNode(lastChild) && lastChild.getType() === 'paragraph') {
            lastChild.append(emojiNode);
          } else {
            // Create new paragraph with emoji
            const paragraph = $createParagraphNode();
            paragraph.append(emojiNode);
            root.append(paragraph);
          }
        }
      });
    };

    editorRef.current = {
      focus: () => editor.focus(),
      clear: () => {
        editor.update(() => {
          const root = $getRoot();
          root.clear();
        });
      },
      getText: () => {
        return editor.getEditorState().read(() => {
          return $getRoot().getTextContent();
        });
      },
      insertEmoji,
    };

    // Pass insert function to parent
    if (onEmojiInsert) {
      onEmojiInsert(insertEmoji);
    }
  }, [editor, editorRef, onEmojiInsert]);

  return null;
}

// Toolbar component
function ToolbarPlugin({ disabled, roomId, fileInputRef, uploading, showEmojiPicker, setShowEmojiPicker }: any) {
  const [editor] = useLexicalComposerContext();
  const [activeFormats, setActiveFormats] = useState<Set<TextFormatType>>(new Set());

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const formats = new Set<TextFormatType>();
          if (selection.hasFormat('bold')) formats.add('bold');
          if (selection.hasFormat('italic')) formats.add('italic');
          if (selection.hasFormat('strikethrough')) formats.add('strikethrough');
          if (selection.hasFormat('code')) formats.add('code');
          setActiveFormats(formats);
        }
      });
    });
  }, [editor]);

  const formatText = (format: TextFormatType) => {
    // Focus editor first
    editor.focus();
    
    let shouldApplyFormat = false;
    
    editor.update(() => {
      const selection = $getSelection();
      const root = $getRoot();
      
      if ($isRangeSelection(selection)) {
        // Has selection, apply format normally
        shouldApplyFormat = true;
      } else if (root.isEmpty()) {
        // Editor is empty, create paragraph with empty text node
        const paragraph = $createParagraphNode();
        const textNode = $createTextNode('');
        paragraph.append(textNode);
        root.append(paragraph);
        
        // Create selection and select the text node
        const rangeSelection = $createRangeSelection();
        rangeSelection.anchor.set(textNode.getKey(), 0, 'text');
        rangeSelection.focus.set(textNode.getKey(), 0, 'text');
        $setSelection(rangeSelection);
        shouldApplyFormat = true;
      }
      // If editor has content but no selection, format will be applied to next typed text
    });
    
    // Apply format command after update completes
    if (shouldApplyFormat) {
      requestAnimationFrame(() => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
      });
    } else {
      // No selection but editor has content - format will apply to next typed text
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
    }
  };

  return (
    <div className="flex items-center gap-1 px-2 py-1 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#2a2a2c] rounded-t">
      <button
        type="button"
        onClick={() => formatText('bold')}
        disabled={disabled}
        className={`p-1.5 rounded transition-colors ${
          activeFormats.has('bold')
            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => formatText('italic')}
        disabled={disabled}
        className={`p-1.5 rounded transition-colors ${
          activeFormats.has('italic')
            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => formatText('strikethrough')}
        disabled={disabled}
        className={`p-1.5 rounded transition-colors ${
          activeFormats.has('strikethrough')
            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => formatText('code')}
        disabled={disabled}
        className={`p-1.5 rounded transition-colors ${
          activeFormats.has('code')
            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title="Inline Code"
      >
        <Code className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading}
        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
        title="Attach file (or drag & drop)"
      >
        <Paperclip className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        disabled={disabled}
        className={`p-1.5 rounded transition-colors ${
          showEmojiPicker
            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title="Emoji"
      >
        <Smile className="w-4 h-4" />
      </button>
    </div>
  );
}

const MessageEditor = forwardRef<MessageEditorRef, MessageEditorProps>(
  ({ onSubmit, placeholder = 'Nhập tin nhắn...', disabled = false, roomId }, ref) => {
    const editorRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const emojiButtonRef = useRef<HTMLButtonElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const insertEmojiRef = useRef<((emoji: string) => void) | null>(null);

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      focus: () => editorRef.current?.focus(),
      clear: () => editorRef.current?.clear(),
      getText: () => editorRef.current?.getText() || '',
    }));

    // Lexical initial config
    const initialConfig = {
      namespace: 'MessageEditor',
      theme,
      onError: (error: Error) => console.error(error),
      editable: !disabled,
    };

    // Handle emoji selection
    const handleEmojiClick = (emojiData: any) => {
      if (insertEmojiRef.current) {
        insertEmojiRef.current(emojiData.emoji);
      }
      setShowEmojiPicker(false);
      editorRef.current?.focus();
    };

    // Close emoji picker when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        
        // Check if click is outside emoji picker and emoji button
        if (showEmojiPicker) {
          const emojiPicker = document.querySelector('.emoji-picker-react');
          const emojiButton = target.closest('[title="Emoji"]');
          
          if (emojiPicker && !emojiPicker.contains(target) && !emojiButton) {
            setShowEmojiPicker(false);
          }
        }
      };

      if (showEmojiPicker) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [showEmojiPicker]);

    // File handling functions
    const handleFileSelect = (file: File) => {
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
      return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
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
          <LexicalComposer initialConfig={initialConfig}>
            {/* Toolbar */}
            <ToolbarPlugin 
              disabled={disabled} 
              roomId={roomId} 
              fileInputRef={fileInputRef}
              uploading={uploading}
              showEmojiPicker={showEmojiPicker}
              setShowEmojiPicker={setShowEmojiPicker}
            />

            {/* Editor */}
            <div className="relative bg-white dark:bg-[#3a3a3c] border border-t-0 border-gray-300 dark:border-gray-600 rounded-b transition-all duration-200">
              <RichTextPlugin
                contentEditable={
                  <ContentEditable className="min-h-[40px] max-h-[120px] overflow-y-auto px-3 py-2 text-[14px] text-gray-900 dark:text-white focus:outline-none transition-all duration-150" />
                }
                placeholder={
                  <div className="absolute top-2 left-3 text-[14px] text-gray-400 dark:text-gray-500 pointer-events-none select-none">
                    {placeholder}
                  </div>
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
              <HistoryPlugin />
              <EnterKeyPlugin onSubmit={onSubmit} />
              <EditorRefPlugin 
                editorRef={editorRef} 
                onEmojiInsert={(fn) => { insertEmojiRef.current = fn; }}
              />
            </div>
          </LexicalComposer>
        </div>

        {/* Emoji Picker - Responsive positioning */}
        {showEmojiPicker && (
          <div className="fixed bottom-20 right-4 md:bottom-24 md:right-8 z-50 shadow-2xl rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden emoji-picker-react max-w-[90vw]">
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              autoFocusSearch={false}
              width={Math.min(350, window.innerWidth - 32)}
              height={Math.min(450, window.innerHeight - 200)}
            />
          </div>
        )}

        {/* File Preview Modal */}
        {showPreview && selectedFile && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={(e) => {
              // Close on backdrop click
              if (e.target === e.currentTarget && !uploading) {
                handleCancel();
              }
            }}
          >
            <div className="bg-white dark:bg-[#2c2c2e] rounded-lg shadow-xl w-full max-w-md mx-4">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upload File</h3>
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
                  <div className="text-3xl">{getFileIcon(selectedFile.name)}</div>
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
