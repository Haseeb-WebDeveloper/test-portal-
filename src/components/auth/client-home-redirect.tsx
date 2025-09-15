'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@/types/enums';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export function ClientHomeRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/login');
      return;
    }
    
    // Redirect based on user role
    if (user.role === UserRole.PLATFORM_ADMIN) {
      router.push('/admin');
    } else if (user.role === UserRole.CLIENT || user.role === UserRole.CLIENT_MEMBER) {
      router.push('/client');
    } else {
      // For other roles (like AGENCY_MEMBER), redirect to unauthorized
      router.push('/unauthorized');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen w-full h-full text-foreground flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return null; // Will redirect
}
