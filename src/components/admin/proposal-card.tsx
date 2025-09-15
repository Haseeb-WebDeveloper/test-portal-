'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  MessageSquare, 
  FileText,
  Calendar,
  User
} from 'lucide-react';
import { ProposalStatus } from '@/types/enums';
import { formatDistanceToNow } from 'date-fns';

interface Proposal {
  id: string;
  title: string;
  description?: string;
  status: ProposalStatus;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  client: {
    id: string;
    name: string;
    avatar?: string;
  };
  creator: {
    id: string;
    name: string;
    avatar?: string;
  };
  _count: {
    rooms: number;
    contracts: number;
  };
}

interface ProposalCardProps {
  proposal: Proposal;
  onEdit: (proposal: Proposal) => void;
  onDelete: (proposalId: string) => void;
  onView: (proposal: Proposal) => void;
}

const statusColors = {
  [ProposalStatus.DRAFT]: 'bg-gray-100 text-gray-800',
  [ProposalStatus.SENT]: 'bg-blue-100 text-blue-800',
  [ProposalStatus.SEEN]: 'bg-yellow-100 text-yellow-800',
  [ProposalStatus.ACCEPTED]: 'bg-green-100 text-green-800',
  [ProposalStatus.DECLINED]: 'bg-red-100 text-red-800',
  [ProposalStatus.EXPIRED]: 'bg-orange-100 text-orange-800',
  [ProposalStatus.WITHDRAWN]: 'bg-purple-100 text-purple-800',
};

const statusLabels = {
  [ProposalStatus.DRAFT]: 'Draft',
  [ProposalStatus.SENT]: 'Sent',
  [ProposalStatus.SEEN]: 'Seen',
  [ProposalStatus.ACCEPTED]: 'Accepted',
  [ProposalStatus.DECLINED]: 'Declined',
  [ProposalStatus.EXPIRED]: 'Expired',
  [ProposalStatus.WITHDRAWN]: 'Withdrawn',
};

export default function ProposalCard({ proposal, onEdit, onDelete, onView }: ProposalCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = () => {
    onDelete(proposal.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                {proposal.title}
              </CardTitle>
              {proposal.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {proposal.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Badge 
                className={`${statusColors[proposal.status]} text-xs font-medium`}
              >
                {statusLabels[proposal.status]}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(proposal)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(proposal)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Client Info */}
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={proposal.client.avatar} />
                <AvatarFallback className="text-xs">
                  {proposal.client.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-gray-900">
                {proposal.client.name}
              </span>
            </div>

            {/* Creator Info */}
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                Created by {proposal.creator.name}
              </span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>{proposal._count.rooms} rooms</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>{proposal._count.contracts} contracts</span>
              </div>
            </div>

            {/* Tags */}
            {proposal.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {proposal.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {proposal.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{proposal.tags.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            {/* Timestamp */}
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Calendar className="h-3 w-3" />
              <span>
                Updated {formatDistanceToNow(new Date(proposal.updatedAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Proposal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{proposal.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
