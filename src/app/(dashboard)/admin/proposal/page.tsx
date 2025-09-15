// ISR: Revalidate every 60 seconds
export const revalidate = 60;

import { ProposalsList } from "@/components/admin/proposals-list";
import Link from "next/link";

export default function AdminProposalsPage() {
  return (
    <div className="space-y-6 p-6 lg:px-12">
      <div className="flex items-center justify-between mb-16">
        <div>
          <h1 className="figma-h3">Proposal</h1>
        </div>

        <Link
          href="/admin/proposal/create"
          className="w-full md:w-fit cursor-pointer px-6 py-2 bg-gradient-to-r from-[#6B42D1] to-[#FF2AFF] rounded-lg transition-all"
        >
          Create Proposal
        </Link>
      </div>

      <ProposalsList />
    </div>
  );
}
