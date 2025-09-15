import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getDashboardData } from '@/lib/dashboard';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
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

    const dashboardData = await getDashboardData(dbUser.id);

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
