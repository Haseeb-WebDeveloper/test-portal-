"use client";
import React, { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useUser } from "@/store/user";
import { supabaseBrowser } from "@/utils/supabase/browser";
import { IMessage, MessageType, MessageAttachment, ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from "@/types/messages";
import { useMessage } from "@/store/messages";
import { Send, Paperclip } from "lucide-react";

export default function ChatInput() {
  const user = useUser((state) => state.user);
  const addMessage = useMessage((state) => state.addMessage);
  const setOptimisticIds = useMessage((state) => state.setOptimisticIds);
  const currentRoom = useMessage((state) => state.currentRoom);
  const supabase = supabaseBrowser();
  
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validate files
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach((file) => {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        errors.push(`${file.name}: File type not allowed`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File too large (max ${MAX_FILE_SIZE / (1024 * 1024)}MB)`);
        return;
      }
      validFiles.push(file);
    });

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
    }

    if (validFiles.length > 0) {
      setIsUploading(true);
      try {
        // Upload files to Cloudinary
        const uploadPromises = validFiles.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('folder', 'agency-portal/chat-files');

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Upload failed');
          }

          return await response.json();
        });

        const results = await Promise.all(uploadPromises);
        
        // Create message attachments
        const messageAttachments: MessageAttachment[] = results.map(result => ({
          id: uuidv4(),
          messageId: "", // Will be set when message is created
          fileName: result.name || "Unknown file",
          filePath: result.url,
          fileSize: result.size || 0,
          mimeType: getMimeTypeFromFile(result.type),
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
        
        setAttachments(prev => [...prev, ...messageAttachments]);
        toast.success(`${results.length} file(s) uploaded successfully`);
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Upload failed: ${(error as Error).message}`);
      } finally {
        setIsUploading(false);
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getMimeTypeFromFile = (type: string): string => {
    if (type === 'image') return 'image/jpeg';
    if (type === 'video') return 'video/mp4';
    if (type === 'pdf') return 'application/pdf';
    if (type === 'document') return 'application/msword';
    return 'application/octet-stream';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if (!currentRoom) {
      toast.error("Please select a room first");
      return;
    }

    if (!message.trim() && attachments.length === 0) {
      toast.error("Message cannot be empty");
      return;
    }

    const id = uuidv4();
    const messageType = attachments.length > 0 ? MessageType.FILE : MessageType.TEXT;
    
    const newMessage = {
      id,
      roomId: currentRoom.id,
      userId: user?.id!,
      content: message.trim() || undefined,
      messageType,
      isEdited: false,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: user!,
      attachments: attachments,
    };
    
    addMessage(newMessage as IMessage);
    setOptimisticIds(newMessage.id);

    try {
      // Insert message
      const { data: messageData, error: messageError } = await supabase
        .from("messages")
        .insert({
          id,
          roomId: currentRoom.id,
          userId: user?.id!,
          content: message.trim() || null,
          messageType,
          isEdited: false,
          isDeleted: false,
          createdBy: user?.id,
          updatedBy: user?.id,
          updatedAt: new Date().toISOString(),
        })
        .select();

      if (messageError) {
        throw messageError;
      }

      // Insert attachments if any
      if (attachments.length > 0) {
        const attachmentInserts = attachments.map(attachment => ({
          id: attachment.id,
          messageId: id,
          fileName: attachment.fileName,
          filePath: attachment.filePath,
          fileSize: attachment.fileSize,
          mimeType: attachment.mimeType,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));

        const { error: attachmentError } = await supabase
          .from("message_attachments")
          .insert(attachmentInserts);

        if (attachmentError) {
          console.error("Attachment insert error:", attachmentError);
          toast.error("Message sent but attachments failed to save");
        }
      }

      // Clear form
      setMessage("");
      setAttachments([]);
      
      // Update room's lastMessageAt
      const nowIso = new Date().toISOString();
      const { error: roomUpdateError } = await supabase
        .from("rooms")
        .update({ lastMessageAt: nowIso, updatedAt: nowIso, updatedBy: user?.id || null })
        .eq("id", currentRoom.id);
      
      if (roomUpdateError) {
        console.error("Failed to update room lastMessageAt:", roomUpdateError);
      }
      
    } catch (error) {
      console.error("Message insert error:", error);
      toast.error(`Failed to send message: ${(error as Error).message}`);
    }
  };

  return (
    <div className="p-5">
      {/* Selected Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-3 space-y-2">
          <div className="text-sm text-gray-400">
            Attached files ({attachments.length}):
          </div>
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-lg text-sm"
              >
                <span className="truncate max-w-32">{attachment.fileName}</span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="text-gray-400 hover:text-red-400"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="pr-12"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
          >
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Paperclip className="w-4 h-4" />
            )}
          </Button>
        </div>
        <Button
          onClick={handleSendMessage}
          disabled={(!message.trim() && attachments.length === 0) || isUploading}
          className="px-3"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {/* Hidden file input */}
      <Input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ALLOWED_FILE_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
