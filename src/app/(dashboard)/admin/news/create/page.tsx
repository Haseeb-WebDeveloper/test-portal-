import { NewsFormWrapper } from '@/components/admin/news-form-wrapper';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

export default async function CreateNewsPage() {
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

  return (
    <div className="container mx-auto py-6">
      <NewsFormWrapper />
    </div>
  );
}
