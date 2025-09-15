"use client";
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  label?: string;
  placeholder?: string;
}

export default function FileUpload({
  value,
  onChange,
  accept = "image/*",
  maxSize = 5,
  className = "",
  label = "Upload File",
  placeholder = "Click to upload or drag and drop",
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    // Validate file type
    if (accept && !file.type.match(accept.replace("*", ".*"))) {
      toast.error("Invalid file type. Please select a valid image.");
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSize}MB`);
      return;
    }

    setUploading(true);

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Upload to server
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Upload failed");
      }

      // Clean up preview URL
      URL.revokeObjectURL(previewUrl);
      
      // Set the uploaded URL
      setPreview(result.url);
      onChange(result.url);
      
      toast.success("File uploaded successfully!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload file");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label>{label}</Label>}
      
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          preview
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />

        {preview ? (
          <div className="space-y-4">
            <div className="relative inline-block">
              <img
                src={preview}
                alt="Preview"
                className="w-24 h-24 object-cover rounded-lg mx-auto"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                onClick={handleRemove}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-sm text-gray-600">Click to change image</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              {uploading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              ) : (
                <ImageIcon className="h-6 w-6 text-gray-400" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">{placeholder}</p>
              <p className="text-xs text-gray-500 mt-1">
                Max size: {maxSize}MB
              </p>
            </div>
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          onClick={handleClick}
          disabled={uploading}
          className="mt-4"
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? "Uploading..." : preview ? "Change Image" : "Select Image"}
        </Button>
      </div>
    </div>
  );
}
