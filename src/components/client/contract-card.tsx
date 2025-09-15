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
import { ContractStatus } from '@/types/enums';

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

interface ClientContractCardProps {
  contract: Contract;
  onViewDetails: (contract: Contract) => void;
}

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  TERMINATED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-orange-100 text-orange-800',
};

const statusLabels = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending Review',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  TERMINATED: 'Terminated',
  EXPIRED: 'Expired',
};

export function ClientContractCard({ contract, onViewDetails }: ClientContractCardProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
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
      onClick={() => onViewDetails(contract)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-xl leading-tight mb-2 text-white">
              {contract.title}
            </h3>
            {contract.description && (
              <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                {contract.description}
              </p>
            )}
          </div>
          <Badge 
            className={`${statusColors[contract.status]} text-xs font-medium px-2 py-1`}
          >
            {statusLabels[contract.status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Tags */}
        {contract.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {contract.tags.map((tag, index) => (
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

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Progress</span>
            <span className="text-white font-medium">{contract.progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-600 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${contract.progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Files and Date */}
        <div className="flex items-center justify-between text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            <span>{contract.media ? (Array.isArray(contract.media) ? contract.media.length : 1) : 0} files</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              {contract.startDate ? formatDate(contract.startDate) : 'No start date'}
              {contract.endDate && ` - ${formatDate(contract.endDate)}`}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <Button 
          variant="outline" 
          className="w-full bg-transparent border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-white"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(contract);
          }}
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}
