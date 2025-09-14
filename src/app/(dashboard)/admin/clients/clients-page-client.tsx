"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClientsList } from "@/components/admin/clients-list";
import { ClientWithDetails } from "@/lib/clients";
import { SortOption, SortOrder } from "@/components/admin/clients-sort-filter";

interface ClientsPageClientProps {
  initialClients: ClientWithDetails[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  sortBy: SortOption;
  sortOrder: SortOrder;
  search: string;
}

export function ClientsPageClient({
  initialClients,
  totalCount,
  totalPages,
  currentPage,
  sortBy,
  sortOrder,
  search,
}: ClientsPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateURL = useCallback((
    newPage?: number,
    newSortBy?: SortOption,
    newSortOrder?: SortOrder,
    newSearch?: string
  ) => {
    const params = new URLSearchParams(searchParams);
    
    if (newPage !== undefined) {
      params.set('page', newPage.toString());
    }
    if (newSortBy !== undefined) {
      params.set('sortBy', newSortBy);
    }
    if (newSortOrder !== undefined) {
      params.set('sortOrder', newSortOrder);
    }
    if (newSearch !== undefined) {
      if (newSearch.trim()) {
        params.set('search', newSearch.trim());
      } else {
        params.delete('search');
      }
    }

    // Reset to page 1 when changing sort or search
    if (newSortBy !== undefined || newSortOrder !== undefined || newSearch !== undefined) {
      params.set('page', '1');
    }

    const newURL = `${window.location.pathname}?${params.toString()}`;
    router.push(newURL);
  }, [router, searchParams]);

  const handlePageChange = useCallback((page: number) => {
    startTransition(() => {
      updateURL(page);
    });
  }, [updateURL]);

  const handleSortChange = useCallback((newSortBy: SortOption, newSortOrder: SortOrder) => {
    startTransition(() => {
      updateURL(undefined, newSortBy, newSortOrder);
    });
  }, [updateURL]);

  const handleFiltersClick = useCallback(() => {
    // TODO: Implement filters modal/sheet
    console.log('Filters clicked - to be implemented');
  }, []);

  const handleClientCreated = useCallback(() => {
    // Refresh the page to show the new client
    window.location.reload();
  }, []);

  return (
    <div className={isPending ? "opacity-50 transition-opacity" : ""}>
      <ClientsList
        initialClients={initialClients}
        totalCount={totalCount}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
        onFiltersClick={handleFiltersClick}
        onClientCreated={handleClientCreated}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />
    </div>
  );
}
