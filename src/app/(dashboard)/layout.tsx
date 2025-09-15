import React from "react";
import { PortalLayout } from "@/components/layout/portal-layout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { ClientPortalLayout } from "@/components/layout/client-portal-layout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <ClientPortalLayout>{children}</ClientPortalLayout>
    </AuthGuard>
  );
}
