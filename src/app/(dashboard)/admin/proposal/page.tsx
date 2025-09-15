// ISR: Revalidate every 60 seconds
export const revalidate = 60;

import { ProposalsList } from "@/components/admin/proposals-list";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProposalStatus } from "@/types/enums";

async function getInitialProposals() {
  const proposals = await prisma.proposal.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: "desc" },
    take: 12,
    include: {
      client: { select: { id: true, name: true, avatar: true } },
      creator: { select: { id: true, name: true, email: true } },
    },
  });

  return proposals.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    status: p.status as unknown as ProposalStatus,
    hasReviewed: Boolean((p as any).hasReviewed),
    tags: Array.isArray(p.tags) ? p.tags : [],
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    client: p.client,
    creator: p.creator,
  }));
}

export default async function AdminProposalsPage() {
  const initialProposals = await getInitialProposals();

  return (
    <div className="space-y-6 p-6 lg:px-12">
      <div className="flex items-center justify-between mb-16">
        <div>
          <h1 className="figma-h3">Proposal</h1>
        </div>

        <Link
          href="/admin/proposal/create"
          className="w-full md:w-fit cursor-pointer px-6 py-2 bg-figma-active-sidebar-gradient rounded-lg transition-all"
        >
          Create Proposal
        </Link>
      </div>

      <ProposalsList initialProposals={initialProposals} />
    </div>
  );
}
