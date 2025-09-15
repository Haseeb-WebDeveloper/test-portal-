'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Eye, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive,
  File,
  X,
  Plus,
  Upload
} from 'lucide-react';
import { formatFileSize, getFileType, isImageFile, isVideoFile, isAudioFile, isPdfFile } from '@/lib/utils';
import { FilePreview } from '@/components/ui/file-preview';

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

interface MediaGridProps {
  files: MediaFile[];
  onRemove?: (fileId: string) => void;
  onUpload?: (files: MediaFile[]) => void;
  canEdit?: boolean;
  maxFiles?: number;
}

const getFileIcon = (mimeType: string) => {
  if (isImageFile(mimeType)) return Image;
  if (isVideoFile(mimeType)) return Video;
  if (isAudioFile(mimeType)) return Music;
  if (isPdfFile(mimeType)) return FileText;
  if (mimeType.includes('zip') || mimeType.includes('rar')) return Archive;
  return File;
};

const getFileTypeColor = (mimeType: string) => {
  if (isImageFile(mimeType)) return 'bg-green-100 text-green-800';
  if (isVideoFile(mimeType)) return 'bg-blue-100 text-blue-800';
  if (isAudioFile(mimeType)) return 'bg-purple-100 text-purple-800';
  if (isPdfFile(mimeType)) return 'bg-red-100 text-red-800';
  if (mimeType.includes('document')) return 'bg-orange-100 text-orange-800';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'bg-yellow-100 text-yellow-800';
  return 'bg-gray-100 text-gray-800';
};

export function MediaGrid({ files, onRemove, onUpload, canEdit = false, maxFiles = 10 }: MediaGridProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const handleFileClick = (index: number) => {
    setPreviewIndex(index);
    setPreviewOpen(true);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length > 0 && onUpload) {
      // Upload files one by one to Cloudinary
      const uploadedFiles = [];
      
      for (const file of selectedFiles) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('folder', 'agency-portal/proposals');

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const data = await response.json();
            uploadedFiles.push({
              id: `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
              fileName: data.name,
              filePath: data.url,
              fileSize: data.size,
              mimeType: data.type,
              uploadedAt: new Date().toISOString(),
              uploadedBy: {
                name: 'Current User', // You might want to get this from context
                avatar: undefined
              }
            });
          } else {
            console.error('Failed to upload file:', file.name);
          }
        } catch (error) {
          console.error('Error uploading file:', file.name, error);
        }
      }

      if (uploadedFiles.length > 0 && onUpload) {
        onUpload(uploadedFiles);
      }
    }
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

  return (
    <>
      <div className="space-y-4">
        {/* Upload Section */}
        {canEdit && onUpload && files.length < maxFiles && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      Images, videos, documents, and more (max {maxFiles - files.length} files)
                    </p>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                  />
                </label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Files Grid */}
        {files.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file, index) => {
              const FileIcon = getFileIcon(file.mimeType);
              const isImage = isImageFile(file.mimeType);
              const isVideo = isVideoFile(file.mimeType);

              return (
                <Card key={file.id} className="group hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    {/* File Preview/Icon */}
                    <div className="relative mb-3">
                      <div
                        className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => handleFileClick(index)}
                      >
                        {isImage ? (
                          <img
                            src={file.filePath}
                            alt={file.fileName}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : isVideo ? (
                          <div className="relative w-full h-full">
                            <video
                              src={file.filePath}
                              className="w-full h-full object-cover rounded-lg"
                              muted
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-12 h-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                                <Video className="w-6 h-6 text-white" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <FileIcon className="w-12 h-12 text-gray-400" />
                        )}
                      </div>

                      {/* Remove Button */}
                      {canEdit && onRemove && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemove(file.id);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}

                      {/* File Type Badge */}
                      <Badge
                        className={`absolute bottom-2 left-2 text-xs ${getFileTypeColor(file.mimeType)}`}
                      >
                        {getFileType(file.mimeType)}
                      </Badge>
                    </div>

                    {/* File Info */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm line-clamp-2" title={file.fileName}>
                        {file.fileName}
                      </h4>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatFileSize(file.fileSize)}</span>
                        <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                      </div>
                      {file.uploadedBy && (
                        <p className="text-xs text-gray-500">
                          by {file.uploadedBy.name}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-1 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleFileClick(index)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(file)}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <File className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No files uploaded</h3>
              <p className="text-muted-foreground text-center">
                {canEdit ? 'Upload files to get started' : 'No media files available'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* File Preview Modal */}
      <FilePreview
        files={files}
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        currentIndex={previewIndex}
        onIndexChange={setPreviewIndex}
      />
    </>
  );
}
