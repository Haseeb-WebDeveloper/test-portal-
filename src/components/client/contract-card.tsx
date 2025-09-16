'use client';

import { 
  Calendar,
  Paperclip,
} from 'lucide-react';
import { ContractStatus } from '@/types/enums';
import { format } from 'date-fns';

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
  createdAt?: string;
  mediaFilesCount?: number;
}

interface ClientContractCardProps {
  contract: Contract;
  onViewDetails: (contract: Contract) => void;
}

const statusInfoMap: Record<
  ContractStatus,
  { color: string; dotColor: string; label: string }
> = {
  DRAFT: {
    color: 'bg-gray-100 text-gray-800',
    dotColor: 'bg-gray-400',
    label: 'Draft',
  },
  PENDING_APPROVAL: {
    color: 'bg-yellow-100 text-yellow-800',
    dotColor: 'bg-yellow-400',
    label: 'Pending Approval',
  },
  ACTIVE: {
    color: 'bg-primary text-white',
    dotColor: 'bg-green-400',
    label: 'Active',
  },
  COMPLETED: {
    color: 'bg-blue-100 text-blue-800',
    dotColor: 'bg-blue-400',
    label: 'Completed',
  },
  TERMINATED: {
    color: 'bg-red-100 text-red-800',
    dotColor: 'bg-red-400',
    label: 'Terminated',
  },
  EXPIRED: {
    color: 'bg-orange-100 text-orange-800',
    dotColor: 'bg-orange-400',
    label: 'Expired',
  },
};

const progressBarGradient =
  'bg-gradient-to-r from-figma-primary to-figma-primary-purple-2';

export function ClientContractCard({ contract, onViewDetails }: ClientContractCardProps) {
  const statusInfo = statusInfoMap[contract.status];
  
  // Calculate file count
  const fileCount = contract.mediaFilesCount || 
    (contract.media ? (Array.isArray(contract.media) ? contract.media.length : 1) : 0);

  return (
    <div
      className="relative flex flex-col justify-between cursor-pointer rounded-tl-xl border border-primary/20 transition-all duration-200 min-h-[260px]"
      onClick={() => onViewDetails(contract)}
      tabIndex={0}
      role="button"
      aria-label={`View contract ${contract.title}`}
    >
      {/* Status Badge - Top Right */}
      <div className="absolute -top-[26px] right-0 z-10">
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-t-lg text-xs font-medium border border-b-0 ${statusInfo.color} shadow-sm`}
          style={{
            background:
              contract.status === 'ACTIVE'
                ? 'var(--primary)'
                : undefined,
          }}
        >
          <div
            className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`}
          ></div>
          <span>{statusInfo.label}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-5 pb-4 space-y-4">
        {/* Title */}
        <h3 className="text-xl font-bold leading-tight">
          {contract.title}
        </h3>

        {/* Description */}
        <p className="text-base line-clamp-2 leading-relaxed">
          {contract.description || 'No description provided'}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {contract.tags.slice(0, 3).map((tag) => (
            <div
              key={tag}
              className="px-3 py-1 text-sm rounded-lg border border-primary/30 font-medium bg-transparent"
            >
              {tag}
            </div>
          ))}
          {contract.tags.length > 3 && (
            <div className="px-3 py-1 text-sm rounded-lg border border-primary/30 bg-transparent">
              +{contract.tags.length - 3} more
            </div>
          )}
        </div>
      </div>

      {/* Footer - Progress Bar and Date/Files */}
      <div>
        {/* Progress Bar */}
        <div className="space-y-2 pt-2 px-5">
          <div className="flex items-center gap-2">
            <div className="w-full bg-muted rounded-full h-1.5 relative">
              <div
                className={`${progressBarGradient} h-2 rounded-full transition-all duration-300`}
                style={{
                  width: `${contract.progressPercentage}%`,
                }}
              ></div>
            </div>
            <span
              className="text-sm font-medium pl-2"
              style={{ minWidth: 40 }}
            >
              {contract.progressPercentage}%
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between text-base border-t border-border px-5 py-3 mt-2">
          <div className="flex items-center gap-2">
            <Paperclip className="w-5 h-5" />
            <span>
              {fileCount} files
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <span>
              {contract.createdAt ? 
                format(new Date(contract.createdAt), 'do MMM, yyyy') :
                (contract.startDate ? format(new Date(contract.startDate), 'do MMM, yyyy') : 'No date')
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
