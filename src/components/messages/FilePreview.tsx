"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageAttachment } from "@/types/messages";
import {
  Download,
  Eye,
  File,
  Image as ImageIcon,
  Video,
  FileText,
  X,
  Maximize2,
} from "lucide-react";


interface FilePreviewProps {
  attachment: MessageAttachment;
  className?: string;
}

export default function FilePreview({ attachment, className = "" }: FilePreviewProps) {
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <ImageIcon className="w-5 h-5" />;
    if (mimeType.startsWith("video/")) return <Video className="w-5 h-5" />;
    if (mimeType === "application/pdf") return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = attachment.filePath;
    link.download = attachment.fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isImage = attachment.mimeType.startsWith("image/");
  const isVideo = attachment.mimeType.startsWith("video/");
  const isPdf = attachment.mimeType === "application/pdf";

  return (
    <>
      <div className={`${className}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 pt-6">
            {isImage ? (
              <div className="relative min-w-60 h-full rounded-lg overflow-hidden cursor-pointer group">
                <img
                  src={attachment.filePath}
                  alt={attachment.fileName}
                  width={160}
                  height={160}
                  className="object-cover min-w-60 h-full group-hover:scale-105 transition-transform"
                  onClick={() => setIsFullscreenOpen(true)}
                  style={{ display: "block" }}
                  loading="lazy"
                />
               
              </div>
            ) : (
              <div className="w-16 h-16  rounded-lg flex items-center justify-center">
                {getFileIcon(attachment.mimeType)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {(isImage || isVideo || isPdf) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFullscreenOpen(true)}
                    className="h-6 w-6 p-0"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="h-6 w-6 p-0"
                >
                  <Download className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <p className="text-xs mt-1">{formatFileSize(attachment.fileSize)}</p>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      <Dialog open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="truncate">{attachment.fileName}</DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFullscreenOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 p-4 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            {isImage ? (
              <div className="relative w-full h-full max-h-[70vh] flex items-center justify-center">
                <img
                  src={attachment.filePath}
                  alt={attachment.fileName}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "70vh",
                    objectFit: "contain",
                    display: "block",
                    margin: "0 auto",
                  }}
                  loading="lazy"
                />
              </div>
            ) : isVideo ? (
              <video
                src={attachment.filePath}
                controls
                className="max-w-full max-h-[70vh]"
              >
                Your browser does not support the video tag.
              </video>
            ) : isPdf ? (
              <iframe
                src={attachment.filePath}
                className="w-full h-[70vh] border-0"
                title={attachment.fileName}
              />
            ) : (
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4">
                  {getFileIcon(attachment.mimeType)}
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Preview not available for this file type
                </p>
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  className="mt-4"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download to view
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
