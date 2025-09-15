'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Search } from 'lucide-react';
import { ClientContractCard } from '@/components/client/contract-card';
import { ContractDetailModal } from '@/components/client/contract-detail-modal';
import { ContractStatus } from '@/types/enums';
import { useRouter } from 'next/navigation';

interface Contract {
  id: string;
  title: string;
  description: string | null;
  status: ContractStatus;
  progressPercentage: number;
  tags: string[];
  startDate: string | null;
  endDate: string | null;
  media: any; // JSON field containing media files
}

// Client component - no revalidate needed

export default function ClientContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const fetchContracts = async () => {
    try {
      const params = new URLSearchParams({
        search,
        status: statusFilter === 'all' ? '' : statusFilter,
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      });

      const response = await fetch(`/api/client/contracts?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setContracts(data.contracts);
      } else {
        const errorData = await response.json();
        console.error('🔍 API Error:', errorData);
        throw new Error('Failed to fetch contracts');
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [search, statusFilter]);

  const handleViewDetails = (contract: Contract) => {
    setSelectedContract(contract);
    setIsModalOpen(true);
  };

  const handleMessage = (contract: Contract) => {
    // Navigate to messages page with contract context
    router.push(`/messages?contract=${contract.id}`);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedContract(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Your Contracts</h1>
        <p className="text-gray-400">View and manage your contracts</p>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search contracts..."
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
                <SelectItem value="PENDING_APPROVAL">Pending Review</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="TERMINATED">Terminated</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Grid */}
      {contracts.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2 text-white">No contracts found</h3>
              <p className="text-gray-400 mb-4">
                {search || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria' 
                  : 'You don\'t have any contracts yet'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contracts.map((contract) => (
            <ClientContractCard
              key={contract.id}
              contract={contract}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      {/* Contract Detail Modal */}
      <ContractDetailModal
        contract={selectedContract}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onMessage={handleMessage}
      />
    </div>
  );
}
