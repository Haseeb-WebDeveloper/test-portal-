import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getClientsWithDetails } from "@/lib/clients";
import { ClientsPageClient } from "./clients-page-client";
import { Suspense } from "react";
import Link from "next/link";

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
        <div className="flex items-center justify-between">
          <h1 className="figma-h3">Our Clients</h1>
          <Link
            href="/admin/clients/create"
            className="w-full md:w-fit cursor-pointer px-6 py-2 bg-gradient-to-r from-[#6B42D1] to-[#FF2AFF] rounded-lg transition-all"
          >
            Create Client
          </Link>
        </div>
        <ClientsPageClient initialClients={clients} totalCount={totalCount} />
      </Suspense>
    </div>
  );
}
