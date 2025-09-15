"use client";

import { useState, useCallback, useMemo, useTransition } from "react";
import { ClientsList } from "@/components/admin/clients-list";
import { ClientWithDetails } from "@/lib/clients";
import { SortOption, SortOrder } from "@/components/admin/clients-sort-filter";

interface ClientsPageClientProps {
  initialClients: ClientWithDetails[];
  totalCount: number;
}

export function ClientsPageClient({
  initialClients,
  totalCount,
}: ClientsPageClientProps) {
  const [isPending, startTransition] = useTransition();
  
  // Client-side state for filtering, sorting, and pagination
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Filter and sort clients on the client side
  const filteredAndSortedClients = useMemo(() => {
    let filtered = initialClients;

    // Apply search filter
    if (search.trim()) {
      const searchTerm = search.toLowerCase();
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchTerm) ||
        (client.description && client.description.toLowerCase().includes(searchTerm)) ||
        (client.website && client.website.toLowerCase().includes(searchTerm))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | Date;
      let bValue: string | Date;

      if (sortBy === "name") {
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
      } else if (sortBy === "lastActivity") {
        aValue = a.lastActivity || a.updatedAt;
        bValue = b.lastActivity || b.updatedAt;
      } else {
        return 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [initialClients, search, sortBy, sortOrder]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredAndSortedClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClients = filteredAndSortedClients.slice(startIndex, endIndex);

  const handlePageChange = useCallback((page: number) => {
    startTransition(() => {
      setCurrentPage(page);
    });
  }, []);

  const handleSortChange = useCallback((newSortBy: SortOption, newSortOrder: SortOrder) => {
    startTransition(() => {
      setSortBy(newSortBy);
      setSortOrder(newSortOrder);
      setCurrentPage(1); // Reset to first page when sorting
    });
  }, []);

  const handleSearchChange = useCallback((newSearch: string) => {
    startTransition(() => {
      setSearch(newSearch);
      setCurrentPage(1); // Reset to first page when searching
    });
  }, []);

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
        initialClients={paginatedClients}
        totalCount={filteredAndSortedClients.length}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
        onFiltersClick={handleFiltersClick}
        onClientCreated={handleClientCreated}
        onSearchChange={handleSearchChange}
        sortBy={sortBy}
        sortOrder={sortOrder}
        search={search}
      />
    </div>
  );
}
