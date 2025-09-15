import { ClientNewsList } from '@/components/client/news-list';

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

export default function ClientNewsPage() {
  return (
    <div className="container mx-auto py-6">
      <ClientNewsList />
    </div>
  );
}
