"use client";

import { CreateClientModal } from "@/components/admin/create-client-modal";

export function ClientsHeader() {
  return (
    <div className="flex items-center justify-between">
      <h1 className="figma-h3 text-figma-text-black">Our Clients</h1>
      <CreateClientModal onClientCreated={() => window.location.reload()} />
    </div>
  );
}