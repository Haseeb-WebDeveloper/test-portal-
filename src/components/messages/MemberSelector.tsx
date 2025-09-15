"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { supabaseBrowser } from "@/utils/supabase/browser";
import { useUser } from "@/store/user";
import { User, PermissionType } from "@/types/messages";
import { toast } from "sonner";
import { Plus, Search, X } from "lucide-react";

interface MemberSelectorProps {
  roomId?: string;
  currentMembers?: Array<{
    id: string;
    userId: string;
    permission: PermissionType;
    user: User;
  }>;
  onMembersChange: (members: Array<{ userId: string; permission: PermissionType }>) => void;
  disabled?: boolean;
}

export default function MemberSelector({
  roomId,
  currentMembers = [],
  onMembersChange,
  disabled = false,
}: MemberSelectorProps) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Array<{ userId: string; permission: PermissionType }>>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  const currentUser = useUser((state) => state.user);

  // Initialize selected members from current members
  useEffect(() => {
    const members = currentMembers.map(member => ({
      userId: member.userId,
      permission: member.permission,
    }));
    setSelectedMembers(members);
  }, [currentMembers]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser) return;

      setLoading(true);
      try {
        const supabase = supabaseBrowser();
        
        // Get all users except the current user
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("isActive", true)
          .neq("id", currentUser.id);

        if (error) {
          throw error;
        }

        setUsers((data || []) as unknown as User[]);
      } catch (error: any) {
        console.error("Error fetching users:", error);
        toast.error("Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchUsers();
    }
  }, [open, currentUser]);

  // Filter users based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [users, searchTerm]);

  const handleMemberToggle = (userId: string, permission: PermissionType = PermissionType.READ) => {
    setSelectedMembers(prev => {
      const existing = prev.find(member => member.userId === userId);
      if (existing) {
        return prev.filter(member => member.userId !== userId);
      } else {
        return [...prev, { userId, permission }];
      }
    });
  };

  const handlePermissionChange = (userId: string, permission: PermissionType) => {
    setSelectedMembers(prev =>
      prev.map(member =>
        member.userId === userId ? { ...member, permission } : member
      )
    );
  };

  const handleSave = () => {
    onMembersChange(selectedMembers);
    setOpen(false);
    toast.success("Members updated successfully!");
  };

  const isMemberSelected = (userId: string) => {
    return selectedMembers.some(member => member.userId === userId);
  };

  const getMemberPermission = (userId: string) => {
    const member = selectedMembers.find(member => member.userId === userId);
    return member?.permission || PermissionType.READ;
  };

  const getCurrentMemberUser = (userId: string) => {
    return currentMembers.find(member => member.userId === userId)?.user;
  };

  return (
    <div className="space-y-2">
      <Label>Members</Label>
      
      {/* Current Members Display */}
      <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md">
        {selectedMembers.length === 0 ? (
          <span className="text-sm text-gray-500">No members selected</span>
        ) : (
          selectedMembers.map((member) => {
            const user = users.find(u => u.id === member.userId) || getCurrentMemberUser(member.userId);
            if (!user) return null;

            return (
              <Badge key={member.userId} variant="secondary" className="flex items-center gap-1">
                <Avatar className="w-4 h-4">
                  {user.avatar ? (
                    <img src={user.avatar || ""} alt={user.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full bg-primary rounded-full flex items-center justify-center text-white text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </Avatar>
                <span className="text-xs">{user.name}</span>
                <span className="text-xs text-gray-500">({member.permission})</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleMemberToggle(member.userId)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="sm" disabled={disabled}>
            <Plus className="h-4 w-4 mr-2" />
            {selectedMembers.length === 0 ? "Add Members" : "Manage Members"}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Manage Room Members</DialogTitle>
            <DialogDescription>
              Add or remove members from this room and set their permissions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Users List */}
            <div className="max-h-60 overflow-y-auto space-y-2">
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No users found</p>
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const isSelected = isMemberSelected(user.id);
                  const permission = getMemberPermission(user.id);

                  return (
                    <div
                      key={user.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border ${
                        isSelected ? "bg-primary/5 border-primary" : "hover:bg-gray-50"
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleMemberToggle(user.id, PermissionType.READ)}
                      />
                      
                      <Avatar className="w-8 h-8">
                        {user.avatar ? (
                          <img src={user.avatar || ""} alt={user.name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <div className="w-full h-full bg-primary rounded-full flex items-center justify-center text-white text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>

                      {isSelected && (
                        <select
                          value={permission}
                          onChange={(e) => handlePermissionChange(user.id, e.target.value as PermissionType)}
                          className="text-xs border rounded px-2 py-1"
                        >
                          <option value={PermissionType.READ}>Read</option>
                          <option value={PermissionType.WRITE}>Write</option>
                          <option value={PermissionType.ADMIN}>Admin</option>
                        </select>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
