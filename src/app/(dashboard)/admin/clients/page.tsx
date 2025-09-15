import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getClientsWithDetails } from "@/lib/clients";
import { ClientsPageClient } from "./clients-page-client";
import { Suspense } from "react";

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

export default async function ClientsPage() {
  // Load all clients data for static generation
  // We'll handle pagination, sorting, and search on the client side
  const { clients, totalCount } = await getClientsWithDetails({
    limit: 1000, // Load more data to handle client-side filtering
  });

  return (
    <div className="p-6 lg:p-12">
      <Suspense fallback={<LoadingSpinner size="lg" />}>
        <ClientsPageClient
          initialClients={clients}
          totalCount={totalCount}
        />
      </Suspense>
    </div>
  );
}
