// ISR: Revalidate every 60 seconds
export const revalidate = 60;

import { ContractsList } from "@/components/admin/contracts-list";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ContractStatus } from "@/types/enums";

async function getInitialContracts() {
  const contracts = await prisma.contract.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: "desc" },
    take: 12,
    include: {
      client: { select: { id: true, name: true, avatar: true } },
      creator: { select: { id: true, name: true, email: true } },
      assignments: {
        where: { isActive: true },
        select: {
          id: true,
          role: true,
          user: { select: { id: true, name: true, avatar: true } },
        },
      },
    },
  });

  // Shape matches ContractsList expectations
  return contracts.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    status: c.status as unknown as ContractStatus,
    startDate: c.startDate ? c.startDate.toISOString() : null,
    endDate: c.endDate ? c.endDate.toISOString() : null,
    currency: c.currency,
    budget: c.budget != null ? Number(c.budget) : null,
    estimatedHours: c.estimatedHours,
    actualHours: c.actualHours ?? 0,
    progressPercentage: c.progressPercentage ?? 0,
    priority: c.priority,
    tags: c.tags ?? [],
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    client: c.client,
    creator: c.creator,
    assignments: c.assignments,
    mediaFilesCount: Array.isArray((c as any).media) ? (c as any).media.length : 0,
  }));
}

export default async function ContractsPage() {
  const initialContracts = await getInitialContracts();

  return (
    <div className="space-y-6 p-6 lg:px-12">
      <div className="flex items-center justify-between mb-16">
        <h1 className="figma-h3">Contract</h1>
        <Link
          href="/admin/contracts/create"
          className="w-full md:w-fit cursor-pointer px-6 py-2 bg-gradient-to-r from-[#6B42D1] to-[#FF2AFF] rounded-lg transition-all"
        >
          Create Contract
        </Link>
      </div>

      <ContractsList initialContracts={initialContracts} />
    </div>
  );
}
