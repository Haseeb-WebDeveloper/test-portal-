'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Search } from 'lucide-react';
import { ClientProposalCard } from '@/components/client/proposal-card';
import { ProposalDetailModal } from '@/components/client/proposal-detail-modal';
import { ProposalStatus } from '@/types/enums';
import { useRouter } from 'next/navigation';

interface Proposal {
  id: string;
  title: string;
  description: string | null;
  status: ProposalStatus;
  tags: string[];
  createdAt: string;
  media: any; // JSON field containing media files
}

interface ClientProposalPageClientProps {
  initialProposals: Proposal[];
}

export function ClientProposalPageClient({ initialProposals }: ClientProposalPageClientProps) {
  const [proposals, setProposals] = useState<Proposal[]>(initialProposals);
  const [isLoading, setIsLoading] = useState(initialProposals.length === 0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const fetchProposals = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        status: statusFilter === 'all' ? '' : statusFilter,
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      });

      const response = await fetch(`/api/client/proposals?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setProposals(data.proposals);
      } else {
        const errorData = await response.json();
        console.error('🔍 API Error:', errorData);
        throw new Error('Failed to fetch proposals');
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialProposals.length > 0 && search === '' && statusFilter === 'all') {
      setIsLoading(false);
      return;
    }
    fetchProposals();
  }, [search, statusFilter]);

  const handleViewDetails = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setIsModalOpen(true);
  };

  const handleMessage = (proposal: Proposal) => {
    // Navigate to messages page with proposal context
    router.push(`/messages?proposal=${proposal.id}`);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProposal(null);
  };

  if (isLoading && proposals.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-gray-700">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search proposals..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
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
          </div>
        </CardContent>
      </Card>

      {/* Proposals Grid */}
      {proposals.length === 0 ? (
        <Card className="border-gray-700">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2 text-white">No proposals found</h3>
              <p className="text-gray-400 mb-4">
                {search || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria' 
                  : 'You don\'t have any proposals yet'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {proposals.map((proposal) => (
            <ClientProposalCard
              key={proposal.id}
              proposal={proposal}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      {/* Proposal Detail Modal */}
      <ProposalDetailModal
        proposal={selectedProposal}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onMessage={handleMessage}
      />
    </div>
  );
}
