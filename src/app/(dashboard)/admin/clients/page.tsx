import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { getClientsWithDetails } from "@/lib/clients";
import { ClientsPageClient } from "./clients-page-client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Enable ISR with 60-second revalidation for fresh data
export const revalidate = 60;

interface ClientsPageProps {
  searchParams: {
    page?: string;
    sortBy?: string;
    sortOrder?: string;
    search?: string;
  };
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  // Ensure user has admin privileges
  const user = await requireAdmin();

  // Await searchParams in Next.js 15
  const resolvedSearchParams = await searchParams;

  // Parse search params
  const page = parseInt(resolvedSearchParams.page || "1", 10);
  const sortBy = (resolvedSearchParams.sortBy as "name" | "lastActivity") || "name";
  const sortOrder = (resolvedSearchParams.sortOrder as "asc" | "desc") || "asc";
  const search = resolvedSearchParams.search || "";

  // Fetch clients data
  const { clients, totalCount, totalPages } = await getClientsWithDetails({
    page,
    sortBy,
    sortOrder,
    search,
    limit: 12,
  });

  return (
    <div className="p-6 lg:p-12">
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      }>
        <ClientsPageClient
          initialClients={clients}
          totalCount={totalCount}
          totalPages={totalPages}
          currentPage={page}
          sortBy={sortBy}
          sortOrder={sortOrder}
          search={search}
        />
      </Suspense>
    </div>
  );
}