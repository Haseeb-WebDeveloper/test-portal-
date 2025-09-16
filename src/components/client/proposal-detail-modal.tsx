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
import { ProposalStatus } from "@/types/enums";
import { FilePreview } from "@/components/ui/file-preview";

interface Proposal {
  id: string;
  title: string;
  description: string | null;
  status: ProposalStatus;
  tags: string[];
  createdAt: string;
  media: any; // JSON field containing media files
}

interface ProposalDetailModalProps {
  proposal: Proposal | null;
  isOpen: boolean;
  onClose: () => void;
  onMessage: (proposal: Proposal) => void;
}

const statusColors = {
  DRAFT: "bg-gray-100 text-gray-800",
  SENT: "bg-blue-100 text-blue-800",
  SEEN: "bg-yellow-100 text-yellow-800",
  ACCEPTED: "bg-green-100 text-green-800",
  DECLINED: "bg-red-100 text-red-800",
  EXPIRED: "bg-orange-100 text-orange-800",
  WITHDRAWN: "bg-purple-100 text-purple-800",
};

const statusLabels = {
  DRAFT: "Draft",
  SENT: "Sent",
  SEEN: "Seen",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  EXPIRED: "Expired",
  WITHDRAWN: "Withdrawn",
};

export function ProposalDetailModal({
  proposal,
  isOpen,
  onClose,
  onMessage,
}: ProposalDetailModalProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  if (!proposal) return null;

  const formatDate = (dateString: string) => {
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
  const isImageMimeType = (mimeType: string) => {
    if (!mimeType) return false;
    return mimeType === "image" || mimeType.startsWith("image/");
  };

  const isVideoMimeType = (mimeType: string) => {
    if (!mimeType) return false;
    return mimeType === "video" || mimeType.startsWith("video/");
  };

  const isAudioMimeType = (mimeType: string) => {
    if (!mimeType) return false;
    return mimeType === "audio" || mimeType.startsWith("audio/");
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
  const mediaFiles =
    proposal.media && Array.isArray(proposal.media)
      ? proposal.media.map((file: any, index: number) => {
          // If mimeType is "image", treat as "image/jpeg" for browser compatibility
          let mimeType =
            file.fileType || file.mimeType || "application/octet-stream";
          if (mimeType === "image") mimeType = "image/jpeg";
          if (mimeType === "video") mimeType = "video/mp4";
          if (mimeType === "audio") mimeType = "audio/mpeg";
          // Try to get a usable filePath
          let filePath = file.filePath || file.fileUrl || file.url;
          // If filePath is missing but fileName looks like a path, use it
          if (!filePath && file.fileName && file.fileName.includes("/")) {
            filePath = file.fileName;
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
          <p className="text-2xl font-bold mt-3">{proposal.title}</p>
          {proposal.description && (
            <p className="figma-paragraph leading-relaxed">
              {proposal.description}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Tags */}
          {proposal.tags.length > 0 && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {proposal.tags.map((tag, index) => (
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

          {/* Media Files */}
          <div className="space-y-2">
            <h4 className="figma-paragraph-bold">Attached Files</h4>
            {mediaFiles.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {mediaFiles.map((file, index) => {
                  const FileIcon = getFileIcon(file.mimeType);
                  const isImage = isImageMimeType(file.mimeType);
                  const isVideo = isVideoMimeType(file.mimeType);

                  // Only show <img> if filePath is present and isImage
                  return (
                    <div
                      key={file.id}
                      className="group relativerounded-lg overflow-hidden transition-colors cursor-pointer"
                      onClick={() => handleFileClick(index)}
                    >
                      {/* File Preview */}
                      <div className="aspect-square flex items-center justify-center border border-foreground/70 rounded-lg">
                        {isImage && file.filePath ? (
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
                          <div className="flex flex-col items-center justify-center">
                            <FileIcon className="h-8 w-8 mb-2" />
                            <span className="text-xs text-center px-4 truncate">
                              {file.fileName.length > 30 ? file.fileName.substring(0, 30) + "..." : file.fileName}
                            </span>
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 ">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No media files attached</p>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="pt-4 border-t border-gray-700">
            <div className="text-center">
              <p className="text-sm  mb-4">Interested in this offer?</p>
              <Button
                onClick={() => onMessage(proposal)}
                className="bg-purple-600 hover:bg-purple-700  px-6 py-2"
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
