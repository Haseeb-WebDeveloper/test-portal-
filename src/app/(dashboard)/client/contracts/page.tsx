"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ClientContractCard } from "@/components/client/contract-card";
import { ContractDetailModal } from "@/components/client/contract-detail-modal";
import { ContractStatus } from "@/types/enums";
import { useRouter } from "next/navigation";

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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null
  );
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
      } else {
        const errorData = await response.json();
        console.error("🔍 API Error:", errorData);
        throw new Error("Failed to fetch contracts");
      }
    } catch (error) {
      console.error("Error fetching contracts:", error);
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
    <div className="space-y-6 p-6 lg:px-12">
      {/* Header */}
      <div>
        <h1 className="figma-h3">Your Contracts</h1>
      </div>

      {/* Contracts Grid */}
      {contracts.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2 text-white">
                No contracts found
              </h3>
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
