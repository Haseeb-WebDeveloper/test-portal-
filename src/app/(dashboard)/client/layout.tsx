import { AuthGuard } from "@/components/auth/auth-guard";

export default async function ClientLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <AuthGuard requiredRole="client">
      <div className="h-full">{children}</div>
    </AuthGuard>
  );
}