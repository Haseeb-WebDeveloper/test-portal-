"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Plus,
  Calendar,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { ProposalStatus } from "@/types/enums";
import { format } from "date-fns";

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

const statusInfoMap: Record<
  ProposalStatus,
  { color: string; label: string; icon: React.ElementType }
> = {
  DRAFT: {
    color: "bg-gray-100 text-gray-800",
    label: "Draft",
    icon: Clock,
  },
  SENT: {
    color: "bg-blue-100 text-blue-800",
    label: "Sent",
    icon: Send,
  },
  SEEN: {
    color: "bg-yellow-100 text-yellow-800",
    label: "Seen",
    icon: Eye,
  },
  ACCEPTED: {
    color: "bg-green-100 text-green-800",
    label: "Accepted",
    icon: CheckCircle,
  },
  DECLINED: {
    color: "bg-red-100 text-red-800",
    label: "Declined",
    icon: XCircle,
  },
  EXPIRED: {
    color: "bg-orange-100 text-orange-800",
    label: "Expired",
    icon: Clock,
  },
  WITHDRAWN: {
    color: "bg-purple-100 text-purple-800",
    label: "Withdrawn",
    icon: XCircle,
  },
};

export function ProposalsList({
  onCreateNew,
  onEdit,
  onDelete,
  onView,
}: ProposalsListProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchProposals = async (
    pageNum = 1,
    searchTerm = "",
    status = statusFilter,
    sort = sortBy,
    order = sortOrder
  ) => {
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "12",
        search: searchTerm,
        status: status === "all" ? "" : status,
        sortBy: sort,
        sortOrder: order,
      });

      const response = await fetch(`/api/admin/proposals?${params}`);
      if (response.ok) {
        const data = await response.json();

        if (pageNum === 1) {
          setProposals(data.proposals);
        } else {
          setProposals((prev) => [...prev, ...data.proposals]);
        }

        setTotalPages(data.pagination.pages);
        setHasMore(data.pagination.page < data.pagination.pages);
      } else {
        throw new Error("Failed to fetch proposals");
      }
    } catch (error) {
      console.error("Error fetching proposals:", error);
      toast.error("Failed to fetch proposals");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const newOrder = sortBy === field && sortOrder === "desc" ? "asc" : "desc";
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
        method: "DELETE",
      });

      if (response.ok) {
        setProposals((prev) => prev.filter((proposal) => proposal.id !== id));
        toast.success("Proposal deleted successfully");
      } else {
        throw new Error("Failed to delete proposal");
      }
    } catch (error) {
      console.error("Error deleting proposal:", error);
      toast.error("Failed to delete proposal");
    }
  };

  const handleStatusChange = async (id: string, newStatus: ProposalStatus) => {
    try {
      const response = await fetch(`/api/admin/proposals/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setProposals((prev) =>
          prev.map((proposal) =>
            proposal.id === id ? { ...proposal, status: newStatus } : proposal
          )
        );
        toast.success("Proposal status updated successfully");
      } else {
        throw new Error("Failed to update proposal status");
      }
    } catch (error) {
      console.error("Error updating proposal status:", error);
      toast.error("Failed to update proposal status");
    }
  };

  const filteredProposals = useMemo(() => {
    return proposals.filter((proposal) => {
      const matchesSearch =
        proposal.title.toLowerCase().includes(search.toLowerCase()) ||
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
      {/* Proposals List */}
      {filteredProposals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border rounded-lg">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">No proposals found</h3>
            <p className="text-muted-foreground mb-4">
              {search || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Get started by creating your first proposal"}
            </p>
            {!search && statusFilter === "all" && (
              <Button asChild>
                <Link href="/admin/proposal/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Proposal
                </Link>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-6">
            {filteredProposals.map((proposal) => {
              const statusInfo = statusInfoMap[proposal.status];
              const StatusIcon = statusInfo.icon;
              return (
                <Link
                  href={`/admin/proposal/${proposal.id}`}
                  key={proposal.id}
                  className="relative z-[20] flex flex-col lg:flex-row lg:w-[70%] cursor-pointer hover:shadow-lg transition-all duration-200 rounded-lg border"
                >
                  {/* Status Badge - Top Right */}
                  <div
                    className={`absolute border-t border-l border-r bottom-[101%] right-2 px-3.5 py-1.5 ${statusInfo.color} rounded-t-sm text-xs font-medium flex items-center gap-2`}
                  >
                    <StatusIcon className="h-4 w-4" />
                    <span>{statusInfo.label}</span>
                    {proposal.hasReviewed && (
                      <span className="ml-2 px-2 py-0.5 rounded bg-green-100 text-green-700 border border-green-200">
                        Reviewed
                      </span>
                    )}
                  </div>
                  {/* Left Section - Main Content */}

                  <div className="lg:w-[40%] p-5 space-y-6">
                    <h3 className="figma-paragraph-bold">{proposal.title}</h3>
                    <p className="figma-paragraph leading-relaxed">
                      {proposal.description || "No description provided"}
                    </p>
                  </div>
                  {/* Right Section - Metadata and Actions */}
                  <div className="z-20 p-5 min-h-full lg:border-l flex flex-col gap-4 justify-between">
                    {/* Tags */}
                    <div className="w-fit flex flex-wrap gap-2">
                      {proposal.tags && proposal.tags.length > 0 ? (
                        proposal.tags.slice(0, 3).map((tag, index) => (
                          <div
                            key={index}
                            className="px-2 py-1 text-sm rounded-xl border border-foreground/20 font-medium"
                          >
                            {tag}
                          </div>
                        ))
                      ) : (
                        <div className="px-2 py-1 text-sm rounded-xl border border-foreground/20 font-medium">
                          No tags
                        </div>
                      )}
                      {proposal.tags.length > 3 && (
                        <div className="px-2 py-1 text-xs rounded-xl border border-foreground/20 font-medium">
                          +{proposal.tags.length - 3}
                        </div>
                      )}
                    </div>
                    {/* Dates and Creator */}
                    <div className="w-fit flex flex-col gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(new Date(proposal.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
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
                  "Load More"
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
