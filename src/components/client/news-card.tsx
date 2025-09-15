'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
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

interface ClientNewsCardProps {
  news: NewsItem;
}

export function ClientNewsCard({ news }: ClientNewsCardProps) {
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
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
  );
}
