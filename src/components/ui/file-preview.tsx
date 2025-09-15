'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  X, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive,
  File,
  Eye,
  Calendar,
  User
} from 'lucide-react';
import { formatFileSize, getFileType } from '@/lib/utils';

interface MediaFile {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy?: {
    name: string;
    avatar?: string;
  };
}

interface FilePreviewProps {
  files: MediaFile[];
  isOpen: boolean;
  onClose: () => void;
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.startsWith('video/')) return Video;
  if (mimeType.startsWith('audio/')) return Music;
  if (mimeType.includes('pdf') || mimeType.includes('document')) return FileText;
  if (mimeType.includes('zip') || mimeType.includes('rar')) return Archive;
  return File;
};

const getFileTypeColor = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return 'bg-green-100 text-green-800';
  if (mimeType.startsWith('video/')) return 'bg-blue-100 text-blue-800';
  if (mimeType.startsWith('audio/')) return 'bg-purple-100 text-purple-800';
  if (mimeType.includes('pdf')) return 'bg-red-100 text-red-800';
  if (mimeType.includes('document')) return 'bg-orange-100 text-orange-800';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'bg-yellow-100 text-yellow-800';
  return 'bg-gray-100 text-gray-800';
};

export function FilePreview({ files, isOpen, onClose, currentIndex = 0, onIndexChange }: FilePreviewProps) {
  const [activeIndex, setActiveIndex] = useState(currentIndex);

  const handleIndexChange = (index: number) => {
    setActiveIndex(index);
    onIndexChange?.(index);
  };

  const handleDownload = (file: MediaFile) => {
    const link = document.createElement('a');
    link.href = file.filePath;
    link.download = file.fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrevious = () => {
    const newIndex = activeIndex > 0 ? activeIndex - 1 : files.length - 1;
    handleIndexChange(newIndex);
  };

  const handleNext = () => {
    const newIndex = activeIndex < files.length - 1 ? activeIndex + 1 : 0;
    handleIndexChange(newIndex);
  };

  if (!files.length) return null;

  const currentFile = files[activeIndex];
  const FileIcon = getFileIcon(currentFile.mimeType);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileIcon className="h-5 w-5" />
              {currentFile.fileName}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge className={getFileTypeColor(currentFile.mimeType)}>
                {getFileType(currentFile.mimeType)}
              </Badge>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col h-[70vh]">
          {/* File Content */}
          <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
            {currentFile.mimeType.startsWith('image/') ? (
              <img
                src={currentFile.filePath}
                alt={currentFile.fileName}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            ) : currentFile.mimeType.startsWith('video/') ? (
              <video
                src={currentFile.filePath}
                controls
                className="max-w-full max-h-full rounded-lg shadow-lg"
              >
                Your browser does not support the video tag.
              </video>
            ) : currentFile.mimeType.startsWith('audio/') ? (
              <div className="text-center">
                <Music className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <audio src={currentFile.filePath} controls className="w-full max-w-md">
                  Your browser does not support the audio tag.
                </audio>
              </div>
            ) : (
              <div className="text-center">
                <FileIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                <Button onClick={() => handleDownload(currentFile)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download to View
                </Button>
              </div>
            )}
          </div>

          {/* Navigation and Controls */}
          <div className="p-6 border-t bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={files.length <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  {activeIndex + 1} of {files.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={files.length <= 1}
                >
                  Next
                </Button>
              </div>
              <Button onClick={() => handleDownload(currentFile)}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>

            {/* File Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Size:</span>
                <p className="font-medium">{formatFileSize(currentFile.fileSize)}</p>
              </div>
              <div>
                <span className="text-gray-500">Type:</span>
                <p className="font-medium">{getFileType(currentFile.mimeType)}</p>
              </div>
              <div>
                <span className="text-gray-500">Uploaded:</span>
                <p className="font-medium">
                  {new Date(currentFile.uploadedAt).toLocaleDateString()}
                </p>
              </div>
              {currentFile.uploadedBy && (
                <div>
                  <span className="text-gray-500">By:</span>
                  <p className="font-medium">{currentFile.uploadedBy.name}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
