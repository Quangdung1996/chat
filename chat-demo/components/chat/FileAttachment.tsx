'use client';

import { Download, File, FileText, FileSpreadsheet, FileImage, Video, Music } from 'lucide-react';

interface FileAttachmentProps {
  file: {
    _id?: string;
    name?: string;
    type?: string;
    size?: number;
    url?: string;
    format?: string; // Base64 preview for images
  };
  attachment?: {
    image_preview?: string; // Base64 thumbnail
    image_url?: string; // Full image URL
    image_type?: string;
    title_link?: string; // Download link
    image_dimensions?: {
      width: number;
      height: number;
    };
  };
  isCurrentUser?: boolean;
}

export default function FileAttachment({ file, attachment, isCurrentUser }: FileAttachmentProps) {
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

  // Check if it's an image from multiple sources
  const isImage = attachment?.image_type?.startsWith('image/') || file.type?.startsWith('image/');
  
  // Priority: attachment.image_preview > file.format > attachment.image_url > file.url
  const rocketChatBaseUrl = process.env.NEXT_PUBLIC_ROCKETCHAT_URL || 'http://localhost:3000';
  
  const imagePreview = attachment?.image_preview 
    ? `data:image/jpeg;base64,${attachment.image_preview}`
    : file.format 
    ? `data:image/png;base64,${file.format}` 
    : attachment?.image_url?.startsWith('http')
    ? attachment.image_url
    : attachment?.image_url
    ? `${rocketChatBaseUrl}${attachment.image_url}`
    : file.url;
  
  const downloadUrl = attachment?.title_link?.startsWith('http')
    ? attachment.title_link
    : attachment?.title_link
    ? `${rocketChatBaseUrl}${attachment.title_link}`
    : file.url;

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
      {isImage && imagePreview && (
        <div className="relative">
          <img 
            src={imagePreview} 
            alt={file.name || 'Image'} 
            className="w-full h-auto max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => downloadUrl && window.open(downloadUrl, '_blank')}
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
        {downloadUrl && (
          <a
            href={downloadUrl}
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

