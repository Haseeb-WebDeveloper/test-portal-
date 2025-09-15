"use client";

import { memo, useState, useCallback } from "react";
import { ClientCard } from "./client-card";
import { ClientsSortFilter, SortOption, SortOrder } from "./clients-sort-filter";
import { CreateClientModal } from "./create-client-modal";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { ClientWithDetails } from "@/lib/clients";

interface ClientsListProps {
  initialClients: ClientWithDetails[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onSortChange: (sortBy: SortOption, sortOrder: SortOrder) => void;
  onSearchChange: (search: string) => void;
  onFiltersClick: () => void;
  onClientCreated: () => void;
  sortBy: SortOption;
  sortOrder: SortOrder;
  search: string;
}

export const ClientsList = memo(function ClientsList({
  initialClients,
  totalCount,
  totalPages,
  currentPage,
  onPageChange,
  onSortChange,
  onSearchChange,
  onFiltersClick,
  onClientCreated,
  sortBy,
  sortOrder,
  search,
}: ClientsListProps) {
  const [clients] = useState(initialClients);

  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  }, [onPageChange, totalPages]);

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              isActive={i === currentPage}
              onClick={() => handlePageChange(i)}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // Show first page
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            isActive={1 === currentPage}
            onClick={() => handlePageChange(1)}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      // Show ellipsis if current page is far from start
      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) {
          items.push(
            <PaginationItem key={i}>
              <PaginationLink
                isActive={i === currentPage}
                onClick={() => handlePageChange(i)}
                className="cursor-pointer"
              >
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
      }

      // Show ellipsis if current page is far from end
      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Show last page
      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink
              isActive={totalPages === currentPage}
              onClick={() => handlePageChange(totalPages)}
              className="cursor-pointer"
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
  };

  return (
    <div className="space-y-6">
      {/* Header with Sort and Filter - Always visible */}
      <div className="flex items-center justify-between">
     
        {/* <div className="flex items-center gap-3">
          <ClientsSortFilter
            sortBy={sortBy}
            sortOrder={sortOrder}
            search={search}
            onSortChange={onSortChange}
            onSearchChange={onSearchChange}
            onFiltersClick={onFiltersClick}
          />
          <CreateClientModal onClientCreated={onClientCreated} />
        </div> */}
      </div>

      {/* Content Area */}
      {clients.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No clients found</h3>
          <p className="text-muted-foreground">
            {totalCount === 0 
              ? "No clients have been added yet." 
              : "Try adjusting your search or filter criteria."
            }
          </p>
        </div>
      ) : (
        /* Clients Grid */
        <div className="flex flex-wrap gap-6">
          {clients.map((client, index) => (
            <ClientCard
              key={client.id}
              client={client}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {renderPaginationItems()}
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
});
