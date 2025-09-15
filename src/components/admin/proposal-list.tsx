'use client';

import { useState, useEffect } from 'react';
import { ProposalCard } from './proposal-card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Plus, 
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ProposalStatus } from '@/types/enums';

interface Proposal {
  id: string;
  title: string;
  description?: string;
  status: ProposalStatus;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  client: {
    id: string;
    name: string;
    avatar?: string;
  };
  creator: {
    id: string;
    name: string;
    avatar?: string;
  };
  _count: {
    rooms: number;
    contracts: number;
  };
}

interface ProposalListProps {
  onCreateNew: () => void;
  onEdit: (proposal: Proposal) => void;
  onDelete: (proposalId: string) => void;
  onView: (proposal: Proposal) => void;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function ProposalList({ 
  onCreateNew, 
  onEdit, 
  onDelete, 
  onView 
}: ProposalListProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [refreshing, setRefreshing] = useState(false);

  const fetchProposals = async (page = 1, reset = false) => {
    try {
      if (reset) setLoading(true);
      else setRefreshing(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        sortBy,
        sortOrder
      });

      const response = await fetch(`/api/admin/proposals?${params}`);
      const data = await response.json();

      if (response.ok) {
        setProposals(data.proposals);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch proposals:', data.error);
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProposals(1, true);
  }, [search, statusFilter, sortBy, sortOrder]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handlePageChange = (newPage: number) => {
    fetchProposals(newPage);
  };

  const handleRefresh = () => {
    fetchProposals(pagination.page, true);
  };

  const handleDelete = async (proposalId: string) => {
    try {
      const response = await fetch(`/api/admin/proposals/${proposalId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setProposals(prev => prev.filter(p => p.id !== proposalId));
        setPagination(prev => ({ ...prev, total: prev.total - 1 }));
      } else {
        console.error('Failed to delete proposal');
      }
    } catch (error) {
      console.error('Error deleting proposal:', error);
    }
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: ProposalStatus.DRAFT, label: 'Draft' },
    { value: ProposalStatus.SENT, label: 'Sent' },
    { value: ProposalStatus.SEEN, label: 'Seen' },
    { value: ProposalStatus.ACCEPTED, label: 'Accepted' },
    { value: ProposalStatus.DECLINED, label: 'Declined' },
    { value: ProposalStatus.EXPIRED, label: 'Expired' },
    { value: ProposalStatus.WITHDRAWN, label: 'Withdrawn' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proposals</h1>
          <p className="text-gray-600">
            Manage and track all client proposals
          </p>
        </div>
        <Button onClick={onCreateNew} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Create Proposal
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search proposals..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-4">
        <Badge variant="secondary" className="px-3 py-1">
          Total: {pagination.total}
        </Badge>
        <Badge variant="outline" className="px-3 py-1">
          Page {pagination.page} of {pagination.pages}
        </Badge>
      </div>

      {/* Proposals Grid */}
      {proposals.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <FileText className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No proposals found
          </h3>
          <p className="text-gray-600 mb-4">
            {search || statusFilter 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by creating your first proposal'
            }
          </p>
          {!search && !statusFilter && (
            <Button onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Proposal
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                onEdit={onEdit}
                onDelete={handleDelete}
                onView={onView}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={pagination.page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
