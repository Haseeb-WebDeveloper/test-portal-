"use client";
import React, { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabaseBrowser } from "@/utils/supabase/browser";
import { useUser } from "@/store/user";
import { User, PermissionType } from "@/types/messages";
import { toast } from "sonner";

interface MemberComboboxProps {
  value: Array<{ userId: string; permission: PermissionType; user: User }>;
  onChange: (members: Array<{ userId: string; permission: PermissionType; user: User }>) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function MemberCombobox({
  value = [],
  onChange,
  disabled = false,
  placeholder = "Add members...",
}: MemberComboboxProps) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const currentUser = useUser((state) => state.user);

  // Fetch users when popover opens
  useEffect(() => {
    const fetchUsers = async () => {
      if (!open || !currentUser) return;

      setLoading(true);
      try {
        const supabase = supabaseBrowser();
        
        // Get all users except the current user and already selected members
        const selectedUserIds = value.map(member => member.userId);
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("isActive", true)
          .neq("id", currentUser.id)
          .not("id", "in", `(${selectedUserIds.join(",")})`);

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

    fetchUsers();
  }, [open, currentUser, value]);

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserSelect = (user: User) => {
    const newMember = {
      userId: user.id,
      permission: PermissionType.READ,
      user: user,
    };
    
    onChange([...value, newMember]);
    setSearchTerm("");
    setOpen(false);
  };

  const handleMemberRemove = (userId: string) => {
    onChange(value.filter(member => member.userId !== userId));
  };

  const handlePermissionChange = (userId: string, permission: PermissionType) => {
    onChange(
      value.map(member =>
        member.userId === userId ? { ...member, permission } : member
      )
    );
  };

  return (
    <div className="space-y-2">
      {/* Selected Members Display */}
      <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-background">
        {value.length === 0 ? (
          <span className="text-sm text-muted-foreground">{placeholder}</span>
        ) : (
          value.map((member) => (
            <Badge key={member.userId} variant="secondary" className="flex items-center gap-1">
              <Avatar className="w-4 h-4">
                {member.user.avatar ? (
                  <img 
                    src={member.user.avatar} 
                    alt={member.user.name} 
                    className="w-full h-full object-cover rounded-full" 
                  />
                ) : (
                  <div className="w-full h-full bg-primary rounded-full flex items-center justify-center text-white text-xs">
                    {member.user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </Avatar>
              <span className="text-xs">{member.user.name}</span>
              <select
                value={member.permission}
                onChange={(e) => handlePermissionChange(member.userId, e.target.value as PermissionType)}
                className="text-xs border-0 bg-transparent p-0 focus:ring-0"
                onClick={(e) => e.stopPropagation()}
              >
                <option value={PermissionType.READ}>Read</option>
                <option value={PermissionType.WRITE}>Write</option>
                <option value={PermissionType.ADMIN}>Admin</option>
              </select>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => handleMemberRemove(member.userId)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))
        )}
      </div>

      {/* Add Members Combobox */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Members
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search users..."
              value={searchTerm}
              onValueChange={setSearchTerm}
              className="h-9"
            />
            <CommandList>
              <CommandEmpty>
                {loading ? "Loading users..." : "No users found."}
              </CommandEmpty>
              <CommandGroup>
                {filteredUsers.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={user.id}
                    onSelect={() => handleUserSelect(user)}
                    className="flex items-center space-x-3 p-3"
                  >
                    <Avatar className="w-8 h-8">
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name} 
                          className="w-full h-full object-cover rounded-full" 
                        />
                      ) : (
                        <div className="w-full h-full bg-primary rounded-full flex items-center justify-center text-white text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Check className="ml-auto h-4 w-4" />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
