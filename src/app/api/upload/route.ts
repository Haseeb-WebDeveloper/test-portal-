import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '@/types/messages';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'agency-portal/files';

    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: `File type ${file.type} is not allowed` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(file, {
      folder,
      resource_type: 'auto',
    });

    return NextResponse.json({
      success: true,
      url: result.url,
      type: result.type,
      name: result.name,
      size: result.size,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { message: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
