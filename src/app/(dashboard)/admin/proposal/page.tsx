// ISR: Revalidate every 60 seconds
export const revalidate = 60;

import { ProposalsList } from '@/components/admin/proposals-list';

export default function AdminProposalsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Proposal Management</h1>
          <p className="text-muted-foreground">
            Create and manage client proposals
          </p>
        </div>
      </div>

      <ProposalsList />
    </div>
  );
}
