import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  try {
    const user = await requireAdmin();
    
    // Additional role validation for admin routes
    if (user.role !== 'PLATFORM_ADMIN' && user.role !== 'AGENCY_MEMBER') {
      redirect('/unauthorized');
    }

    return <div className="h-full">{children}</div>;
  } catch (error) {
    console.error('Admin layout error:', error);
    redirect('/unauthorized');
  }
}