'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar,
  Paperclip,
  MessageCircle,
  FileText
} from 'lucide-react';
import { ProposalStatus } from '@/types/enums';

interface Proposal {
  id: string;
  title: string;
  description: string | null;
  status: ProposalStatus;
  tags: string[];
  createdAt: string;
  media: any; // JSON field containing media files
}

interface ClientProposalCardProps {
  proposal: Proposal;
  onViewDetails: (proposal: Proposal) => void;
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

const statusLabels = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  SEEN: 'Seen',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  EXPIRED: 'Expired',
  WITHDRAWN: 'Withdrawn',
};

export function ClientProposalCard({ proposal, onViewDetails }: ClientProposalCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/20"
      onClick={() => onViewDetails(proposal)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-xl leading-tight mb-2 text-white">
              {proposal.title}
            </h3>
            {proposal.description && (
              <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                {proposal.description}
              </p>
            )}
          </div>
          <Badge 
            className={`${statusColors[proposal.status]} text-xs font-medium px-2 py-1`}
          >
            {statusLabels[proposal.status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Tags */}
        {proposal.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {proposal.tags.map((tag, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-xs bg-gray-700 text-gray-200 border-gray-600"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Files and Date */}
        <div className="flex items-center justify-between text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            <span>{proposal.media ? (Array.isArray(proposal.media) ? proposal.media.length : 1) : 0} files</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(proposal.createdAt)}</span>
          </div>
        </div>

        {/* Action Button */}
        <Button 
          variant="outline" 
          className="w-full bg-transparent border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-white"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(proposal);
          }}
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}
