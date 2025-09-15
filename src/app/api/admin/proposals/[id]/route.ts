import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { ProposalStatus } from '@/types/enums';

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

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { authId: user.id },
      select: { role: true }
    });

    if (!dbUser || (dbUser.role !== 'PLATFORM_ADMIN' && dbUser.role !== 'AGENCY_MEMBER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const proposal = await prisma.proposal.findUnique({
      where: { 
        id: (await params).id,
        deletedAt: null
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            avatar: true,
            description: true,
            website: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        contracts: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true
          }
        },
        rooms: {
          select: {
            id: true,
            name: true,
            avatar: true,
            isActive: true
          },
          where: { deletedAt: null }
        }
      }
    });

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ proposal });

  } catch (error) {
    console.error('Error fetching proposal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { authId: user.id },
      select: { id: true, role: true }
    });

    if (!dbUser || (dbUser.role !== 'PLATFORM_ADMIN' && dbUser.role !== 'AGENCY_MEMBER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      status,
      hasReviewed,
      tags,
      media,
      createRoom,
      roomName,
      roomAvatar
    } = body;

    // Check if proposal exists
    const existingProposal = await prisma.proposal.findUnique({
      where: { 
        id: (await params).id,
        deletedAt: null
      }
    });

    if (!existingProposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Update proposal
    const proposal = await prisma.proposal.update({
      where: { id: (await params).id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(hasReviewed !== undefined && { hasReviewed }),
        ...(tags && { tags }),
        ...(media !== undefined && { media }),
        updatedBy: dbUser.id
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        rooms: {
          select: { id: true, name: true, avatar: true, isActive: true },
          where: { deletedAt: null }
        }
      }
    });

    // Optionally upsert a room for this proposal
    if (createRoom) {
      const existingRoom = await prisma.room.findFirst({
        where: { proposalId: (await params).id, deletedAt: null }
      });
      if (existingRoom) {
        await prisma.room.update({
          where: { id: existingRoom.id },
          data: {
            ...(roomName && { name: roomName }),
            ...(roomAvatar && { avatar: roomAvatar }),
            updatedBy: dbUser.id
          }
        });
      } else if (roomName) {
        // Need clientId to create a room; fetch from proposal
        const prop = await prisma.proposal.findUnique({
          where: { id: (await params).id },
          select: { clientId: true }
        });
        if (prop) {
          await prisma.room.create({
            data: {
              name: roomName,
              type: 'AGENCY_INTERNAL',
              proposalId: (await params).id,
              clientId: prop.clientId,
              createdBy: dbUser.id,
              ...(roomAvatar && { avatar: roomAvatar })
            }
          });
        }
      }
    }

    return NextResponse.json({ proposal });

  } catch (error) {
    console.error('Error updating proposal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { authId: user.id },
      select: { id: true, role: true }
    });

    if (!dbUser || (dbUser.role !== 'PLATFORM_ADMIN' && dbUser.role !== 'AGENCY_MEMBER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const id = (await params).id;

    // Check if proposal exists
    const existingProposal = await prisma.proposal.findUnique({
      where: { 
        id:   id,
        deletedAt: null
      }
    });

    if (!existingProposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Soft delete proposal
    await prisma.proposal.update({
      where: { id: id },
      data: {
        deletedAt: new Date(),
        updatedBy: dbUser.id
      }
    });

    return NextResponse.json({ message: 'Proposal deleted successfully' });

  } catch (error) {
    console.error('Error deleting proposal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}