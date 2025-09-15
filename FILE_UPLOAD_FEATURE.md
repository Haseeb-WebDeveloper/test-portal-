# File Upload Feature for Chat System

## Overview
The chat system now supports file uploads with Cloudinary integration. Users can send files with or without text messages, and files are displayed with preview and download options.

## Features

### 1. File Upload Support
- **Supported File Types**: Images (JPEG, PNG, GIF, WebP), Videos (MP4, QuickTime), Documents (PDF, Word, Excel, PowerPoint), Archives (ZIP, RAR), Audio (MP3, WAV), and more
- **File Size Limit**: 10MB maximum per file
- **Multiple Files**: Users can attach multiple files to a single message
- **Cloud Storage**: Files are stored securely on Cloudinary

### 2. File Preview & Display
- **Image Preview**: Thumbnail preview with hover effects
- **Video Preview**: Video player with controls
- **PDF Preview**: Inline PDF viewer
- **Document Icons**: Appropriate icons for different file types
- **File Information**: File name, size, and type display

### 3. User Experience
- **Drag & Drop**: Intuitive file selection interface
- **Progress Indicators**: Upload progress and loading states
- **Error Handling**: Clear error messages for invalid files
- **Fullscreen View**: Click to view files in fullscreen modal
- **Download Option**: Easy download functionality

## Components

### FileUpload Component (`src/components/messages/FileUpload.tsx`)
- Handles file selection and validation
- Manages upload progress
- Provides file preview before sending

### FilePreview Component (`src/components/messages/FilePreview.tsx`)
- Displays file attachments in messages
- Provides download and fullscreen view options
- Shows appropriate icons and file information

### Updated ChatInput Component (`src/components/messages/ChatInput.tsx`)
- Integrated file upload functionality
- Supports sending files with or without text
- Manages attachment state

### Updated Message Component (`src/components/messages/Message.tsx`)
- Displays file attachments in chat messages
- Shows system messages for file-only messages

## API Endpoints

### Upload API (`/api/upload`)
- **Method**: POST
- **Content-Type**: multipart/form-data
- **Parameters**:
  - `file`: The file to upload
  - `folder`: Optional folder name (defaults to 'agency-portal/files')
- **Response**: File URL, type, name, and size

## Database Schema

The system uses the existing `MessageAttachment` table:
```sql
model MessageAttachment {
  id        String    @id @default(uuid())
  messageId String
  fileName  String
  filePath  String
  fileSize  Int
  mimeType  String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  message   Message   @relation(fields: [messageId], references: [id], onDelete: Cascade)
}
```

## Environment Variables Required

Make sure these Cloudinary environment variables are set:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Usage

1. **Sending Files with Text**:
   - Type your message in the chat input
   - Click "Attach Files" button
   - Select files from your device
   - Click "Upload Files" to upload to Cloudinary
   - Click "Send" to send the message with attachments

2. **Sending Files Only**:
   - Click "Attach Files" button
   - Select files from your device
   - Click "Upload Files" to upload to Cloudinary
   - Click "Send" to send the files without text

3. **Viewing Files**:
   - Click on image thumbnails to view fullscreen
   - Click the download button to download files
   - Hover over images to see preview option

## File Type Support

- **Images**: JPEG, PNG, GIF, WebP
- **Videos**: MP4, QuickTime
- **Documents**: PDF, Word (.doc, .docx), Excel (.xls, .xlsx), PowerPoint (.ppt, .pptx)
- **Archives**: ZIP, RAR
- **Audio**: MP3, WAV
- **Text**: Plain text files

## Security Features

- File type validation
- File size limits (10MB max)
- Secure Cloudinary storage
- Proper error handling
- Input sanitization

## Performance Optimizations

- Lazy loading of file previews
- Optimized image thumbnails
- Efficient file upload with progress indicators
- Proper cleanup of temporary files
