"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Search } from "lucide-react";
import { ClientProposalCard } from "@/components/client/proposal-card";
import { ProposalDetailModal } from "@/components/client/proposal-detail-modal";
import { ProposalStatus } from "@/types/enums";
import { useRouter } from "next/navigation";

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

export function ClientProposalPageClient({
  initialProposals,
}: ClientProposalPageClientProps) {
  const [proposals, setProposals] = useState<Proposal[]>(initialProposals);
  const [isLoading, setIsLoading] = useState(initialProposals.length === 0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const fetchProposals = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        status: statusFilter === "all" ? "" : statusFilter,
        sortBy: "updatedAt",
        sortOrder: "desc",
      });

      const response = await fetch(`/api/client/proposals?${params}`);

      if (response.ok) {
        const data = await response.json();
        setProposals(data.proposals);
      } else {
        const errorData = await response.json();
        console.error("🔍 API Error:", errorData);
        throw new Error("Failed to fetch proposals");
      }
    } catch (error) {
      console.error("Error fetching proposals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (
      initialProposals.length > 0 &&
      search === "" &&
      statusFilter === "all"
    ) {
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

      {/* Proposals Grid */}
      {proposals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">
              No proposals found
            </h3>
            <p className="mb-4">
              {search || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "You don't have any proposals yet"}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-1 gap-6">
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
