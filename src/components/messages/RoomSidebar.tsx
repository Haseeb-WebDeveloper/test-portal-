"use client";
import React, { useEffect, useState } from "react";
import { useMessage } from "@/store/messages";
import { useUser } from "@/store/user";
import { Room, RoomSummary, UserRole } from "@/types/messages";
import { Badge } from "@/components/ui/badge";
import { Users, MessageSquare, MoreHorizontal, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabaseBrowser } from "@/utils/supabase/browser";
import CreateRoomModal from "./CreateRoomModal";
import Image from "next/image";

export default function RoomSidebar() {
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const currentRoom = useMessage((state) => state.currentRoom);
  const setCurrentRoom = useMessage((state) => state.setCurrentRoom);
  const clearMessages = useMessage((state) => state.clearMessages);
  const user = useUser((state) => state.user);
  const supabase = supabaseBrowser();

  useEffect(() => {
    const fetchRooms = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Get rooms where user is a participant
        const { data, error } = await supabase
          .from("room_participants")
          .select(
            `
            room:rooms(
              id,
              name,
              description,
              type,
              avatar,
              lastMessageAt,
              createdAt
            )
          `
          )
          .eq("userId", user.id)
          .eq("isActive", true);

        if (error) {
          console.error("Error fetching rooms:", error);
          return;
        }

        // Transform data to RoomSummary format
        const roomSummaries: RoomSummary[] = data.map((item: any) => ({
          id: item.room.id,
          name: item.room.name,
          type: item.room.type,
          avatar: item.room.avatar,
          lastMessageAt: item.room.lastMessageAt
            ? new Date(item.room.lastMessageAt)
            : undefined,
          unreadCount: 0, // TODO: Calculate unread count
          participantCount: 0, // TODO: Calculate participant count
        }));

        setRooms(roomSummaries);
      } catch (error) {
        console.error("Error fetching rooms:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [user, supabase]);

  const handleRoomSelect = (room: RoomSummary) => {
    // Convert RoomSummary to Room for the store
    const fullRoom: Room = {
      id: room.id,
      name: room.name,
      type: room.type,
      avatar: room.avatar,
      lastMessageAt: room.lastMessageAt,
      isActive: true,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setCurrentRoom(fullRoom);
    clearMessages(); // Clear messages when switching rooms

    // Close mobile sidebar if open
    if (window.innerWidth < 1024) {
      // Trigger a custom event to close mobile sidebar
      window.dispatchEvent(new CustomEvent("closeMobileSidebar"));
    }
  };

  const refreshRooms = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("room_participants")
        .select(
          `
          room:rooms(
            id,
            name,
            description,
            type,
            avatar,
            lastMessageAt,
            createdAt
          )
        `
        )
        .eq("userId", user.id)
        .eq("isActive", true);

      if (error) {
        console.error("Error fetching rooms:", error);
        return;
      }

      const roomSummaries: RoomSummary[] = data.map((item: any) => ({
        id: item.room.id,
        name: item.room.name,
        type: item.room.type,
        avatar: item.room.avatar,
        lastMessageAt: item.room.lastMessageAt
          ? new Date(item.room.lastMessageAt)
          : undefined,
        unreadCount: 0,
        participantCount: 0,
      }));

      setRooms(roomSummaries);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getRoomIcon = (type: string) => {
    switch (type) {
      case "CLIENT_SPECIFIC":
      case "CONTRACT_SPECIFIC":
      case "PROPOSAL_SPECIFIC":
        return <Users className="w-5 h-5" />;
      case "AGENCY_INTERNAL":
        return <MessageSquare className="w-5 h-5" />;
      default:
        return <MessageSquare className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="w-80 h-full border-r flex flex-col">
        <div className="p-5 h-24 border-b border-foreground/10">
          <h2 className="figma-h3 ">Messaging</h2>
        </div>
        <div className="flex-1 p-4 overflow-y-auto border-foreground/10">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3 p-3 rounded-lg">
                  <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-92 h-full bg-[#0F0A1D] border-r flex flex-col">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h2 className="figma-h3 ">Messaging</h2>
          {user?.role === UserRole.PLATFORM_ADMIN && (
            <CreateRoomModal onRoomCreated={refreshRooms} />
          )}
        </div>
      </div>

      {/* Room List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-2">
          {rooms.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="">No rooms available</p>
              <p className="text-sm text-gray-500 mt-2">
                Contact an administrator to get access to rooms
              </p>
            </div>
          ) : (
            rooms.map((room) => (
              <div
                key={room.id}
                onClick={() => handleRoomSelect(room)}
                className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  currentRoom?.id === room.id
                    ? "bg-primary/20"
                    : "bg-foreground/10"
                }`}
              >
                {/* Room Avatar/Icon */}
                <div className="flex-shrink-0">
                  {room.avatar ? (
                    <img
                      src={room.avatar}
                      alt={room.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                      {getRoomIcon(room.type)}
                    </div>
                  )}
                </div>

                {/* Room Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium truncate">{room.name}</h3>
                    {room.lastMessageAt && (
                      <span className="text-xs ">
                        {formatTime(room.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm  truncate">
                      {room.type === "GENERAL" && "General Discussion"}
                      {room.type === "CONTRACT_SPECIFIC" &&
                        "Contract Discussion"}
                      {room.type === "CLIENT_SPECIFIC" && "Proposal Discussion"}
                      {room.type === "AGENCY_INTERNAL" && "Internal Team"}
                    </p>
                    {room.unreadCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {room.unreadCount > 9 ? "9+" : room.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
