import { requireClient } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ClientLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  try {
    const user = await requireClient();
    
    // Additional role validation for client routes
    if (user.role !== 'CLIENT' && user.role !== 'CLIENT_MEMBER') {
      redirect('/unauthorized');
    }

    return <div className="h-full">{children}</div>;
  } catch (error) {
    console.error('Client layout error:', error);
    redirect('/unauthorized');
  }
}