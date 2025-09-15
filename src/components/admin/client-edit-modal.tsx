"use client";

import { useState, useEffect, memo, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Separator } from "@/components/ui/separator";
import { ClientWithDetails } from "@/lib/clients";
import { UserRole } from "@/types/enums";
import { X, Plus, Trash2, Upload, User, Search, Mail, Shield, Users, Loader2, Image as ImageIcon, Pencil, Edit3 } from "lucide-react";

interface ClientMember {
  id?: string;
  name: string;
  email: string;
  role: string;
  isNew?: boolean;
  isExisting?: boolean;
}

interface ClientEditModalProps {
  client: ClientWithDetails;
  isOpen: boolean;
  onClose: () => void;
  onClientUpdate: (client: ClientWithDetails) => void;
}

interface ClientFormData {
  name: string;
  description: string;
  avatar: string;
  website: string;
  email: string;
  clientMembers: ClientMember[];
}

const AVATAR_PLACEHOLDER = "https://api.dicebear.com/7.x/lorelei-neutral/svg?seed=client";

export function ClientEditModal({
  client,
  isOpen,
  onClose,
  onClientUpdate,
}: ClientEditModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ClientFormData>({
    name: client.name,
    description: client.description || "",
    avatar: client.avatar || "",
    website: client.website || "",
    email: "",
    clientMembers: client.teamMembers.map(member => ({
      id: member.id,
      name: member.name,
      email: (member as any).email || "",
      role: (member as any).role || "member",
      isNew: false,
    })),
  });

  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [memberSelectionMode, setMemberSelectionMode] = useState<'existing' | 'new'>('existing');

  const handleInputChange = useCallback((field: keyof ClientFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleAvatarUpload = useCallback(async (file: File) => {
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Upload failed");
      }

      setFormData(prev => ({
        ...prev,
        avatar: result.url,
      }));
    } catch (error: any) {
      console.error("Upload error:", error);
      setError(error.message || "Failed to upload avatar");
    } finally {
      setAvatarUploading(false);
    }
  }, []);

  const handleAvatarFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      
      handleAvatarUpload(file);
    }
  }, [handleAvatarUpload]);

  const addClientMember = useCallback(() => {
    const newMember: ClientMember = {
      name: "",
      email: "",
      role: "member",
      isNew: memberSelectionMode === 'new',
      isExisting: memberSelectionMode === 'existing',
    };
    setFormData(prev => ({
      ...prev,
      clientMembers: [...prev.clientMembers, newMember],
    }));
  }, [memberSelectionMode]);

  const removeClientMember = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      clientMembers: prev.clientMembers.filter((_, i) => i !== index),
    }));
  }, []);

  const updateClientMember = useCallback((index: number, field: keyof ClientMember, value: string) => {
    setFormData(prev => ({
      ...prev,
      clientMembers: prev.clientMembers.map((member, i) =>
        i === index ? { ...member, [field]: value } : member
      ),
    }));
  }, []);

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setAvailableUsers([]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}`);
      if (response.ok) {
        const users = await response.json();
        setAvailableUsers(users);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addExistingUser = useCallback(async (user: any) => {
    const newMember: ClientMember = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: "member",
      isNew: false,
      isExisting: true,
    };
    
    setFormData(prev => ({
      ...prev,
      clientMembers: [...prev.clientMembers, newMember],
    }));
    setSearchQuery("");
    setAvailableUsers([]);
  }, []);

  const createAndAddUser = useCallback(async (email: string, name: string) => {
    try {
      const response = await fetch('/api/auth/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name, role: UserRole.CLIENT_MEMBER }),
      });

      if (response.ok) {
        const user = await response.json();
        const newMember: ClientMember = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: "member",
          isNew: true,
          isExisting: false,
        };
        
        setFormData(prev => ({
          ...prev,
          clientMembers: [...prev.clientMembers, newMember],
        }));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setError(error instanceof Error ? error.message : 'Failed to create user. Please try again.');
    }
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);


    try {
      const response = await fetch(`/api/admin/clients/${client.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });


      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.error || 'Failed to update client');
      }

      const updatedClient = await response.json();
      console.log('Successfully updated client:', updatedClient);
      onClientUpdate(updatedClient);
      onClose();
    } catch (error) {
      console.error('Error updating client:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [client.id, formData, onClientUpdate, onClose]);

  const isValid = formData.name.trim() !== "" && 
    formData.clientMembers.every(member => 
      member.name.trim() !== "" && 
      member.email.trim() !== "" &&
      (member.id || member.isNew)
    );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6" />
            Edit Client
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm flex items-center gap-2">
              <X className="w-4 h-4" />
              {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-8 pr-2">
          {/* Company name */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-base font-medium">
              <User className="w-4 h-4" />
              Company Name
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Company Name"
              className="h-11"
              required
              autoFocus
            />
          </div>

          {/* Email address */}
          <div>
            <label className="flex items-center gap-2 text-base font-medium">
              <Mail className="w-4 h-4" />
              Email address
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="john@dashdark.com"
              className="h-11"
            />
          </div>

          {/* Website */}
          <div>
            <label className="flex items-center gap-2 text-base font-medium">
              <Pencil className="w-4 h-4" />
              Website
            </label>
            <Input
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange("website", e.target.value)}
              placeholder="https://example.com"
              className="h-11"
            />
          </div>

          {/* Photo */}
          <div>
            <label className="flex items-center gap-2 text-base font-medium">
              <ImageIcon className="w-4 h-4" />
              Photo
            </label>
            <div className="flex flex-col items-center gap-2">
              <div className="relative group">
                <img
                  src={formData.avatar || AVATAR_PLACEHOLDER}
                  alt="Client logo"
                  className="w-28 h-28 rounded-full object-cover border-4 border-border bg-muted"
                />
                {avatarUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <LoadingSpinner size="sm" className="text-white" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <label className="cursor-pointer">
                    <Edit3 className="w-6 h-6 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Click the edit icon to upload a new avatar
              </p>
            </div>
          </div>

          {/* Short description */}
          <div>
            <label className="flex items-center gap-2 text-base font-medium">
              <Pencil className="w-4 h-4" />
              Short description
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Write a short bio about the client..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Client Members Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-base font-medium">
                <User className="w-4 h-4" />
                Client Members
              </label>
            </div>

            {/* Member Selection Mode */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={memberSelectionMode === 'existing' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMemberSelectionMode('existing')}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Add Existing User
                </Button>
                <Button
                  type="button"
                  variant={memberSelectionMode === 'new' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMemberSelectionMode('new')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New User
                </Button>
              </div>

              {memberSelectionMode === 'existing' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search existing users</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        searchUsers(e.target.value);
                      }}
                      className="pl-10 h-11"
                    />
                  </div>
                </div>
              )}

              {memberSelectionMode === 'new' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Create new user</label>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Full Name"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-11"
                    />
                    <Input
                      placeholder="Email Address"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Search Results for Existing Users */}
            {memberSelectionMode === 'existing' && searchQuery && availableUsers.length > 0 && (
              <div className="border rounded-lg max-h-48 overflow-y-auto bg-muted/30">
                {loading ? (
                  <div className="p-4 text-center text-muted-foreground flex items-center justify-center gap-2">
                    <LoadingSpinner size="sm" />
                    Loading users...
                  </div>
                ) : (
                  <div className="divide-y">
                    {availableUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => addExistingUser(user)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            {user.avatar ? (
                              <AvatarImage src={user.avatar} alt={user.name} />
                            ) : null}
                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                              {user.name
                                .split(" ")
                                .map((n: string) => n.charAt(0))
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="text-primary hover:text-primary">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Add Button */}
            {(memberSelectionMode === 'existing' && searchQuery && availableUsers.length > 0) || 
             (memberSelectionMode === 'new' && searchQuery && formData.email) ? (
              <Button
                type="button"
                onClick={() => {
                  if (memberSelectionMode === 'new') {
                    const newMember: ClientMember = {
                      name: searchQuery,
                      email: formData.email,
                      role: "member",
                      isNew: true,
                      isExisting: false,
                    };
                    setFormData(prev => ({
                      ...prev,
                      clientMembers: [...prev.clientMembers, newMember],
                    }));
                    setSearchQuery("");
                    setFormData(prev => ({ ...prev, email: "" }));
                  } else {
                    addClientMember();
                  }
                }}
                variant="outline"
                size="sm"
                className="w-full text-primary hover:text-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                {memberSelectionMode === 'existing' ? 'Add Selected User' : 'Add New User'}
              </Button>
            ) : null}

            {/* Current Client Members */}
            {formData.clientMembers.length > 0 && (
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {formData.clientMembers.map((member, index) => (
                  <div
                    key={index}
                    className="bg-muted/30 border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Member {index + 1}
                        </span>
                        {member.isExisting && (
                          <Badge variant="secondary" className="text-xs">
                            Existing User
                          </Badge>
                        )}
                        {member.isNew && (
                          <Badge variant="outline" className="text-xs">
                            New User
                          </Badge>
                        )}
                      </div>
                      <Button
                        type="button"
                        onClick={() => removeClientMember(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Name
                        </label>
                        <Input
                          type="text"
                          value={member.name}
                          onChange={(e) => updateClientMember(index, "name", e.target.value)}
                          placeholder="Full Name"
                          className="h-9"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Email
                        </label>
                        <Input
                          type="email"
                          value={member.email}
                          onChange={(e) => updateClientMember(index, "email", e.target.value)}
                          placeholder="email@example.com"
                          className="h-9"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Role
                        </label>
                        <Select
                          value={member.role}
                          onValueChange={(value) => updateClientMember(index, "role", value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        {member.isNew && !member.id && (
                          <Button
                            type="button"
                            onClick={() => createAndAddUser(member.email, member.name)}
                            size="sm"
                            className="w-full"
                            disabled={!member.email || !member.name}
                          >
                            Create User
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {formData.clientMembers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No additional members added yet</p>
                <p className="text-xs">Click "Add Member" to add team members</p>
              </div>
            )}
          </div>

          <Separator className="my-2" />

          {/* Footer */}
          <div className="flex items-center justify-between pt-2">
            <Button
              type="submit"
              disabled={!isValid || isLoading}
              className="bg-primary hover:bg-primary/90 px-8 py-2 h-11"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </span>
              ) : (
                "Update Client"
              )}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="px-2 py-2 h-11"
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}