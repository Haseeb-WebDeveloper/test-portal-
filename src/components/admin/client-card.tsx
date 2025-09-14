"use client";

import { memo } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ClientWithDetails } from "@/lib/clients";
import { FileText, Clock, Users } from "lucide-react";

interface ClientCardProps {
  client: ClientWithDetails;
  hasNewUpdate?: boolean;
}

export const ClientCard = memo(function ClientCard({ 
  client, 
  hasNewUpdate = false 
}: ClientCardProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const getInitials = (name: string) => {
    return `${name.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="relative bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all duration-200 hover:border-primary/50">
      {/* New Update Badge */}
      {hasNewUpdate && (
        <div className="absolute -top-2 -right-2">
          <Badge 
            variant="secondary" 
            className="bg-yellow-500 text-yellow-900 text-xs px-2 py-1 rounded-full"
          >
            New update
          </Badge>
        </div>
      )}

      {/* Client Logo and Name */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
          {client.avatar ? (
            <Image
              src={client.avatar}
              alt={`${client.name} logo`}
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-lg font-semibold text-muted-foreground">
              {client.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">
            {client.name}
          </h3>
        </div>
      </div>

      {/* Contracts and Proposals */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-foreground">
            {client.activeContractsCount} Active contracts
          </span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            {client.pendingProposalsCount} pending Proposals
          </span>
        </div>
      </div>

      {/* Last Activity */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        <Clock className="w-4 h-4 text-primary" />
        <span className="text-primary">
          Last Activity: {client.lastActivityDescription}
        </span>
      </div>

      {/* Team Members */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <div className="flex -space-x-2">
            {client.teamMembers.slice(0, 4).map((member) => (
              <Avatar key={member.id} className="w-6 h-6 border-2 border-background">
                <AvatarImage src={member.avatar || ""} alt={`${member.name}`} />
                <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
            ))}
            {client.teamMembers.length > 4 && (
              <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                <span className="text-xs text-muted-foreground font-medium">
                  +{client.teamMembers.length - 4}
                </span>
              </div>
            )}
          </div>
        </div>
        {client.teamMembers.length === 0 && (
          <span className="text-xs text-muted-foreground">No team members</span>
        )}
      </div>
    </div>
  );
});
