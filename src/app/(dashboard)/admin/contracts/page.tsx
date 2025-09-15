// ISR: Revalidate every 60 seconds
export const revalidate = 60;

import { ContractsList } from '@/components/admin/contracts-list';

export default function ContractsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contract Management</h1>
          <p className="text-muted-foreground">
            Manage and track all client contracts
          </p>
        </div>
      </div>
      
      <ContractsList />
    </div>
  );
}