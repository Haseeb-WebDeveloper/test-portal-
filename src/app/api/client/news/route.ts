import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';

// GET /api/client/news - Get news for clients with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a client or client member
    const userRecord = await prisma.user.findUnique({
      where: { authId: user.id },
      include: { 
        agencyMembership: true,
        clientMemberships: {
          include: {
            client: true
          }
        }
      }
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has access to view news
    const canViewNews = userRecord.role === 'CLIENT' || 
                       userRecord.role === 'CLIENT_MEMBER' || 
                       userRecord.role === 'PLATFORM_ADMIN';

    if (!canViewNews) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause for news visibility
    const where: any = {
      deletedAt: null,
      OR: [
        { sendToAll: true }, // News sent to all users
        { sendTo: { has: userRecord.id } } // News sent specifically to this user
      ]
    };

    // If user is a client member, also include news sent to their client
    if (userRecord.role === 'CLIENT_MEMBER' && userRecord.clientMemberships.length > 0) {
      const clientIds = userRecord.clientMemberships.map(membership => membership.clientId);
      where.OR.push({
        sendTo: { hasSome: clientIds }
      });
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } }
          ]
        }
      ];
    }

    // Get news with creator info
    const [news, totalCount] = await Promise.all([
      prisma.news.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit
      }),
      prisma.news.count({ where })
    ]);

    return NextResponse.json({
      news,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching client news:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}
