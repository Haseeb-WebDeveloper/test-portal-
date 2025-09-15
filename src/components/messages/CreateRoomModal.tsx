"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import FileUpload from "@/components/ui/file-upload";
import MemberCombobox from "./MemberCombobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabaseBrowser } from "@/utils/supabase/browser";
import { useUser } from "@/store/user";
import { useMessage } from "@/store/messages";
import { RoomType, PermissionType, Room, User } from "@/types/messages";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import Image from "next/image";

interface CreateRoomModalProps {
  onRoomCreated?: () => void;
}

export default function CreateRoomModal({
  onRoomCreated,
}: CreateRoomModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: RoomType.GENERAL,
    avatar: "",
  });
  const [selectedMembers, setSelectedMembers] = useState<
    Array<{ userId: string; permission: PermissionType; user: User }>
  >([]);

  const user = useUser((state) => state.user);
  const setCurrentRoom = useMessage((state) => state.setCurrentRoom);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const supabase = supabaseBrowser();

      // Create the room
      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .insert({
          id: crypto.randomUUID(),
          name: formData.name,
          description: formData.description || "",
          type: formData.type,
          avatar: formData.avatar || null,
          isActive: true,
          isArchived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: user.id,
          updatedBy: user.id,
        })
        .select()
        .single();

      if (roomError) {
        throw roomError;
      }

      // Add the creator as an admin participant
      const { error: creatorParticipantError } = await supabase
        .from("room_participants")
        .insert({
          id: crypto.randomUUID(),
          roomId: room.id,
          userId: user.id,
          permission: PermissionType.ADMIN,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: user.id,
          updatedBy: user.id,
        });

      if (creatorParticipantError) {
        throw creatorParticipantError;
      }

      // Add selected members
      if (selectedMembers.length > 0) {
        const memberParticipants = selectedMembers.map((member) => ({
          roomId: room.id,
          userId: member.userId,
          permission: member.permission,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
          createdBy: user.id,
          updatedBy: user.id,
        }));

        const { error: membersError } = await supabase
          .from("room_participants")
          .insert(memberParticipants);

        if (membersError) {
          throw membersError;
        }
      }

      toast.success("Room created successfully!");
      setOpen(false);
      setFormData({
        name: "",
        description: "",
        type: RoomType.GENERAL,
        avatar: "",
      });
      setSelectedMembers([]);

      // Set the new room as current room
      setCurrentRoom(room as unknown as Room);

      // Refresh room list
      if (onRoomCreated) {
        onRoomCreated();
      }
    } catch (error: any) {
      console.error("Error creating room:", error);
      toast.error(`Failed to create room: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="cursor-pointer flex justify-center items-center w-10 h-10 border border-primary/20 rounded-full">
          <Image
            src="/icons/add.svg"
            alt="plus"
            width={550}
            height={550}
            className="w-5 h-5"
          />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Room</DialogTitle>
          <DialogDescription>
            Create a new room for your team to collaborate.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Room Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter room name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter room description"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Room Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value as RoomType })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select room type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={RoomType.GENERAL}>General</SelectItem>
                  <SelectItem value={RoomType.AGENCY_INTERNAL}>
                    Agency Internal
                  </SelectItem>
                  <SelectItem value={RoomType.CLIENT_SPECIFIC}>
                    Client Specific
                  </SelectItem>
                  <SelectItem value={RoomType.CONTRACT_SPECIFIC}>
                    Contract Specific
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <FileUpload
                value={formData.avatar}
                onChange={(url) =>
                  setFormData({ ...formData, avatar: url || "" })
                }
                label="Room Avatar (Optional)"
                placeholder="Upload room avatar or drag and drop"
                maxSize={5}
              />
            </div>
            <div className="grid gap-2">
              <Label>Members</Label>
              <MemberCombobox
                value={selectedMembers}
                onChange={setSelectedMembers}
                placeholder="Add members to the room..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
