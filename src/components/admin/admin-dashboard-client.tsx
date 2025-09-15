import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface Client {
  id: string;
  name: string;
  avatar: string | null;
  activeContracts: number;
  pendingContracts: number;
  lastActivity: string | Date;
}

interface AdminDashboardClientProps {
  clients: Client[];
}

export default function AdminDashboardClient({
  clients,
}: AdminDashboardClientProps) {
  // Show only the first 5 clients
  const visibleClients = clients.slice(0, 5);
  const showViewAll = clients.length > 2;

  if (clients.length === 0) {
    return (
      <div className="bg-transparent border-primary/20 space-y-6">
        <div className="overflow-hidden rounded-lg border border-primary/20">
          <div className="flex items-center gap-3 px-4 py-6">
            <p className="figma-paragraph text-foreground/90">Client Snapshot</p>
          </div>
          <div className="text-center py-8 text-muted-foreground">
            <svg
              className="w-12 h-12 mx-auto mb-4 opacity-50"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a4 4 0 0 0-3-3.87M9 20H4v-2a4 4 0 0 1 3-3.87m10-5.13a4 4 0 1 1-8 0 4 4 0 0 1 8 0zm-4-7a4 4 0 0 1 4 4"
              />
            </svg>
            <p>No clients found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent border-primary/20 space-y-6">
      <div className="overflow-hidden rounded-lg border border-primary/20">
        <div className="flex items-center gap-3 px-4 py-6">
          <p className="figma-paragraph text-foreground/90">Client Snapshot</p>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead className="border-b border-primary/20 bg-transparent">
            <tr>
              <th className="px-6 py-4 text-left figma-paragraph text-nowrap">
                Clients
              </th>
              <th className="px-6 py-4 text-center figma-paragraph text-nowrap">
                Active contracts
              </th>
              <th className="px-6 py-4 text-center figma-paragraph text-nowrap">
                Pending contracts
              </th>
              <th className="px-6 py-4 text-left figma-paragraph text-nowrap">
                Last activity
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/20">
            {visibleClients.map((client) => (
              <tr
                key={client.id}
                className="hover:bg-primary/5 transition-colors"
              >
                <td className="px-6 py-4">
                  <Link
                    href={`/admin/clients/${client.id}`}
                    className="flex items-center gap-3"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={client.avatar || ""} alt={client.name} />
                      <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                        {client.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-foreground font-medium text-nowrap">
                      {client.name.length > 13 ? client.name.slice(0, 15) + "..." : client.name}
                    </span>
                  </Link>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="text-lg font-semibold text-foreground">
                    {client.activeContracts}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="text-lg font-semibold text-foreground">
                    {client.pendingContracts}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-foreground/70">
                    {(() => {
                      try {
                        const date =
                          typeof client.lastActivity === "string"
                            ? new Date(client.lastActivity)
                            : client.lastActivity;
                        if (isNaN(date.getTime())) {
                          return "No activity yet";
                        }
                        return formatDistanceToNow(date, { addSuffix: true });
                      } catch (error) {
                        return "No activity yet";
                      }
                    })()}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {showViewAll && (
          <div className="flex justify-end px-6 py-4">
            <Link
              href="/admin/clients"
              className="text-sm text-foreground/80 hover:underline"
            >
              View all clients
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
