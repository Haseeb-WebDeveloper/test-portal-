'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar,
  Paperclip,
  MessageCircle,
  FileText,
  X,
  Download,
  Eye
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

interface ProposalDetailModalProps {
  proposal: Proposal | null;
  isOpen: boolean;
  onClose: () => void;
  onMessage: (proposal: Proposal) => void;
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

export function ProposalDetailModal({ proposal, isOpen, onClose, onMessage }: ProposalDetailModalProps) {
  if (!proposal) return null;

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

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    return '📎';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gray-900 border-gray-700 text-white">
        <DialogHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Badge 
                className={`${statusColors[proposal.status]} text-xs font-medium px-2 py-1`}
              >
                {statusLabels[proposal.status]}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <DialogTitle className="text-2xl font-bold text-white">
            {proposal.title}
          </DialogTitle>
          
          {proposal.description && (
            <p className="text-gray-300 text-sm leading-relaxed">
              {proposal.description}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Tags */}
          {proposal.tags.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-300">Tags</h4>
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
            </div>
          )}

          {/* Media Files */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-300">Attached Files</h4>
            {proposal.media && Array.isArray(proposal.media) && proposal.media.length > 0 ? (
              <div className="space-y-2">
                {proposal.media.map((file: any, index: number) => (
                  <div 
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <div className="text-2xl">
                      {getFileIcon(file.fileType || 'application/octet-stream')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{file.fileName || file.name || 'Unknown file'}</p>
                      <p className="text-xs text-gray-400">{formatFileSize(file.fileSize || file.size || 0)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                        onClick={() => window.open(file.fileUrl || file.url, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = file.fileUrl || file.url;
                          link.download = file.fileName || file.name || 'download';
                          link.click();
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No media files attached</p>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="pt-4 border-t border-gray-700">
            <div className="text-center">
              <p className="text-sm text-gray-300 mb-4">Interested in this offer?</p>
              <Button 
                onClick={() => onMessage(proposal)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Message us
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
