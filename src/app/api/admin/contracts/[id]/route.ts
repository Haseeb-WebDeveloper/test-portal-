import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { ContractStatus, RoomType } from '@/types/enums';

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

    const contract = await prisma.contract.findUnique({
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
        assignments: {
          where: { isActive: true },
          select: {
            id: true,
            role: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        },
        tasks: {
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            dueDate: true,
            assignedTo: true,
            assignee: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        rooms: {
          select: {
            id: true,
            name: true,
            avatar: true,
            type: true,
          },
          where: {
            deletedAt: null,
          },
        }
      }
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ contract });

  } catch (error) {
    console.error('Error fetching contract:', error);
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
      startDate,
      endDate,
      currency,
      budget,
      estimatedHours,
      actualHours,
      priority,
      progressPercentage,
      tags,
      media,
      roomName,
      roomAvatar
    } = body;

    // Check if contract exists
    const existingContract = await prisma.contract.findUnique({
      where: { 
        id: (await params).id,
        deletedAt: null
      }
    });

    if (!existingContract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Update contract
    const contract = await prisma.contract.update({
      where: { id: (await params).id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(currency && { currency }),
        ...(budget !== undefined && { budget: budget ? parseFloat(budget) : null }),
        ...(estimatedHours !== undefined && { estimatedHours: estimatedHours ? parseInt(estimatedHours) : null }),
        ...(actualHours !== undefined && { actualHours: parseInt(actualHours) }),
        ...(priority !== undefined && { priority: parseInt(priority) }),
        ...(progressPercentage !== undefined && { progressPercentage: parseInt(progressPercentage) }),
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
        assignments: {
          where: { isActive: true },
          select: {
            id: true,
            role: true,
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        },
        rooms: {
          select: {
            id: true,
            name: true,
            avatar: true,
            type: true,
          },
          where: {
            deletedAt: null,
          },
        }
      }
    });

    // Handle room update/creation
    if (roomName !== undefined || roomAvatar !== undefined) {
      let existingRoom = await prisma.room.findFirst({
        where: {
          contractId: contract.id,
          deletedAt: null,
        },
      });

      if (existingRoom) {
        await prisma.room.update({
          where: { id: existingRoom.id },
          data: {
            ...(roomName !== undefined && { name: roomName }),
            ...(roomAvatar !== undefined && { avatar: roomAvatar }),
            updatedBy: dbUser.id,
          },
        });
      } else if (roomName) { // Create new room if it doesn't exist and roomName is provided
        await prisma.room.create({
          data: {
            name: roomName,
            type: RoomType.AGENCY_INTERNAL,
            clientId: contract.clientId,
            contractId: contract.id,
            avatar: roomAvatar,
            createdBy: dbUser.id,
          },
        });
      }
    }

    return NextResponse.json({ contract });

  } catch (error) {
    console.error('Error updating contract:', error);
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

    // Check if contract exists
    const existingContract = await prisma.contract.findUnique({
      where: { 
        id: (await params).id,
        deletedAt: null
      }
    });

    if (!existingContract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Soft delete contract
    await prisma.contract.update({
      where: { id: (await params).id },
      data: {
        deletedAt: new Date(),
        updatedBy: dbUser.id
      }
    });

    return NextResponse.json({ message: 'Contract deleted successfully' });

  } catch (error) {
    console.error('Error deleting contract:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
