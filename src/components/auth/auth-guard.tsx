"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/use-auth";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "client";
  fallback?: React.ReactNode;
}

export function AuthGuard({
  children,
  requiredRole,
  fallback = (
    <div className="min-h-screen h-full bg-gradient-to-b from-[#0A031C] to-[#000000] text-foreground flex items-center justify-center">
      {/* <LoadingSpinner size="lg" /> */}
    </div>
  ),
}: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (requiredRole === "admin") {
      if (user.role !== "PLATFORM_ADMIN" && user.role !== "AGENCY_MEMBER") {
        router.push("/unauthorized");
        return;
      }
    }

    if (requiredRole === "client") {
      if (user.role !== "CLIENT" && user.role !== "CLIENT_MEMBER") {
        router.push("/unauthorized");
        return;
      }
    }
  }, [user, loading, requiredRole, router]);

  if (loading) {
    return <>{fallback}</>;
  }

  if (!user) {
    return <>{fallback}</>;
  }

  if (requiredRole === "admin") {
    if (user.role !== "PLATFORM_ADMIN" && user.role !== "AGENCY_MEMBER") {
      return <>{fallback}</>;
    }
  }

  if (requiredRole === "client") {
    if (user.role !== "CLIENT" && user.role !== "CLIENT_MEMBER") {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}
