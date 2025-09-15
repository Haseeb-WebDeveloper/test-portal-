import { Suspense } from 'react';
import { createClient } from '@/utils/supabase/server';
import { getClientDashboardData } from '@/lib/client-dashboard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { prisma } from '@/lib/prisma';
import { ClientDashboardClient } from './client-dashboard-client';

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

async function getClientDashboardDataServer() {
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

    if (!dbUser || (dbUser.role !== 'CLIENT' && dbUser.role !== 'CLIENT_MEMBER')) {
      console.error('❌ User not authorized:', dbUser?.role);
      throw new Error('Forbidden');
    }


    const dashboardData = await getClientDashboardData(dbUser.id);
    
    return dashboardData;
  } catch (error) {
    console.error('❌ Error fetching client dashboard data:', error);
    return {
      unreadMessages: 0,
      contracts: { active: 0 },
      proposals: { new: 0, pending: 0 },
      news: [],
      ongoingContracts: [],
      recentRooms: []
    };
  }
}

export default async function ClientPage() {
  
  try {
    const dashboardData = await getClientDashboardDataServer();
    console.log('📊 Client dashboard data received:', {
      contracts: dashboardData.contracts,
      proposals: dashboardData.proposals,
      ongoingContractsCount: dashboardData.ongoingContracts.length,
      newsCount: dashboardData.news.length,
      unreadMessages: dashboardData.unreadMessages
    });

    return (
      <div className="p-6 lg:p-12">
        <Suspense fallback={<LoadingSpinner size="lg" />}>
          <ClientDashboardClient initialData={dashboardData} />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error('❌ Error in ClientPage:', error);
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