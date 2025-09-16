"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientWithDetails } from "@/lib/clients";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Edit, Calendar, Users } from "lucide-react";
import { ClientEditModal } from "@/components/admin/client-edit-modal";

export default function ClientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<ClientWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (clientId) {
      fetchClientDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const fetchClientDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/clients/${clientId}`);
      if (!response.ok) throw new Error("Failed to fetch client details");
      const data = await response.json();
      setClient(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const handleClientUpdated = useCallback(() => {
    fetchClientDetails();
  }, [fetchClientDetails]);

  if (loading) return <ClientDetailsSkeleton />;
  if (error || !client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className=" mb-4">{error || "Client not found"}</p>
        <Button onClick={() => router.back()} variant="secondary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:px-8 md:py-6 px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="h-6 w-px bg-border" />
          <h1 className="figma-h4">Client Details</h1>
        </div>
        <Button
          onClick={() => setShowEditModal(true)}
          className="flex items-center gap-2"
        >
          <Edit className="w-4 h-4" />
          Edit Client
        </Button>
      </div>

      {/* Client Info */}
      <div className="mt-10">
        <div className="flex items-start gap-6">
          <div className="relative">
            {client.avatar ? (
              <Image
                src={client.avatar}
                alt={client.name}
                width={130}
                height={130}
                className="w-20 md:w-32 md:h-32 h-20  rounded-full object-cover aspect-square"
              />
            ) : (
              <div className="w-20 md:w-32 md:h-32 h-20  rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl ">
                  {client.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h2 className="figma-h3 mb-2">{client.name}</h2>
            {client.description && (
              <p className="figma-paragraph mb-4 line-clamp-1 w-full">
                {client.description}
              </p>
            )}
            <div className="flex flex-wrap gap-4 ">
              {client.website && (
                <div className="flex items-center gap-2">
                  <Link
                    href={client.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors"
                  >
                    {client.website}
                  </Link>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Joined{" "}
                {formatDistanceToNow(new Date(client.createdAt), {
                  addSuffix: true,
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
        <div className="flex gap-2 border border-primary/20 px-3 py-2 rounded-lg text-base items-center">
          <Image
            src="/icons/contract.svg"
            alt="Active Contracts"
            width={18}
            height={18}
          />
          <p className="">{client.activeContractsCount ?? 0}</p>
          <p className="">Active Contracts</p>
        </div>

        <div className="flex gap-2 border border-primary/20 px-4 py-2.5 rounded-lg text-base items-center">
          <Image
            src="/icons/offer.svg"
            alt="Pending Contracts"
            width={18}
            height={18}
          />
          <p className="">{client.pendingProposalsCount ?? 0}</p>
          <p className="">Pending Offers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
        {/* Team Members */}
        <div className="space-y-6">
          <h3 className="text-lg ">Client team members</h3>
          <div className="space-y-4">
            {client.teamMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage
                    src={member.avatar || ""}
                    alt={`${member.name?.split(" ")[0] || ""} ${member.name?.split(" ")[1] || ""}`}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                    {(member.name?.charAt(0) || "")}
                    {(member.name?.split(" ")[1]?.charAt(0) || "")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-white text-base">
                    {member.name
                      ? member.name
                      : member.name}
                  </p>
                  <p className="text-sm ">{client.name} team</p>
                </div>
                {/* {member.role === "PRIMARY_CONTACT" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">★</span>
                  </div>
                )} */}
              </div>
            ))}
            {client.teamMembers.length === 0 && (
              <p className="text-center  py-8">
                No team members found
              </p>
            )}
          </div>
        </div>

        {/* Client Groups/Rooms */}
        <div className="space-y-6">
          <h3 className="text-lg ">Client rooms</h3>
          <div className="space-y-4">
            {(client.rooms || []).map((room, index) => {
              const colors = [
                "bg-orange-500",
                "bg-green-500",
                "bg-gray-500",
                "bg-blue-500",
                "bg-purple-500",
              ];
              const colorClass = colors[index % colors.length];

              return (
                <div key={room.id} className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center`}
                  >
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white text-base">
                      {room.name}
                    </p>
                    {room.description && (
                      <p className="text-sm ">
                        {room.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            {(client.rooms?.length ?? 0) === 0 && (
              <p className="text-center  py-8">No rooms found</p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Client Modal */}
      {showEditModal && (
        <ClientEditModal
          client={client}
          onClose={() => setShowEditModal(false)}
          onClientUpdated={handleClientUpdated}
        />
      )}
    </div>
  );
}

function ClientDetailsSkeleton() {
  return (
    <div className="space-y-6 md:px-8 md:py-6 px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-20" />
          <div className="h-6 w-px bg-border" />
          <Skeleton className="h-8 w-40" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Client Info */}
      <div className="mt-10">
        <div className="flex items-start gap-6">
          <Skeleton className="w-20 md:w-32 md:h-32 h-20 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-6 w-64 mb-4" />
            <div className="flex flex-wrap gap-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
        {/* Team Members */}
        <div className="space-y-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Client Groups/Rooms */}
        <div className="space-y-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
