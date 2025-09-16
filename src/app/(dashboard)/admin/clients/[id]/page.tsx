"use client";

import { useState, useEffect, memo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ClientWithDetails } from "@/lib/clients";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Edit, Calendar, Users, MessageSquare, Contact, List } from "lucide-react";
import { ClientEditModal } from "@/components/admin/client-edit-modal";
export default function ClientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  
  const [client, setClient] = useState<ClientWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (clientId) {
      fetchClientDetails();
    }
  }, [clientId]);

  const fetchClientDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/clients/${clientId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch client details');
      }
      
      const data = await response.json();
      setClient(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const handleClientUpdate = useCallback((updatedClient: ClientWithDetails) => {
    setClient(updatedClient);
  }, []);

  if (loading) {
    return <ClientDetailsSkeleton />;
  }

  if (error || !client) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error || 'Client not found'}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/clients"
            className="flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-3xl font-bold">Client Details</h1>
        </div>
        <Button
          onClick={() => setIsEditModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Edit className="w-4 h-4" />
          Edit Client
        </Button>
      </div>

      {/* Client Info Section */}
      <div className="rounded-xl border p-8 mb-8">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {client.avatar ? (
              <div className="w-24 h-24 rounded-full overflow-hidden">
                <Image
                  src={client.avatar}
                  alt={client.name}
                  width={96}
                  height={96}
                  className="rounded-full object-cover aspect-square"
                />
              </div>
            ) : (
              <Avatar className="w-24 h-24">
                <AvatarFallback className=" font-bold text-2xl">
                  {client.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
          </div>

          {/* Client Details */}
          <div className="flex-1 min-w-0">
            <h2 className="text-3xl font-bold mb-2">{client.name}</h2>
            {client.description && (
              <p className="text-muted-foreground text-lg mb-4">{client.description}</p>
            )}
            
            {/* Additional Info */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Joined {formatDistanceToNow(client.createdAt, { addSuffix: true })}</span>
              </div>
              {client.website && (
                <div className="flex items-center gap-2">
                  <span>Website:</span>
                  <a 
                    href={client.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {client.website}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Contact className="w-6 h-6" />}
          title="Active Contracts"
          value={client.activeContractsCount}
          color="text-blue-600"
        />
        <StatCard
          icon={<List className="w-6 h-6" />}
          title="Pending Proposals"
          value={client.pendingProposalsCount}
          color="text-orange-600"
        />
        <StatCard
          icon={<Users className="w-6 h-6" />}
          title="Team Members"
          value={client.teamMembers.length}
          color="text-green-600"
        />
        <StatCard
          icon={<MessageSquare className="w-6 h-6" />}
          title="Client Rooms"
          value={client.rooms?.length || 0}
          color="text-purple-600"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Team Members */}
        <div className="rounded-xl border p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Client Team Members
          </h3>
          {client.teamMembers.length > 0 ? (
            <div className="space-y-3">
              {client.teamMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <Avatar className="w-10 h-10">
                    {member.avatar ? (
                      <AvatarImage src={member.avatar} alt={member.name} />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {member.name
                        .split(" ")
                        .map((n) => n.charAt(0))
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">Team Member</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No team members found</p>
            </div>
          )}
        </div>

        {/* Client Rooms */}
        <div className="rounded-xl border p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Client Rooms
          </h3>
          {client.rooms && client.rooms.length > 0 ? (
            <div className="space-y-3">
              {client.rooms.map((room) => (
                <div key={room.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">{room.name}</p>
                      {room.description && (
                        <p className="text-sm text-muted-foreground">{room.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground capitalize">{room.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  {room.lastMessageAt && (
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(room.lastMessageAt), { addSuffix: true })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No rooms found</p>
              <p className="text-sm">Rooms will appear here when created</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <ClientEditModal
        client={client}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onClientUpdate={handleClientUpdate}
      />
    </div>
  );
}

const StatCard = memo(function StatCard({ 
  icon, 
  title, 
  value, 
  color 
}: { 
  icon: React.ReactNode; 
  title: string; 
  value: number; 
  color: string;
}) {
  return (
    <div className="rounded-xl border p-6">
      <div className="flex items-center gap-3 mb-2">
        <div className={color}>{icon}</div>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
});

function ClientDetailsSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="rounded-xl border p-8 mb-8">
        <div className="flex items-start gap-6">
          <Skeleton className="w-24 h-24 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-6 w-96" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-6">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3 p-3 rounded-lg bg-muted/90">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
