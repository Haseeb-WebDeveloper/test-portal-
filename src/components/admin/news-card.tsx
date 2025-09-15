'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
  Users, 
  Globe,
  Calendar,
  User
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface NewsItem {
  id: string;
  title: string;
  description: string | null;
  content: string;
  featuredImage: string | null;
  sendTo: string[];
  sendToAll: boolean;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

interface NewsCardProps {
  news: NewsItem;
  onEdit: (news: NewsItem) => void;
  onDelete: (id: string) => void;
}

export function NewsCard({ news, onEdit, onDelete }: NewsCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(news.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting news:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <>
      <Card className="group hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg leading-tight mb-2">
                {news.title}
              </h3>
              {news.description && (
                <p className="text-muted-foreground text-sm mb-3">
                  {truncateText(news.description, 120)}
                </p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/admin/news/${news.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(news)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Featured Image */}
          {news.featuredImage && (
            <div className="mb-4">
              <img
                src={news.featuredImage}
                alt={news.title}
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Content Preview */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              {truncateText(news.content, 200)}
            </p>
          </div>

          {/* Recipients */}
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {news.sendToAll ? (
                <>
                  <Globe className="h-4 w-4" />
                  <span>All users</span>
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  <span>{news.sendTo.length} selected users</span>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={news.creator.avatar || ''} />
                <AvatarFallback className="text-xs">
                  {news.creator.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span>{news.creator.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDistanceToNow(new Date(news.createdAt), { addSuffix: true })}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete News</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{news.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
