"use client";
import React, { useState, useEffect } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabaseBrowser } from "@/utils/supabase/browser";
import { useUser } from "@/store/user";
import { useMessage } from "@/store/messages";
import { RoomType, Room, PermissionType, UserRole, User } from "@/types/messages";
import { toast } from "sonner";
import { Settings, Trash2, Users } from "lucide-react";

interface RoomManagementModalProps {
  room: Room;
  onRoomUpdated?: () => void;
  onRoomDeleted?: () => void;
}

export default function RoomManagementModal({ 
  room, 
  onRoomUpdated, 
  onRoomDeleted 
}: RoomManagementModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: room.name,
    description: room.description || "",
    type: room.type,
    avatar: room.avatar || "",
  });
  const [currentMembers, setCurrentMembers] = useState<Array<{
    id: string;
    userId: string;
    permission: PermissionType;
    user: User;
  }>>([]);
  const [selectedMembers, setSelectedMembers] = useState<Array<{ userId: string; permission: PermissionType; user: User }>>([]);

  const user = useUser((state) => state.user);
  const setCurrentRoom = useMessage((state) => state.setCurrentRoom);

  // Update form data when room changes
  useEffect(() => {
    setFormData({
      name: room.name,
      description: room.description || "",
      type: room.type,
      avatar: room.avatar || "",
    });
  }, [room]);

  // Fetch current members when modal opens
  useEffect(() => {
    const fetchMembers = async () => {
      if (!open || !user) return;

      try {
        const supabase = supabaseBrowser();
        const { data, error } = await supabase
          .from("room_participants")
          .select(`
            id,
            userId,
            permission,
            user:users(*)
          `)
          .eq("roomId", room.id)
          .eq("isActive", true);

        if (error) {
          console.error("Error fetching members:", error);
          return;
        }

        setCurrentMembers((data || []) as unknown as Array<{
          id: string;
          userId: string;
          permission: PermissionType;
          user: User;
        }>);
        setSelectedMembers(
          (data || []).map(member => ({
            userId: member.userId,
            permission: member.permission as PermissionType,
            user: member.user as unknown as User,
          }))
        );
      } catch (error) {
        console.error("Error fetching members:", error);
      }
    };

    fetchMembers();
  }, [open, room.id, user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const supabase = supabaseBrowser();

      const { error } = await supabase
        .from("rooms")
        .update({
          name: formData.name,
          description: formData.description,
          type: formData.type,
          avatar: formData.avatar || null,
          updatedBy: user.id,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", room.id);

      if (error) {
        throw error;
      }

      // Update members if changed
      if (JSON.stringify(selectedMembers.map(m => ({ userId: m.userId, permission: m.permission }))) !== JSON.stringify(
        currentMembers.map(m => ({ userId: m.userId, permission: m.permission }))
      )) {
        // Remove all current members
        await supabase
          .from("room_participants")
          .update({ isActive: false, updatedBy: user.id, updatedAt: new Date().toISOString() })
          .eq("roomId", room.id);

        // Add creator back as admin
        await supabase
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

        // Add selected members
        if (selectedMembers.length > 0) {
          const memberParticipants = selectedMembers.map(member => ({
            id: crypto.randomUUID(),
            roomId: room.id,
            userId: member.userId,
            permission: member.permission,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: user.id,
            updatedBy: user.id,
          }));

          await supabase
            .from("room_participants")
            .insert(memberParticipants);
        }
      }

      // Update current room in store
      const updatedRoom = { ...room, ...formData };
      setCurrentRoom(updatedRoom);

      toast.success("Room updated successfully!");
      setOpen(false);
      
      if (onRoomUpdated) {
        onRoomUpdated();
      }
    } catch (error: any) {
      console.error("Error updating room:", error);
      toast.error(`Failed to update room: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const supabase = supabaseBrowser();

      // Soft delete the room
      const { error } = await supabase
        .from("rooms")
        .update({
          isActive: false,
          updatedBy: user.id,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", room.id);

      if (error) {
        throw error;
      }

      toast.success("Room deleted successfully!");
      setOpen(false);
      
      // Clear current room if it was deleted
      setCurrentRoom(null);
      
      if (onRoomDeleted) {
        onRoomDeleted();
      }
    } catch (error: any) {
      console.error("Error deleting room:", error);
      toast.error(`Failed to delete room: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = user?.role === UserRole.PLATFORM_ADMIN;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          {isAdmin ? "Manage" : "View"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isAdmin ? "Manage Room" : "Room Details"}
          </DialogTitle>
          <DialogDescription>
            {isAdmin 
              ? "Edit room settings and manage participants." 
              : "View room information and participants."
            }
          </DialogDescription>
        </DialogHeader>
        
        {isAdmin ? (
          <form onSubmit={handleUpdate}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Room Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter room name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter room description"
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Room Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as RoomType })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select room type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={RoomType.GENERAL}>General</SelectItem>
                    <SelectItem value={RoomType.AGENCY_INTERNAL}>Agency Internal</SelectItem>
                    <SelectItem value={RoomType.CLIENT_SPECIFIC}>Client Specific</SelectItem>
                    <SelectItem value={RoomType.CONTRACT_SPECIFIC}>Contract Specific</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <FileUpload
                  value={formData.avatar}
                  onChange={(url) => setFormData({ ...formData, avatar: url || "" })}
                  label="Room Avatar"
                  placeholder="Upload room avatar or drag and drop"
                  maxSize={5}
                />
              </div>
              <div className="grid gap-2">
                <Label>Members</Label>
                <MemberCombobox
                  value={selectedMembers}
                  onChange={setSelectedMembers}
                  placeholder="Manage room members..."
                />
              </div>
            </div>
            <DialogFooter className="flex justify-between">
              <div className="flex gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Room
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the room
                        and remove all participants.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                        Delete Room
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Room Name</Label>
              <div className="p-2  rounded-md">{room.name}</div>
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <div className="p-2  rounded-md min-h-[60px]">
                {room.description || "No description"}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Room Type</Label>
              <div className="p-2  rounded-md">{room.type}</div>
            </div>
            <div className="grid gap-2">
              <Label>Created</Label>
              <div className="p-2  rounded-md">
                {new Date(room.createdAt).toLocaleDateString()}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
