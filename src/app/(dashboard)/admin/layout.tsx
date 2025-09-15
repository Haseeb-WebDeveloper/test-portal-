import { AuthGuard } from "@/components/auth/auth-guard";

export default async function AdminLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <AuthGuard requiredRole="admin">
      <div className="h-full">{children}</div>
    </AuthGuard>
  );
}