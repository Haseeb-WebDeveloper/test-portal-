import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import { getDashboardData } from "@/lib/dashboard";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "./dashboard-client";
import { getGreeting } from "@/utils/greeting";
import { QuickActions } from "@/components/admin/quick-actions";
import { getCurrentUser } from "@/lib/auth";

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

async function getDashboardDataServer() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("❌ Auth error:", authError);
      throw new Error("Unauthorized");
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { authId: user.id },
      select: { id: true, role: true },
    });

    if (
      !dbUser ||
      (dbUser.role !== "PLATFORM_ADMIN" && dbUser.role !== "AGENCY_MEMBER")
    ) {
      console.error("❌ User not authorized:", dbUser?.role);
      throw new Error("Forbidden");
    }

    const dashboardData = await getDashboardData(dbUser.id);

    return dashboardData;
  } catch (error) {
    console.error("❌ Error fetching dashboard data:", error);
    return {
      contracts: { active: 0, drafts: 0 },
      proposals: { new: 0, pending: 0 },
      clients: [],
      news: [],
      unreadMessages: 0,
      recentRooms: [],
    };
  }
}

export default async function AdminPage() {
  const user = await getCurrentUser();
  try {
    const dashboardData = await getDashboardDataServer();

    return (
      <div className="p-6 lg:px-12">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner size="lg" />
            </div>
          }
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="figma-h3">
                {getGreeting(
                  user?.name ? user.name.split(" ").slice(0, 2).join(" ") : ""
                )}
              </h1>
              <p className="figma-paragraph">Here's your latest updates!</p>
            </div>
            <QuickActions />
          </div>

          <DashboardClient initialData={dashboardData} />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error("❌ Error in AdminPage:", error);
    return (
      <div className="p-6 lg:px-12">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-400 mb-4">
            Error Loading Dashboard
          </h1>
          <p className="text-gray-400">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }
}
