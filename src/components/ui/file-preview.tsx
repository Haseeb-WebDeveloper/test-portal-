"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Download,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  File,
} from "lucide-react";

// Accept both "image" and "image/*" as image types
function isImageMimeType(mimeType: string) {
  return mimeType === "image" || mimeType.startsWith("image/");
}
function isVideoMimeType(mimeType: string) {
  return mimeType === "video" || mimeType.startsWith("video/");
}
function isAudioMimeType(mimeType: string) {
  return mimeType === "audio" || mimeType.startsWith("audio/");
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

interface FilePreviewProps {
  files: MediaFile[];
  isOpen: boolean;
  onClose: () => void;
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
}

const getFileIcon = (mimeType: string) => {
  if (isImageMimeType(mimeType)) return Image;
  if (isVideoMimeType(mimeType)) return Video;
  if (isAudioMimeType(mimeType)) return Music;
  if (mimeType.includes("pdf") || mimeType.includes("document"))
    return FileText;
  if (mimeType.includes("zip") || mimeType.includes("rar")) return Archive;
  return File;
};

const getFileTypeColor = (mimeType: string) => {
  if (isImageMimeType(mimeType)) return "bg-green-100 text-green-800";
  if (isVideoMimeType(mimeType)) return "bg-blue-100 text-blue-800";
  if (isAudioMimeType(mimeType)) return "bg-purple-100 text-purple-800";
  if (mimeType.includes("pdf")) return "bg-red-100 text-red-800";
  if (mimeType.includes("document")) return "bg-orange-100 text-orange-800";
  if (mimeType.includes("zip") || mimeType.includes("rar"))
    return "bg-yellow-100 text-yellow-800";
  return "bg-gray-100 text-gray-800";
};

export function FilePreview({
  files,
  isOpen,
  onClose,
  currentIndex = 0,
  onIndexChange,
}: FilePreviewProps) {
  const [activeIndex, setActiveIndex] = useState(currentIndex);

  // Keep activeIndex in sync with currentIndex prop
  useEffect(() => {
    setActiveIndex(currentIndex);
  }, [currentIndex, isOpen]);

  const handleIndexChange = (index: number) => {
    setActiveIndex(index);
    onIndexChange?.(index);
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
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex flex-col h-[70vh]">
          {/* File Content */}
          <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
            {isImageMimeType(currentFile.mimeType) ? (
              <img
                src={currentFile.filePath}
                alt={currentFile.fileName}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                onError={e => {
                  (e.target as HTMLImageElement).src =
                    "https://via.placeholder.com/300x200?text=Image+not+found";
                }}
              />
            ) : isVideoMimeType(currentFile.mimeType) ? (
              <video
                src={currentFile.filePath}
                controls
                className="max-w-full max-h-full rounded-lg shadow-lg"
              >
                Your browser does not support the video tag.
              </video>
            ) : isAudioMimeType(currentFile.mimeType) ? (
              <div className="text-center">
                <Music className="h-16 w-16 mx-auto mb-4 " />
                <audio
                  src={currentFile.filePath}
                  controls
                  className="w-full max-w-md"
                >
                  Your browser does not support the audio tag.
                </audio>
              </div>
            ) : (
              <div className="text-center">
                <FileIcon className="h-16 w-16 mx-auto mb-4 " />
                <p className=" mb-4">
                  Preview not available for this file type
                </p>
                <Button onClick={() => handleDownload(currentFile)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download to View
                </Button>
              </div>
            )}
          </div>

          {/* Navigation and Controls */}
          <div className="p-6 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={files.length <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm ">
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}