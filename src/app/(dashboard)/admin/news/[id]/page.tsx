

import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  User, 
  Globe, 
  Users, 
  Edit, 
  ArrowLeft 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

interface NewsPageProps {
  params: { id: string };
}

async function getNews(id: string) {
  try {
    const news = await prisma.news.findUnique({
      where: { 
        id,
        deletedAt: null
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    if (!news) {
      return null;
    }

    return {
      ...news,
      createdAt: news.createdAt.toISOString(),
      updatedAt: news.updatedAt.toISOString()
    };
  } catch (error) {
    console.error('Error fetching news:', error);
    return null;
  }
}

export default async function NewsDetailPage({ params }: NewsPageProps) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Check if user is admin
  const userRecord = await prisma.user.findUnique({
    where: { authId: user.id },
    include: { agencyMembership: true }
  });

  if (!userRecord || userRecord.role !== 'PLATFORM_ADMIN') {
    redirect('/unauthorized');
  }

  const news = await getNews(params.id);

  if (!news) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/news">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to News
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{news.title}</h1>
            <p className="text-muted-foreground">
              Created {formatDistanceToNow(new Date(news.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/admin/news/${news.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Featured Image */}
          {news.featuredImage && (
            <Card>
              <CardContent className="p-0">
                <img
                  src={news.featuredImage}
                  alt={news.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {news.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{news.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap">{news.content}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
           {/* Creator Info */}
           <Card>
             <CardHeader>
               <CardTitle>Created By</CardTitle>
             </CardHeader>
             <CardContent>
               {news.creator ? (
                 <div className="flex items-center gap-3">
                   <Avatar>
                     <AvatarImage src={news.creator.avatar || ''} />
                     <AvatarFallback>
                       {news.creator.name.charAt(0).toUpperCase()}
                     </AvatarFallback>
                   </Avatar>
                   <div>
                     <p className="font-medium">{news.creator.name}</p>
                     <p className="text-sm text-muted-foreground">{news.creator.email}</p>
                   </div>
                 </div>
               ) : (
                 <p className="text-muted-foreground">Unknown creator</p>
               )}
             </CardContent>
           </Card>

          {/* Recipients */}
          <Card>
            <CardHeader>
              <CardTitle>Recipients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {news.sendToAll ? (
                  <>
                    <Globe className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">All users</span>
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{news.sendTo.length} selected users</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Created {formatDistanceToNow(new Date(news.createdAt), { addSuffix: true })}</span>
              </div>
              {news.updatedAt !== news.createdAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Updated {formatDistanceToNow(new Date(news.updatedAt), { addSuffix: true })}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
