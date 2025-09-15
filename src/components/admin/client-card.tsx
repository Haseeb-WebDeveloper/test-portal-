"use client";

import { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ClientWithDetails } from "@/lib/clients";
import { formatDistanceToNow } from "date-fns";

// AvatarStack: simple horizontal stack for avatars
function AvatarStack({ children, size = 32, className = "" }: { children: React.ReactNode, size?: number, className?: string }) {
  return (
    <div className={`flex -space-x-2 ${className}`}>
      {children}
    </div>
  );
}

interface ClientCardProps {
  client: ClientWithDetails;
  hasNewUpdate?: boolean;
}

export const ClientCard = memo(function ClientCard({
  client,
  hasNewUpdate = false,
}: ClientCardProps) {
  // For compatibility with the new UI, map data fields
  const logo = client.avatar || null;
  const activeContracts = client.activeContractsCount ? client.activeContractsCount : 0;
  const pendingOffers = client.pendingProposalsCount ? client.pendingProposalsCount : 0;
  const lastActivity = client.lastActivity || client.updatedAt || null;
  const teamMembers = client.teamMembers || [];
  const totalTeamMembers = client.teamMembers.length;

  // For avatar stack
  const displayMembers = teamMembers.slice(0, 4);
  const remainingCount = totalTeamMembers - displayMembers.length;

  return (
    <div className="border border-border rounded-xl p-6 hover:border-primary/20 transition-all duration-200 group relative ">
      {/* New Update Badge */}
      {hasNewUpdate && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge
            variant="secondary"
            className="bg-yellow-500 text-yellow-900 text-xs px-2 py-1 rounded-full"
          >
            New update
          </Badge>
        </div>
      )}

      {/* Header with logo and name */}
      <Link
        href={`/admin/clients/${client.id}`}
        className="flex items-center gap-4 mb-6"
      >
        {logo ? (
          <div className="w-16 h-16 rounded-full overflow-hidden">
            <Image
              src={logo}
              alt={client.name}
              width={200}
              height={200}
              className="rounded-full object-cover aspect-square"
            />
          </div>
        ) : (
          <Avatar className="w-16 h-16">
            <AvatarFallback className="text-white font-bold text-sm">
              {client.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="figma-paragraph-bold truncate">{client.name}</h3>
        </div>
      </Link>

      {/* Stats */}
      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <Image
            src="/icons/contract.svg"
            alt="Active Contracts"
            width={20}
            height={20}
          />
          <span>
            <span className="font-bold text-foreground">
              {activeContracts}
            </span>{" "}
            Active contracts
          </span>
        </div>
        <div className="w-px h-6 bg-foreground"></div>
        <div className="flex items-center gap-2">
          <Image
            src="/icons/list.svg"
            alt="Pending Offers"
            width={20}
            height={20}
          />
          <span>
            <span className="font-bold text-foreground">
              {pendingOffers}
            </span>{" "}
            pending Offers
          </span>
        </div>
      </div>

      {/* Last Activity */}
      <div className="flex items-center gap-2 mb-6">
        <Image
          src="/icons/stop-watch.svg"
          alt="Last Activity"
          width={20}
          height={20}
        />
        <span className="font-medium">Last Activity : </span>
        <span className="text-foreground italic underline">
          {(() => {
            try {
              const date = lastActivity ? new Date(lastActivity) : null;
              if (!date || isNaN(date.getTime())) {
                return "Unknown";
              }
              return formatDistanceToNow(date, {
                addSuffix: true,
              });
            } catch (error) {
              return "Unknown";
            }
          })()}
        </span>
      </div>

      {/* Team Members */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AvatarStack size={32}>
            {displayMembers.map((member) => (
              <Avatar key={member.id} className="w-8 h-8 border-2 border-background">
                {member.avatar ? (
                  <AvatarImage src={member.avatar} alt={member.name} className="w-8 h-8" />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {member.name
                    .split(" ")
                    .map((n) => n.charAt(0))
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            ))}
            {remainingCount > 0 && (
              <Avatar className="w-8 h-8 border-2 border-background">
                <AvatarFallback className="bg-primary text-white text-sm font-medium">
                  +{remainingCount}
                </AvatarFallback>
              </Avatar>
            )}
          </AvatarStack>
        </div>
        <div className="text-foreground">
          <span className="font-bold">{totalTeamMembers}</span> Team members
        </div>
      </div>
    </div>
  );
});
