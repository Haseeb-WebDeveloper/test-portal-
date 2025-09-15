import { Suspense } from 'react';
import { createClient } from '@/utils/supabase/server';
import { getDashboardData } from '@/lib/dashboard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { prisma } from '@/lib/prisma';
import { DashboardClient } from './dashboard-client';

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

async function getDashboardDataServer() {
  try {
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      throw new Error('Unauthorized');
    }


    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { authId: user.id },
      select: { id: true, role: true }
    });

    if (!dbUser || (dbUser.role !== 'PLATFORM_ADMIN' && dbUser.role !== 'AGENCY_MEMBER')) {
      console.error('❌ User not authorized:', dbUser?.role);
      throw new Error('Forbidden');
    }


    const dashboardData = await getDashboardData(dbUser.id);
    
    return dashboardData;
  } catch (error) {
    console.error('❌ Error fetching dashboard data:', error);
    return {
      contracts: { active: 0, drafts: 0 },
      proposals: { new: 0, pending: 0 },
      clients: [],
      news: [],
      unreadMessages: 0,
      recentRooms: []
    };
  }
}

export default async function AdminPage() {
  
  try {
    const dashboardData = await getDashboardDataServer();

    return (
      <div className="p-6 lg:p-12">
        <Suspense fallback={<LoadingSpinner size="lg" />}>
          <DashboardClient initialData={dashboardData} />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error('❌ Error in AdminPage:', error);
    return (
      <div className="p-6 lg:p-12">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Error Loading Dashboard</h1>
          <p className="text-gray-400">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }
}
