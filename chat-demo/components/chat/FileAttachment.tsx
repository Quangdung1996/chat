'use client';

import { Download, File, FileText, FileSpreadsheet, FileImage, Video, Music } from 'lucide-react';

interface FileAttachmentProps {
  file: {
    _id?: string;
    name?: string;
    type?: string;
    size?: number;
    url?: string;
  };
  isCurrentUser?: boolean;
}

export default function FileAttachment({ file, isCurrentUser }: FileAttachmentProps) {
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type?: string) => {
    if (!type) return <File className="w-5 h-5" />;
    
    const mimeType = type.toLowerCase();
    
    if (mimeType.startsWith('image/')) {
      return <FileImage className="w-5 h-5" />;
    } else if (mimeType.startsWith('video/')) {
      return <Video className="w-5 h-5" />;
    } else if (mimeType.startsWith('audio/')) {
      return <Music className="w-5 h-5" />;
    } else if (mimeType.includes('pdf')) {
      return <FileText className="w-5 h-5" />;
    } else if (mimeType.includes('sheet') || mimeType.includes('excel')) {
      return <FileSpreadsheet className="w-5 h-5" />;
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return <FileText className="w-5 h-5" />;
    }
    
    return <File className="w-5 h-5" />;
  };

  const isImage = file.type?.startsWith('image/');
  
  // Construct full URL (assuming Rocket.Chat URL)
  const fileUrl = file.url?.startsWith('http') 
    ? file.url 
    : `http://localhost:3000${file.url}`; // Adjust base URL as needed

  return (
    <div className={`max-w-sm ${
      isCurrentUser 
        ? 'bg-[#4a4ec7] dark:bg-[#4a4ec7]' 
        : 'bg-white dark:bg-[#2c2c2e]'
    } rounded-lg overflow-hidden border ${
      isCurrentUser 
        ? 'border-[#5B5FC7]' 
        : 'border-gray-200 dark:border-gray-700'
    }`}>
      {/* Image Preview */}
      {isImage && file.url && (
        <div className="relative">
          <img 
            src={fileUrl} 
            alt={file.name || 'Image'} 
            className="w-full h-auto max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(fileUrl, '_blank')}
          />
        </div>
      )}
      
      {/* File Info */}
      <div className="flex items-center gap-3 p-3">
        <div className={`flex-shrink-0 ${
          isCurrentUser 
            ? 'text-white/80' 
            : 'text-gray-600 dark:text-gray-400'
        }`}>
          {getFileIcon(file.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${
            isCurrentUser 
              ? 'text-white' 
              : 'text-gray-900 dark:text-white'
          }`}>
            {file.name || 'Unknown file'}
          </p>
          <p className={`text-xs ${
            isCurrentUser 
              ? 'text-white/60' 
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            {formatFileSize(file.size)}
          </p>
        </div>
        
        {/* Download Button */}
        {file.url && (
          <a
            href={fileUrl}
            download={file.name}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-shrink-0 p-2 rounded-full transition-colors ${
              isCurrentUser
                ? 'hover:bg-white/10 text-white'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
            title="Download"
          >
            <Download className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}

