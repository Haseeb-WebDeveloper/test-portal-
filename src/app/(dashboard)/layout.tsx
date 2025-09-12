import React from "react";
import { PortalLayout } from "@/components/layout/portal-layout";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  return <PortalLayout user={user}>{children}</PortalLayout>;
}
