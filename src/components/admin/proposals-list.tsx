'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Plus, 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Calendar,
  User,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ProposalStatus } from '@/types/enums';

interface Proposal {
  id: string;
  title: string;
  description: string | null;
  status: ProposalStatus;
  hasReviewed: boolean;
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
}

interface ProposalsListProps {
  onCreateNew?: () => void;
  onEdit?: (proposal: Proposal) => void;
  onDelete?: (id: string) => void;
  onView?: (proposal: Proposal) => void;
}

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  SEEN: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  DECLINED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-orange-100 text-orange-800',
  WITHDRAWN: 'bg-purple-100 text-purple-800',
};

const statusIcons = {
  DRAFT: Clock,
  SENT: Send,
  SEEN: Eye,
  ACCEPTED: CheckCircle,
  DECLINED: XCircle,
  EXPIRED: Clock,
  WITHDRAWN: XCircle,
};

export function ProposalsList({ onCreateNew, onEdit, onDelete, onView }: ProposalsListProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchProposals = async (pageNum = 1, searchTerm = '', status = statusFilter, sort = sortBy, order = sortOrder) => {
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '12',
        search: searchTerm,
        status: status === 'all' ? '' : status,
        sortBy: sort,
        sortOrder: order
      });

      const response = await fetch(`/api/admin/proposals?${params}`);
      if (response.ok) {
        const data = await response.json();
        
        if (pageNum === 1) {
          setProposals(data.proposals);
        } else {
          setProposals(prev => [...prev, ...data.proposals]);
        }
        
        setTotalPages(data.pagination.pages);
        setHasMore(data.pagination.page < data.pagination.pages);
      } else {
        throw new Error('Failed to fetch proposals');
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
      toast.error('Failed to fetch proposals');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    fetchProposals(1, value, statusFilter, sortBy, sortOrder);
  };

  const handleFilter = (value: string) => {
    setStatusFilter(value);
    setPage(1);
    fetchProposals(1, search, value, sortBy, sortOrder);
  };

  const handleSort = (field: string) => {
    const newOrder = sortBy === field && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortBy(field);
    setSortOrder(newOrder);
    setPage(1);
    fetchProposals(1, search, statusFilter, field, newOrder);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProposals(nextPage, search, statusFilter, sortBy, sortOrder);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/proposals/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setProposals(prev => prev.filter(proposal => proposal.id !== id));
        toast.success('Proposal deleted successfully');
      } else {
        throw new Error('Failed to delete proposal');
      }
    } catch (error) {
      console.error('Error deleting proposal:', error);
      toast.error('Failed to delete proposal');
    }
  };

  const handleStatusChange = async (id: string, newStatus: ProposalStatus) => {
    try {
      const response = await fetch(`/api/admin/proposals/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setProposals(prev => 
          prev.map(proposal => 
            proposal.id === id 
              ? { ...proposal, status: newStatus }
              : proposal
          )
        );
        toast.success('Proposal status updated successfully');
      } else {
        throw new Error('Failed to update proposal status');
      }
    } catch (error) {
      console.error('Error updating proposal status:', error);
      toast.error('Failed to update proposal status');
    }
  };

  const filteredProposals = useMemo(() => {
    return proposals.filter(proposal => {
      const matchesSearch = proposal.title.toLowerCase().includes(search.toLowerCase()) ||
                           proposal.client.name.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [proposals, search]);

  if (isLoading && proposals.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Proposal Management</h1>
          <p className="text-muted-foreground">Create and manage client proposals</p>
        </div>
        <Button asChild>
          <Link href="/admin/proposal/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Proposal
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search proposals..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={handleFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="SEEN">Seen</SelectItem>
                  <SelectItem value="ACCEPTED">Accepted</SelectItem>
                  <SelectItem value="DECLINED">Declined</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value) => handleSort(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updatedAt">Last Updated</SelectItem>
                  <SelectItem value="createdAt">Date Created</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort(sortBy)}
                className="px-3"
              >
                {sortOrder === 'desc' ? (
                  <SortDesc className="h-4 w-4" />
                ) : (
                  <SortAsc className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proposals Grid */}
      {filteredProposals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No proposals found</h3>
              <p className="text-muted-foreground mb-4">
                {search || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria' 
                  : 'Get started by creating your first proposal'
                }
              </p>
              {!search && statusFilter === 'all' && (
                <Button asChild>
                  <Link href="/admin/proposal/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Proposal
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProposals.map((proposal) => {
              const StatusIcon = statusIcons[proposal.status];
              return (
                <Card key={proposal.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg line-clamp-2">{proposal.title}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          {proposal.client.name}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/proposal/${proposal.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View & Edit
                          </Link>
                        </DropdownMenuItem>
                          {proposal.status === ProposalStatus.DRAFT && (
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(proposal.id, ProposalStatus.SENT)}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Send
                            </DropdownMenuItem>
                          )}
                          {proposal.status === ProposalStatus.SENT && (
                            <>
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(proposal.id, ProposalStatus.ACCEPTED)}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark as Accepted
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(proposal.id, ProposalStatus.DECLINED)}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Mark as Declined
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem 
                            onClick={() => handleDelete(proposal.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Status */}
                    <div className="flex items-center gap-2">
                      <StatusIcon className="h-4 w-4" />
                      <Badge className={statusColors[proposal.status]}>
                        {proposal.status.replace('_', ' ')}
                      </Badge>
                      {proposal.hasReviewed && (
                        <Badge variant="outline" className="text-green-600">
                          Reviewed
                        </Badge>
                      )}
                    </div>

                    {/* Description */}
                    {proposal.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {proposal.description}
                      </p>
                    )}

                    {/* Dates */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Created {new Date(proposal.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Tags */}
                    {proposal.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {proposal.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {proposal.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{proposal.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Creator */}
                    {proposal.creator && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Created by {proposal.creator.name}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
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
