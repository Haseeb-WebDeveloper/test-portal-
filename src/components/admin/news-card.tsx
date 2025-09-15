'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
import { Users, Calendar } from 'lucide-react';

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

  const getInitials = (fullName?: string | null) => {
    if (!fullName) return 'AC';
    const parts = fullName.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return 'AC';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <>
      <div className="relative">
        <div className="absolute -top-[26px] right-0 z-10">
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-t-lg text-xs font-medium border border-b-0 bg-green-500 shadow-sm`}
            style={{ background: 'var(--primary)' }}
          >
            <div className={`w-2 h-2 rounded-full bg-green-500`}></div>
            <span>Active</span>
          </div>
        </div>

        <Link
          href={`/admin/news/${news.id}`}
          className="block rounded-xl overflow-hidden border border-primary/20 transition-all duration-300 group"
        >
          <div className="flex flex-col lg:flex-row">
            {news.featuredImage && news.featuredImage.trim() !== '' && (
              <div className="lg:w-1/2 relative">
                <Image
                  src={news.featuredImage}
                  alt={news.title}
                  width={400}
                  height={300}
                  className="object-cover w-full h-48 lg:h-64"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            )}

            <div className={`${news.featuredImage ? 'lg:w-2/3' : 'w-full'} p-6 flex flex-col gap-6 justify-between`}>
              <div className="space-y-6">
                <h2 className="text-2xl font-bold  mb-3 transition-colors">{news.title}</h2>

                <p className="figma-paragraph mb-4 line-clamp-2">
                  {news.description || 'Leverage our AI services and be in the top 1%. Lorem ipsum dolor sit amet...'}
                </p>

                <div className="flex items-center gap-3 mb-4">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-foreground/10 border border-primary/20 flex items-center justify-center text-xs font-medium">
                      {getInitials(news.creator?.name)}
                    </div>
                    {news.sendToAll && (
                      <div className="w-8 h-8 rounded-full bg-purple-600 border-2 border-white/20 flex items-center justify-center text-xs font-medium">
                        ALL
                      </div>
                    )}
                  </div>

                  <div className="text-foreground/70 text-sm">
                    <Users className="w-4 h-4 inline mr-1" />
                    {news.sendToAll ? 'Shared with all clients' : `Shared with ${news.sendTo.length} specific clients`}
                  </div>
                </div>
              </div>

              <div className="flex items-center /60 text-sm">
                <Calendar className="w-4 h-4 mr-2" />
                {formatDate(news.createdAt)}
              </div>
            </div>
          </div>
        </Link>
      </div>

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
