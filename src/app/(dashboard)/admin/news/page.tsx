import { NewsList } from "@/components/admin/news-list";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import Link from 'next/link';
import { redirect } from "next/navigation";

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
        deletedAt: null,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 12,
    });

    return news.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
}

export default async function NewsPage() {
  const initialNews = await getNews();

  return (
    <div className="container mx-auto p-6 lg:px-12">
      <div className="flex justify-between items-center mb-12">
        <h1 className="figma-h3">Client News posts</h1>
        <Link
          href="/admin/news/create"
          className="w-full md:w-fit cursor-pointer bg-gradient-to-r from-[#6B42D1] to-[#FF2AFF] px-6 py-2 rounded-lg transition-all"
        >
          Create News
        </Link>
      </div>
      <NewsList />
    </div>
  );
}
