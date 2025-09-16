"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Paperclip,
  MessageCircle,
  FileText,
  X,
  Download,
  Eye,
  Image,
  Video,
  Music,
  Archive,
  File,
} from "lucide-react";
import { ContractStatus } from "@/types/enums";
import { FilePreview } from "@/components/ui/file-preview";

interface Contract {
  id: string;
  title: string;
  description: string | null;
  status: ContractStatus;
  progressPercentage: number;
  tags: string[];
  startDate: string | null;
  endDate: string | null;
  media: any; // JSON field containing media files
}

interface ContractDetailModalProps {
  contract: Contract | null;
  isOpen: boolean;
  onClose: () => void;
  onMessage: (contract: Contract) => void;
}

const statusColors = {
  DRAFT: "bg-gray-100 text-gray-800",
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
  ACTIVE: "bg-green-100 text-green-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  TERMINATED: "bg-red-100 text-red-800",
  EXPIRED: "bg-orange-100 text-orange-800",
};

const statusLabels = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Review",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  TERMINATED: "Terminated",
  EXPIRED: "Expired",
};

export function ContractDetailModal({
  contract,
  isOpen,
  onClose,
  onMessage,
}: ContractDetailModalProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  if (!contract) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType && mimeType.startsWith("image/")) return Image;
    if (mimeType && mimeType.startsWith("video/")) return Video;
    if (mimeType && mimeType.startsWith("audio/")) return Music;
    if (mimeType && (mimeType.includes("pdf") || mimeType.includes("document")))
      return FileText;
    if (mimeType && (mimeType.includes("zip") || mimeType.includes("rar")))
      return Archive;
    return File;
  };

  // Fix: treat "image" as image/* for legacy/incorrect mimeType
  // Also, treat as image if filePath ends with image extension
  const isImageMimeType = (mimeType: string, filePath?: string) => {
    if (!mimeType && !filePath) return false;
    if (mimeType === "image" || (mimeType && mimeType.startsWith("image/")))
      return true;
    // Check filePath extension for image
    if (filePath) {
      const ext = filePath.split(".").pop()?.toLowerCase();
      if (
        ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(ext || "")
      ) {
        return true;
      }
    }
    return false;
  };

  const isVideoMimeType = (mimeType: string, filePath?: string) => {
    if (!mimeType && !filePath) return false;
    if (mimeType === "video" || (mimeType && mimeType.startsWith("video/")))
      return true;
    if (filePath) {
      const ext = filePath.split(".").pop()?.toLowerCase();
      if (["mp4", "mov", "avi", "webm", "mkv"].includes(ext || "")) {
        return true;
      }
    }
    return false;
  };

  const isAudioMimeType = (mimeType: string, filePath?: string) => {
    if (!mimeType && !filePath) return false;
    if (mimeType === "audio" || (mimeType && mimeType.startsWith("audio/")))
      return true;
    if (filePath) {
      const ext = filePath.split(".").pop()?.toLowerCase();
      if (["mp3", "wav", "ogg", "aac", "flac"].includes(ext || "")) {
        return true;
      }
    }
    return false;
  };

  const handleFileClick = (index: number) => {
    setPreviewIndex(index);
    setPreviewOpen(true);
  };

  const handleDownload = (file: any) => {
    const link = document.createElement("a");
    link.href = file.filePath || file.fileUrl || file.url;
    link.download = file.fileName || file.name || "download";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Convert media files to FilePreview format
  // Fix: If mimeType is "image", treat as "image/*" and ensure filePath is present
  // Also, if filePath ends with .pdf, treat as pdf, not image
  const mediaFiles =
    contract.media && Array.isArray(contract.media)
      ? contract.media.map((file: any, index: number) => {
          // If mimeType is "image", treat as "image/jpeg" for browser compatibility
          let mimeType =
            file.fileType || file.mimeType || "application/octet-stream";
          let filePath = file.filePath || file.fileUrl || file.url;
          // If filePath is missing but fileName looks like a path, use it
          if (!filePath && file.fileName && file.fileName.includes("/")) {
            filePath = file.fileName;
          }
          // If filePath ends with .pdf, force mimeType to application/pdf
          if (filePath && filePath.toLowerCase().endsWith(".pdf")) {
            mimeType = "application/pdf";
          } else if (mimeType === "image") {
            // Only treat as image/jpeg if not a pdf
            mimeType = "image/jpeg";
          } else if (mimeType === "video") {
            mimeType = "video/mp4";
          } else if (mimeType === "audio") {
            mimeType = "audio/mpeg";
          }
          return {
            id: file.id || index.toString(),
            fileName: file.fileName || file.name || "Unknown file",
            filePath,
            fileSize: file.fileSize || file.size || 0,
            mimeType,
            uploadedAt: file.uploadedAt || new Date().toISOString(),
            uploadedBy: file.uploadedBy || { name: "Unknown" },
          };
        })
      : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#18132A]">
        <DialogHeader className="space-y-2">
          <p className="text-2xl font-bold mt-3">{contract.title}</p>
          {contract.description && (
            <p className="figma-paragraph leading-relaxed">
              {contract.description}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Tags */}
          {contract.tags.length > 0 && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {contract.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-sm rounded-md font-light px-2.5 py-1 bg-transparent border border-foreground/70"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Progress */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-300">Progress</h4>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-600 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${contract.progressPercentage}%` }}
                />
              </div>
              <span className=" font-medium text-sm">
                {contract.progressPercentage}%
              </span>
            </div>
          </div>

          {/* Media Files */}
          <div className="space-y-2">
            <h4 className="figma-paragraph-bold">Attached Files</h4>
            {mediaFiles.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {mediaFiles.map((file, index) => {
                  const FileIcon = getFileIcon(file.mimeType);
                  const isImage = isImageMimeType(file.mimeType, file.filePath);
                  const isVideo = isVideoMimeType(file.mimeType, file.filePath);

                  // If filePath ends with .pdf, never treat as image
                  const isPdf =
                    file.filePath &&
                    file.filePath.toLowerCase().endsWith(".pdf");

                  return (
                    <div
                      key={file.id}
                      className="group relative bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors cursor-pointer"
                      onClick={() => handleFileClick(index)}
                    >
                      {/* File Preview */}
                      <div className="aspect-square flex items-center justify-center p-4">
                        {isImage && file.filePath && !isPdf ? (
                          <img
                            src={file.filePath}
                            alt={file.fileName}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                              (
                                e.target as HTMLImageElement
                              ).nextElementSibling?.classList.remove("hidden");
                            }}
                          />
                        ) : isVideo && file.filePath ? (
                          <video
                            src={file.filePath}
                            className="w-full h-full object-cover rounded-lg"
                            muted
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center p-4">
                            <FileIcon className="h-8 w-8 mb-2" />
                            <span className="text-xs text-center px-4 truncate">
                              {file.fileName.length > 30 ? file.fileName.substring(0, 30) + "..." : file.fileName}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* File Info Overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover: hover:bg-white/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFileClick(index);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover: hover:bg-white/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(file);
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No media files attached</p>
              </div>
            )}
          </div>

          {/* Discussion Rooms */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-300">
              Discussion Rooms
            </h4>
            <div className="text-center py-8 text-gray-400">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No discussion rooms available</p>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4 border-t border-gray-700">
            <div className="text-center">
              <p className="text-sm mb-4">Interested in this contract?</p>
              <Button
                onClick={() => onMessage(contract)}
                className="bg-purple-600 hover:bg-purple-700 px-6 py-2"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Message us
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* File Preview Modal */}
      <FilePreview
        files={mediaFiles}
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        currentIndex={previewIndex}
        onIndexChange={setPreviewIndex}
      />
    </Dialog>
  );
}
