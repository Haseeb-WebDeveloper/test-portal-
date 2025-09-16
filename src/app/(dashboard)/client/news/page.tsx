import { ClientNewsList } from '@/components/client/news-list';
import { prisma } from '@/lib/prisma';

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
  };
}

async function getInitialNews(): Promise<NewsItem[]> {
  const news = await prisma.news.findMany({
    where: { deletedAt: null },
    include: {
      creator: { select: { id: true, name: true, email: true, avatar: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 12,
  });

  return news.map((n) => ({
    id: n.id,
    title: n.title,
    description: n.description,
    content: n.content,
    featuredImage: n.featuredImage,
    sendTo: (n as any).sendTo ?? [],
    sendToAll: Boolean((n as any).sendToAll),
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
    creator: n.creator ?? { id: '', name: 'Unknown', email: '', avatar: null },
  }));
}

export default async function ClientNewsPage() {
  const initialNews = await getInitialNews();
  return (
    <div className="container mx-auto p-6 lg:px-12">
      <ClientNewsList initialNews={initialNews} />
    </div>
  );
}
