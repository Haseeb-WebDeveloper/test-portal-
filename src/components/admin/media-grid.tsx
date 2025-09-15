"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Upload,
} from "lucide-react";
import {
  getFileType,
  isImageFile,
  isVideoFile,
  isAudioFile,
  isPdfFile,
} from "@/lib/utils";
import { FilePreview } from "@/components/ui/file-preview";

// Fix: Accept both "image" and "image/*" as image types
function isImageMimeType(mimeType: string) {
  // Accepts "image", "image/png", "image/jpeg", etc.
  return (
    mimeType === "image" ||
    mimeType.startsWith("image/")
  );
}

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
  if (isImageMimeType(mimeType)) return Image;
  if (isVideoFile(mimeType)) return Video;
  if (isAudioFile(mimeType)) return Music;
  if (isPdfFile(mimeType)) return FileText;
  if (mimeType.includes("zip") || mimeType.includes("rar")) return Archive;
  return File;
};

const getFileTypeColor = (mimeType: string) => {
  if (isImageMimeType(mimeType)) return "bg-green-100 text-green-800";
  if (isVideoFile(mimeType)) return "bg-blue-100 text-blue-800";
  if (isAudioFile(mimeType)) return "bg-purple-100 text-purple-800";
  if (isPdfFile(mimeType)) return "bg-red-100 text-red-800";
  if (mimeType.includes("document")) return "bg-orange-100 text-orange-800";
  if (mimeType.includes("zip") || mimeType.includes("rar"))
    return "bg-yellow-100 text-yellow-800";
  return "bg-gray-100 text-gray-800";
};

export function MediaGrid({
  files,
  onRemove,
  onUpload,
  canEdit = false,
  maxFiles = 10,
}: MediaGridProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileClick = (index: number) => {
    setPreviewIndex(index);
    setPreviewOpen(true);
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length > 0 && onUpload) {
      const uploadedFiles = [];
      setIsUploading(true);

      for (const file of selectedFiles) {
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("folder", "agency-portal/proposals");

          const response = await fetch("/api/upload", {
            method: "POST",
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
                name: "Current User",
                avatar: undefined,
              },
            });
          }
        } catch (error) {
          // Optionally handle error
        }
      }

      if (uploadedFiles.length > 0 && onUpload) {
        onUpload(uploadedFiles);
      }
      setIsUploading(false);
    }
  };

  const handleDownload = (file: MediaFile) => {
    const link = document.createElement("a");
    link.href = file.filePath;
    link.download = file.fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="space-y-4">
        {canEdit && onUpload && files.length < maxFiles && (
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center w-full h-40 border border-dashed rounded-xl cursor-pointer bg-muted/30 hover:bg-muted/40 transition-colors"
            >
              <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="pointer-events-none"
              >
                {isUploading ? "Uploading…" : "Choose Files"}
              </Button>
              <p className="mt-1 text-xs text-muted-foreground">
                Max {maxFiles - files.length} files.
              </p>
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
        )}

        {files.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file, index) => {
              const FileIcon = getFileIcon(file.mimeType);
              // Use our fixed image type check
              const isImage = isImageMimeType(file.mimeType);
              const isVideo = isVideoFile(file.mimeType);

              // console.log(file);

              return (
                <Card key={file.id} className="group">
                  <CardContent className="p-3">
                    <div className="relative mb-2">
                      <div
                        className="aspect-square rounded-lg flex items-center justify-center cursor-pointer overflow-hidden"
                        onClick={() => handleFileClick(index)}
                      >
                        {isImage ? (
                          <img
                            src={file.filePath}
                            alt={file.fileName}
                            className="w-full h-full object-cover rounded-lg"
                            style={{ objectFit: "cover", width: "100%", height: "100%" }}
                            onError={e => {
                              (e.target as HTMLImageElement).src =
                                "https://via.placeholder.com/150?text=Image+not+found";
                            }}
                          />
                        ) : isVideo ? (
                          <video
                            src={file.filePath}
                            className="w-full h-full object-cover rounded-lg"
                            muted
                          />
                        ) : (
                          <FileIcon className="w-10 h-10 text-gray-400" />
                        )}
                      </div>
                      {canEdit && onRemove && (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                          onClick={e => {
                            e.stopPropagation();
                            onRemove(file.id);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                      <Badge
                        className={`absolute bottom-2 left-2 text-xs ${getFileTypeColor(
                          file.mimeType
                        )}`}
                      >
                        {getFileType(file.mimeType)}
                      </Badge>
                    </div>
                    <div className="flex gap-1 mt-2">
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
          !canEdit && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <File className="w-10 h-10 text-gray-400 mb-3" />
                <h3 className="text-base font-semibold mb-1">
                  No files uploaded
                </h3>
                <p className="text-muted-foreground text-center text-sm">
                  No media files available
                </p>
              </CardContent>
            </Card>
          )
        )}
      </div>
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
