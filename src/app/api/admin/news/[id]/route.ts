import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/news/[id] - Get single news item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const userRecord = await prisma.user.findUnique({
      where: { authId: user.id },
      include: { agencyMembership: true }
    });

    if (!userRecord || userRecord.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const news = await prisma.news.findUnique({
      where: { 
        id: (await params).id,
        deletedAt: null
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    if (!news) {
      return NextResponse.json({ error: 'News not found' }, { status: 404 });
    }

    return NextResponse.json(news);
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/news/[id] - Update news item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const userRecord = await prisma.user.findUnique({
      where: { authId: user.id },
      include: { agencyMembership: true }
    });

    if (!userRecord || userRecord.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, content, featuredImage, sendTo, sendToAll } = body;

    // Check if news exists
    const existingNews = await prisma.news.findUnique({
      where: { 
        id: (await params).id,
        deletedAt: null
      }
    });

    if (!existingNews) {
      return NextResponse.json({ error: 'News not found' }, { status: 404 });
    }

    const news = await prisma.news.update({
      where: { id: (await params).id },
      data: {
        title: title || existingNews.title,
        description: description !== undefined ? description : existingNews.description,
        content: content || existingNews.content,
        featuredImage: featuredImage !== undefined ? featuredImage : existingNews.featuredImage,
        sendTo: sendTo !== undefined ? sendTo : existingNews.sendTo,
        sendToAll: sendToAll !== undefined ? sendToAll : existingNews.sendToAll,
        updatedBy: userRecord.id
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    return NextResponse.json(news);
  } catch (error) {
    console.error('Error updating news:', error);
    return NextResponse.json(
      { error: 'Failed to update news' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/news/[id] - Soft delete news item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const userRecord = await prisma.user.findUnique({
      where: { authId: user.id },
      include: { agencyMembership: true }
    });

    if (!userRecord || userRecord.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if news exists
    const existingNews = await prisma.news.findUnique({
      where: { 
        id: (await params).id,
        deletedAt: null
      }
    });

    if (!existingNews) {
      return NextResponse.json({ error: 'News not found' }, { status: 404 });
    }

    await prisma.news.update({
      where: { id: (await params).id },
      data: {
        deletedAt: new Date(),
        updatedBy: userRecord.id
      }
    });

    return NextResponse.json({ message: 'News deleted successfully' });
  } catch (error) {
    console.error('Error deleting news:', error);
    return NextResponse.json(
      { error: 'Failed to delete news' },
      { status: 500 }
    );
  }
}
