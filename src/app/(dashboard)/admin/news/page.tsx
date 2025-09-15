import { NewsList } from '@/components/admin/news-list';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

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
  } | null;
}

async function getNews(): Promise<NewsItem[]> {
  try {
    const news = await prisma.news.findMany({
      where: {
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
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 12
    });

    return news.map(item => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString()
    }));
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
}

export default async function NewsPage() {
  const initialNews = await getNews();

  return (
    <div className="container mx-auto py-6">
      <NewsList />
    </div>
  );
}