import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getClientsWithDetails } from "@/lib/clients";
import { ClientsPageClient } from "./clients-page-client";
import { Suspense } from "react";
import { ClientsHeader } from "./clients-header";

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

export default async function ClientsPage() {
  // Load all clients data for static generation
  // We'll handle pagination, sorting, and search on the client side
  const { clients, totalCount } = await getClientsWithDetails({
    limit: 1000, // Load more data to handle client-side filtering
  });

  return (
    <div className="p-6 lg:px-12">
      <Suspense fallback={<LoadingSpinner size="lg" />}>
        <ClientsHeader />
        <ClientsPageClient initialClients={clients} totalCount={totalCount} />
      </Suspense>
    </div>
  );
}