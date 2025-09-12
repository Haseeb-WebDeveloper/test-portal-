import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { UserRole } from '@/types/enums';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  role: string;
  isActive: boolean;
}

export async function getCurrentUser(): Promise<User> {
  try {
    const supabase = await createClient();
    
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error('Auth error:', authError);
      redirect('/login');
    }

    if (!authUser) {
      redirect('/login');
    }

    const user = await prisma.user.findUnique({
      where: {
        authId: authUser.id,
        deletedAt: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      console.error('User not found in database');
      redirect('/unauthorized');
    }

    if (!user?.isActive) {
      console.error('User account is inactive');
      redirect('/unauthorized');
    }

    return user as User;
  } catch (error) {
    console.error('getCurrentUser error:', error);
    redirect('/unauthorized');
  }
}

export async function requireAdmin(): Promise<User> {
  try {
    const user = await getCurrentUser();
    
    if (user?.role !== 'PLATFORM_ADMIN' && user?.role !== 'AGENCY_MEMBER') {
      console.error('User does not have admin privileges:', user?.role);
      redirect('/unauthorized');
    }
    if (!user) {
      console.error('User not found in database');
      redirect('/unauthorized');
    }

    return user as User;
  } catch (error) {
    console.error('requireAdmin error:', error);
    redirect('/unauthorized');
  }
}

export async function requireClient(): Promise<User> {
  try {
    const user = await getCurrentUser();
    
    if (user.role !== 'CLIENT' && user.role !== 'CLIENT_MEMBER') {
      console.error('User does not have client privileges:', user.role);
      redirect('/unauthorized');
    }

    return user;
  } catch (error) {
    console.error('requireClient error:', error);
    redirect('/unauthorized');
  }
}

// Helper function to check if user has specific role
export function hasRole(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole);
}

// Helper function to get user's dashboard path based on role
export function getUserDashboardPath(userRole: string): string {
  switch (userRole) {
    case 'PLATFORM_ADMIN':
    case 'AGENCY_MEMBER':
      return '/admin';
    case 'CLIENT':
    case 'CLIENT_MEMBER':
      return '/client';
    default:
      return '/unauthorized';
  }
}