import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { NewsFormWrapper } from '@/components/admin/news-form-wrapper';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

interface EditNewsPageProps {
  params: Promise<{ id: string }>;
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

export default async function EditNewsPage({ params }: EditNewsPageProps) {
  const { id } = await params;
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

  const news = await getNews(id);

  if (!news) {
    notFound();
  }

  const initialData = {
    id: news.id,
    title: news.title,
    description: news.description || '',
    content: news.content,
    featuredImage: news.featuredImage,
    sendTo: news.sendTo,
    sendToAll: news.sendToAll
  };

  return (
    <div className="container mx-auto py-6">
      <NewsFormWrapper 
        initialData={initialData}
        isEdit={true}
      />
    </div>
  );
}
