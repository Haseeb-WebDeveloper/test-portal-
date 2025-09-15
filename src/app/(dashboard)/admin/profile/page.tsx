"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FileUpload from "@/components/ui/file-upload";
import { UserRole } from "@/types/enums";
import {
  Loader2,
  Edit,
  Save,
  X,
  User,
  Mail,
  Shield,
  Calendar,
  CheckCircle,
  Camera,
} from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminProfilePage() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "",
    isActive: true,
    avatar: "",
  });

  // Fetch detailed user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/auth/profile");
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          setEditForm({
            name: data.name,
            email: data.email,
            role: data.role,
            isActive: data.isActive,
            avatar: data.avatar || "",
          });
        } else {
          toast.error("Failed to fetch profile data");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Error fetching profile data");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (profile) {
      setEditForm({
        name: profile.name,
        email: profile.email,
        role: profile.role,
        isActive: profile.isActive,
        avatar: profile.avatar || "",
      });
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!profile) return;

    // Form validation
    if (!editForm.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!editForm.email.trim()) {
      toast.error("Email is required");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editForm.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setIsEditing(false);
        toast.success("Profile updated successfully");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error updating profile");
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "PLATFORM_ADMIN":
        return "destructive";
      case "AGENCY_MEMBER":
        return "default";
      case "CLIENT":
        return "secondary";
      case "CLIENT_MEMBER":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "PLATFORM_ADMIN":
        return "Platform Admin";
      case "AGENCY_MEMBER":
        return "Agency Member";
      case "CLIENT":
        return "Client";
      case "CLIENT_MEMBER":
        return "Client Member";
      default:
        return role;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Profile not found</h3>
          <p className="text-muted-foreground">
            Unable to load your profile information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 lg:p-12 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="figma-h3">Profile</h1>
        </div>
        <Button onClick={handleEdit} disabled={isEditing}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information Card */}
        <div>
          <div>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </div>
            <p>Your personal account details</p>
          </div>
          <div className="space-y-6">
            {/* Avatar and Basic Info */}
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.avatar || ""} alt={profile.name} />
                  <AvatarFallback className="text-lg">
                    {profile.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleEdit}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-semibold">{profile.name}</h3>
                <div className="flex items-center gap-2">
                  <Badge variant={getRoleBadgeVariant(profile.role)}>
                    {getRoleDisplayName(profile.role)}
                  </Badge>
                  {profile.isActive ? (
                    <Badge
                      variant="outline"
                      className="text-green-600 border-green-600"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-red-600 border-red-600"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Inactive
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">
                    {profile.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Role</p>
                  <p className="text-sm text-muted-foreground">
                    {getRoleDisplayName(profile.role)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Member Since</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(profile.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(profile.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Dialog */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                Make changes to your profile information. Click save when you're
                done.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Avatar Upload */}
              <div className="space-y-2">
                <Label>Profile Picture</Label>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={editForm.avatar || ""} alt="Profile" />
                    <AvatarFallback className="text-lg">
                      {editForm.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <FileUpload
                      value={editForm.avatar}
                      onChange={(url) =>
                        setEditForm({ ...editForm, avatar: url || "" })
                      }
                      accept="image/*"
                      maxSize={2}
                      label=""
                      placeholder="Click to upload or drag and drop"
                    />
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground">
                        Recommended: Square image, max 2MB
                      </p>
                      {editForm.avatar && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setEditForm({ ...editForm, avatar: "" })
                          }
                          className="text-xs text-muted-foreground hover:text-destructive"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(UserRole).map((role) => (
                      <SelectItem key={role} value={role}>
                        {getRoleDisplayName(role)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editForm.isActive}
                  onChange={(e) =>
                    setEditForm({ ...editForm, isActive: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isActive">Account is active</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
