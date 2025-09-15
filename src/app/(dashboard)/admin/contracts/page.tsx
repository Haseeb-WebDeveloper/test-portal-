// ISR: Revalidate every 60 seconds
export const revalidate = 60;

import { ContractsList } from "@/components/admin/contracts-list";
import Link from "next/link";

export default function ContractsPage() {
  return (
    <div className="space-y-6 p-6 lg:px-12">
      <div className="flex items-center justify-between mb-16">
        <h1 className="figma-h3">Contract Management</h1>
        <Link
          href="/admin/contracts/create"
          className="w-full md:w-fit cursor-pointer px-6 py-2 bg-gradient-to-r from-[#6B42D1] to-[#FF2AFF] rounded-lg transition-all"
        >
          Create Contract
        </Link>
      </div>

      <ContractsList />
    </div>
  );
}
