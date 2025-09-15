'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Plus,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  Paperclip,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { format } from 'date-fns';
import { ContractStatus } from '@/types/enums';

interface Contract {
  id: string;
  title: string;
  description: string | null;
  status: ContractStatus;
  startDate: string | null;
  endDate: string | null;
  currency: string;
  budget: number | null;
  estimatedHours: number | null;
  actualHours: number;
  progressPercentage: number;
  priority: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    name: string;
    avatar: string | null;
  };
  creator: {
    id: string;
    name: string;
    email: string;
  } | null;
  assignments: {
    id: string;
    user: {
      id: string;
      name: string;
      avatar: string | null;
    };
    role: string;
  }[];
  // Add mediaFilesCount for the new UI
  mediaFilesCount?: number;
}

interface ContractsListProps {}

const statusInfoMap: Record<
  ContractStatus,
  { color: string; dotColor: string; label: string }
> = {
  DRAFT: {
    color: 'bg-gray-100 text-gray-800',
    dotColor: 'bg-gray-400',
    label: 'Draft',
  },
  PENDING_APPROVAL: {
    color: 'bg-yellow-100 text-yellow-800',
    dotColor: 'bg-yellow-400',
    label: 'Pending Approval',
  },
  ACTIVE: {
    color: 'bg-primary text-white',
    dotColor: 'bg-green-400',
    label: 'Active',
  },
  COMPLETED: {
    color: 'bg-blue-100 text-blue-800',
    dotColor: 'bg-blue-400',
    label: 'Completed',
  },
  TERMINATED: {
    color: 'bg-red-100 text-red-800',
    dotColor: 'bg-red-400',
    label: 'Terminated',
  },
  EXPIRED: {
    color: 'bg-orange-100 text-orange-800',
    dotColor: 'bg-orange-400',
    label: 'Expired',
  },
};

const progressBarGradient =
  'bg-gradient-to-r from-primary to-[#A084E8]';

export function ContractsList({ initialContracts = [] as Contract[] }: { initialContracts?: Contract[] }) {
  const [contracts, setContracts] = useState<Contract[]>(initialContracts);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchContracts = async (
    pageNum = 1,
    searchTerm = '',
    status = statusFilter,
    priority = priorityFilter,
    sort = sortBy,
    order = sortOrder
  ) => {
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '12',
        search: searchTerm,
        status: status === 'all' ? '' : status,
        priority: priority === 'all' ? '' : priority,
        sortBy: sort,
        sortOrder: order,
      });

      const response = await fetch(`/api/admin/contracts?${params}`);
      if (response.ok) {
        const data = await response.json();

        // Add mediaFilesCount fallback if not present
        const contractsWithMedia = data.contracts.map((c: Contract) => ({
          ...c,
          mediaFilesCount:
            typeof c.mediaFilesCount === 'number'
              ? c.mediaFilesCount
              : 0,
        }));

        if (pageNum === 1) {
          setContracts(contractsWithMedia);
        } else {
          setContracts((prev) => [...prev, ...contractsWithMedia]);
        }

        setTotalPages(data.pagination.pages);
        setHasMore(data.pagination.page < data.pagination.pages);
      } else {
        throw new Error('Failed to fetch contracts');
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast.error('Failed to fetch contracts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialContracts && initialContracts.length > 0) {
      // We already have data from server; mark as loaded
      setIsLoading(false);
      return;
    }
    fetchContracts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    fetchContracts(1, value, statusFilter, priorityFilter, sortBy, sortOrder);
  };

  const handleFilter = (type: 'status' | 'priority', value: string) => {
    if (type === 'status') {
      setStatusFilter(value);
      setPage(1);
      fetchContracts(1, search, value, priorityFilter, sortBy, sortOrder);
    } else {
      setPriorityFilter(value);
      setPage(1);
      fetchContracts(1, search, statusFilter, value, sortBy, sortOrder);
    }
  };

  const handleSort = (field: string) => {
    const newOrder = sortBy === field && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortBy(field);
    setSortOrder(newOrder);
    setPage(1);
    fetchContracts(1, search, statusFilter, priorityFilter, field, newOrder);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchContracts(
      nextPage,
      search,
      statusFilter,
      priorityFilter,
      sortBy,
      sortOrder
    );
  };

  const filteredContracts = useMemo(() => {
    return contracts.filter((contract) => {
      const matchesSearch =
        contract.title.toLowerCase().includes(search.toLowerCase()) ||
        contract.client.name.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [contracts, search]);

  // Card click handler (navigate to contract details)
  const handleCardClick = (id: string) => {
    window.location.href = `/admin/contracts/${id}`;
  };

  if (isLoading && contracts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contracts Grid */}
      {filteredContracts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border border-primary/20 rounded-xl ">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">No contracts found</h3>
            <p className="text-muted-foreground mb-4">
              {search || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by creating your first contract'}
            </p>
            {!search && statusFilter === 'all' && priorityFilter === 'all' && (
              <Button asChild>
                <Link href="/admin/contracts/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Contract
                </Link>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContracts.map((contract) => {
              const statusInfo = statusInfoMap[contract.status];
              return (
                <div
                  key={contract.id}
                  className="relative flex flex-col justify-between cursor-pointer rounded-tl-xl border border-primary/20 transition-all duration-200  min-h-[260px]"
                  onClick={() => handleCardClick(contract.id)}
                  tabIndex={0}
                  role="button"
                  aria-label={`View contract ${contract.title}`}
                >
                  {/* Status Badge - Top Right */}
                  <div className="absolute -top-[26px] right-0 z-10">
                    <div
                      className={`flex items-center gap-2 px-3 py-1 rounded-t-lg text-xs font-medium border border-b-0 ${statusInfo.color} shadow-sm`}
                      style={{
                        background:
                          contract.status === 'ACTIVE'
                            ? '#18102B'
                            : undefined,
                      }}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`}
                      ></div>
                      <span>{statusInfo.label}</span>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="p-5 pb-4 space-y-4">
                    {/* Title */}
                    <h3 className="text-xl font-bold leading-tight">
                      {contract.title}
                    </h3>

                    {/* Description */}
                    <p className="text-base line-clamp-2 leading-relaxed">
                      {contract.description || 'No description provided'}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {contract.tags.slice(0, 3).map((tag) => (
                        <div
                          key={tag}
                          className="px-3 py-1 text-sm rounded-lg border border-primary/30 font-medium bg-transparent"
                        >
                          {tag}
                        </div>
                      ))}
                      {contract.tags.length > 3 && (
                        <div className="px-3 py-1 text-sm rounded-lg border border-primary/30 bg-transparent">
                          +{contract.tags.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer - Progress Bar and Date/Files */}
                  <div>
                    {/* Progress Bar */}
                    <div className="space-y-2 pt-2 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-[#2A1A47] rounded-full h-1.5 relative">
                          <div
                            className={`${progressBarGradient} h-2 rounded-full transition-all duration-300`}
                            style={{
                              width: `${contract.progressPercentage}%`,
                            }}
                          ></div>
                        </div>
                        <span
                          className="text-sm font-medium pl-2"
                          style={{ minWidth: 40 }}
                        >
                          {contract.progressPercentage}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-base border-t border-[#2A1A47] px-5 py-3 mt-2">
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-5 h-5" />
                        <span>
                          {typeof contract.mediaFilesCount === 'number'
                            ? contract.mediaFilesCount
                            : 0}{' '}
                          files
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        <span>
                          {format(
                            new Date(contract.createdAt),
                            'do MMM, yyyy'
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
