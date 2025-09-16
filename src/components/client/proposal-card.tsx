'use client';

import { 
  Calendar,
  Clock,
  Send,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { ProposalStatus } from '@/types/enums';
import { format } from 'date-fns';

interface Proposal {
  id: string;
  title: string;
  description: string | null;
  status: ProposalStatus;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
  media: any; // JSON field containing media files
  hasReviewed?: boolean;
}

interface ClientProposalCardProps {
  proposal: Proposal;
  onViewDetails: (proposal: Proposal) => void;
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

export function ClientProposalCard({ proposal, onViewDetails }: ClientProposalCardProps) {
  const statusInfo = statusInfoMap[proposal.status];
  const StatusIcon = statusInfo.icon;

  return (
    <div
      className="relative z-[20] flex flex-col lg:flex-row lg:w-[70%] cursor-pointer hover:shadow-lg transition-all duration-200 rounded-lg border"
      onClick={() => onViewDetails(proposal)}
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
    </div>
  );
}
