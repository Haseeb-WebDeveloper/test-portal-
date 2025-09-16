import { useState, useCallback } from 'react';

interface UploadFile {
  url: string;
  type: string;
  name: string;
  size: number;
}

interface UseAvatarUploadOptions {
  folder?: string;
  onSuccess?: (file: UploadFile) => void;
  onError?: (error: string) => void;
}

export function useAvatarUpload({
  folder = 'agency-portal/avatars',
  onSuccess,
  onError,
}: UseAvatarUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadFile | null>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      const error = 'Please select a valid image file';
      onError?.(error);
      throw new Error(error);
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      const error = 'File size must be less than 5MB';
      onError?.(error);
      throw new Error(error);
    }

    setIsUploading(true);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const result = await response.json();
      const uploadedFileData: UploadFile = {
        url: result.url,
        type: file.type,
        name: file.name,
        size: file.size,
      };

      setUploadedFile(uploadedFileData);
      onSuccess?.(uploadedFileData);
      
      return uploadedFileData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onError?.(errorMessage);
      setPreviewUrl(null);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [onSuccess, onError]);

  const clearFile = useCallback(() => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setUploadedFile(null);
  }, [previewUrl]);

  const setInitialFile = useCallback((file: UploadFile) => {
    setPreviewUrl(file.url);
    setUploadedFile(file);
  }, []);

  return {
    uploadFile,
    clearFile,
    isUploading,
    previewUrl,
    uploadedFile,
    setInitialFile,
  };
}
