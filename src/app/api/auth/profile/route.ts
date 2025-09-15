import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/types/enums';

// GET - Fetch detailed user profile
export async function GET() {
  try {
    const user = await getCurrentUser();
    
    // Fetch detailed user profile with additional fields
    const profile = await prisma.user.findUnique({
      where: {
        id: user.id,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    
    const { name, email, role, isActive, avatar } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Validate role if provided
    if (role && !Object.values(UserRole).includes(role as UserRole)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Check if email is already taken by another user
    if (email !== user.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: email,
          id: { not: user.id },
          deletedAt: null,
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email is already taken' },
          { status: 400 }
        );
      }
    }


    // Update user profile
    const updatedProfile = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: role || user.role,
        isActive: isActive !== undefined ? isActive : user.isActive,
        avatar: avatar || user.avatar,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
