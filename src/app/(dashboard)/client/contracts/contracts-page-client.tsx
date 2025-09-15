"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ClientContractCard } from "@/components/client/contract-card";
import { ContractDetailModal } from "@/components/client/contract-detail-modal";
import { ContractStatus } from "@/types/enums";
import { useRouter } from "next/navigation";

interface ContractItem {
  id: string;
  title: string;
  description: string | null;
  status: ContractStatus;
  progressPercentage: number;
  tags: string[];
  startDate: string | null;
  endDate: string | null;
  media: any;
}

export function ClientContractsPageClient({ initialContracts }: { initialContracts: ContractItem[] }) {
  const [contracts, setContracts] = useState<ContractItem[]>(initialContracts);
  const [isLoading, setIsLoading] = useState(initialContracts.length === 0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedContract, setSelectedContract] = useState<ContractItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const fetchContracts = async () => {
    try {
      const params = new URLSearchParams({
        search,
        status: statusFilter === "all" ? "" : statusFilter,
        sortBy: "updatedAt",
        sortOrder: "desc",
      });

      const response = await fetch(`/api/client/contracts?${params}`);
      if (response.ok) {
        const data = await response.json();
        setContracts(data.contracts);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialContracts.length === 0) {
      fetchContracts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (initialContracts.length > 0) {
      // On filters/search change, refetch
      fetchContracts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  const handleViewDetails = (contract: ContractItem) => {
    setSelectedContract(contract);
    setIsModalOpen(true);
  };

  const handleMessage = (contract: ContractItem) => {
    router.push(`/messages?contract=${contract.id}`);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedContract(null);
  };

  if (isLoading && contracts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <>
      {contracts.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2 text-white">No contracts found</h3>
              <p className="text-gray-400 mb-4">
                {search || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "You don't have any contracts yet"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contracts.map((contract) => (
            <ClientContractCard key={contract.id} contract={contract} onViewDetails={handleViewDetails} />
          ))}
        </div>
      )}

      <ContractDetailModal
        contract={selectedContract}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onMessage={handleMessage}
      />
    </>
  );
}


