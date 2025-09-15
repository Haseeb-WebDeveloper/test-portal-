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
  DollarSign,
  Clock,
  User,
  MoreVertical,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
}

interface ContractsListProps {}

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  TERMINATED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-orange-100 text-orange-800',
};

const priorityColors = {
  1: 'bg-red-100 text-red-800',
  2: 'bg-orange-100 text-orange-800',
  3: 'bg-yellow-100 text-yellow-800',
  4: 'bg-green-100 text-green-800',
  5: 'bg-blue-100 text-blue-800',
};

export function ContractsList({}: ContractsListProps) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchContracts = async (pageNum = 1, searchTerm = '', status = statusFilter, priority = priorityFilter, sort = sortBy, order = sortOrder) => {
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '12',
        search: searchTerm,
        status: status === 'all' ? '' : status,
        priority: priority === 'all' ? '' : priority,
        sortBy: sort,
        sortOrder: order
      });

      const response = await fetch(`/api/admin/contracts?${params}`);
      if (response.ok) {
        const data = await response.json();
        
        if (pageNum === 1) {
          setContracts(data.contracts);
        } else {
          setContracts(prev => [...prev, ...data.contracts]);
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
    fetchContracts();
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
    fetchContracts(nextPage, search, statusFilter, priorityFilter, sortBy, sortOrder);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/contracts/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setContracts(prev => prev.filter(contract => contract.id !== id));
        toast.success('Contract deleted successfully');
      } else {
        throw new Error('Failed to delete contract');
      }
    } catch (error) {
      console.error('Error deleting contract:', error);
      toast.error('Failed to delete contract');
    }
  };

  const filteredContracts = useMemo(() => {
    return contracts.filter(contract => {
      const matchesSearch = contract.title.toLowerCase().includes(search.toLowerCase()) ||
                           contract.client.name.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [contracts, search]);

  if (isLoading && contracts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search contracts..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(value) => handleFilter('status', value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PENDING_APPROVAL">Pending</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="TERMINATED">Terminated</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={(value) => handleFilter('priority', value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="1">Critical</SelectItem>
                  <SelectItem value="2">High</SelectItem>
                  <SelectItem value="3">Medium</SelectItem>
                  <SelectItem value="4">Low</SelectItem>
                  <SelectItem value="5">Very Low</SelectItem>
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
                  <SelectItem value="progressPercentage">Progress</SelectItem>
                  <SelectItem value="budget">Budget</SelectItem>
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

      {/* Contracts Grid */}
      {filteredContracts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No contracts found</h3>
              <p className="text-muted-foreground mb-4">
                {search || statusFilter !== 'all' || priorityFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria' 
                  : 'Get started by creating your first contract'
                }
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
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContracts.map((contract) => (
              <Card key={contract.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg line-clamp-2">{contract.title}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        {contract.client.name}
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
                          <Link href={`/admin/contracts/${contract.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View & Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(contract.id)}
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
                  {/* Status and Priority */}
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[contract.status]}>
                      {contract.status.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline" className={priorityColors[contract.priority as keyof typeof priorityColors]}>
                      Priority {contract.priority}
                    </Badge>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{contract.progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${contract.progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Budget and Hours */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Budget:</span>
                      <span className="font-medium">
                        {contract.budget ? `${contract.currency} ${contract.budget.toLocaleString()}` : 'Not set'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Hours:</span>
                      <span className="font-medium">
                        {contract.actualHours}/{contract.estimatedHours || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {contract.startDate 
                        ? new Date(contract.startDate).toLocaleDateString()
                        : 'No start date'
                      }
                      {contract.endDate && ` - ${new Date(contract.endDate).toLocaleDateString()}`}
                    </span>
                  </div>

                  {/* Tags */}
                  {contract.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {contract.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {contract.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{contract.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Team Members */}
                  {contract.assignments.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm text-muted-foreground">Team:</span>
                      <div className="flex -space-x-2">
                        {contract.assignments.slice(0, 3).map((assignment) => (
                          <div
                            key={assignment.id}
                            className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium"
                            title={assignment.user.name}
                          >
                            {assignment.user.avatar ? (
                              <img 
                                src={assignment.user.avatar} 
                                alt={assignment.user.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              assignment.user.name.charAt(0).toUpperCase()
                            )}
                          </div>
                        ))}
                        {contract.assignments.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium">
                            +{contract.assignments.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
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
