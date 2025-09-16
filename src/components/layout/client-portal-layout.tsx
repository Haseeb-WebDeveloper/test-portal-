'use client';

import { useAuth } from '@/hooks/use-auth';
import { PortalLayout } from './portal-layout';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ClientPortalLayoutProps {
  children: React.ReactNode;
}

export function ClientPortalLayout({ children }: ClientPortalLayoutProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen h-full bg-figma-sidebar-gradient text-foreground flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null; // AuthGuard will handle redirect
  }

  return <PortalLayout user={user as { name: string; avatar: string | null; role: string }}>{children}</PortalLayout>;
}
