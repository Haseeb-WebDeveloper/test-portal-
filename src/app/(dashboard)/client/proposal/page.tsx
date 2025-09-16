import { ClientProposalPageClient } from './proposal-page-client';
import { prisma } from '@/lib/prisma';
import { ProposalStatus } from '@/types/enums';
import { JsonValue } from '@prisma/client/runtime/library';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

interface ProposalItem {
  id: string;
  title: string;
  description: string | null;
  status: ProposalStatus;
  tags: string[];
  createdAt: string;
  media: JsonValue;
}

async function getInitialProposals(): Promise<ProposalItem[]> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
    select: { 
      id: true, 
      role: true,
      clientMemberships: {
        where: { isActive: true },
        select: { clientId: true }
      }
    }
  });

  if (!dbUser || (dbUser.role !== 'CLIENT' && dbUser.role !== 'CLIENT_MEMBER') || !dbUser.clientMemberships.length) {
    redirect('/unauthorized');
  }

  const clientIds = dbUser.clientMemberships.map(m => m.clientId);

  const proposals = await prisma.proposal.findMany({
    where: {
      deletedAt: null,
      clientId: { in: clientIds },
    },
    orderBy: { createdAt: 'desc' },
    take: 12,
  });

  return proposals.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    status: p.status as unknown as ProposalStatus,
    tags: p.tags,
    createdAt: p.createdAt.toISOString(),
    media: p.media,
  }));
}

export default async function ClientProposalPage() {
  const initialProposals = await getInitialProposals();

  return (
    <div className="space-y-6 p-6 lg:px-12">
      {/* Header */}
      <div>
        <h1 className="figma-h3">Your Proposals</h1>
      </div>
      <ClientProposalPageClient initialProposals={initialProposals} />
    </div>
  );
}