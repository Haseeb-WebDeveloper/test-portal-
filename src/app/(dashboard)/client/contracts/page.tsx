import { prisma } from "@/lib/prisma";
import { ClientContractsPageClient } from "./contracts-page-client";
import { ContractStatus } from "@/types/enums";

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

interface ContractItem {
  id: string;
  title: string;
  description: string | null;
  status: ContractStatus;
  progressPercentage: number;
  tags: string[];
  startDate: string | null;
  endDate: string | null;
  media: any;
}

async function getInitialContracts(): Promise<ContractItem[]> {
  const contracts = await prisma.contract.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: "desc" },
    take: 12,
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      progressPercentage: true,
      tags: true,
      startDate: true,
      endDate: true,
      media: true,
    },
  });

  return contracts.map((c) => ({
    ...c,
    status: c.status as unknown as ContractStatus,
    startDate: c.startDate ? c.startDate.toISOString() : null,
    endDate: c.endDate ? c.endDate.toISOString() : null,
  }));
}

export default async function ClientContractsPage() {
  const initialContracts = await getInitialContracts();

  return (
    <div className="space-y-6 p-6 lg:px-12">
      <div>
        <h1 className="figma-h3">Your Contracts</h1>
      </div>
      <ClientContractsPageClient initialContracts={initialContracts} />
    </div>
  );
}
