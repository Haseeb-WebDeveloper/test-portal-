"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserRole } from "@/types/enums";
import {
  Loader2,
  Save,
  User,
  Mail,
  Shield,
  Camera,
  Building,
  Phone,
  MapPin,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";

interface ClientProfile {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Client-specific fields
  company?: string;
  phone?: string;
  address?: string;
  industry?: string;
  website?: string;
}

export default function ClientProfilePage() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    isActive: true,
    avatar: "",
    company: "",
    phone: "",
    address: "",
    industry: "",
    website: "",
  });

  // SWR for profile data with 60s cache
  const { data: swrProfile, error, isLoading } = useSWR(
    user ? "/api/auth/profile" : null,
    async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch profile");
      return (await response.json()) as ClientProfile;
    },
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
      dedupingInterval: 60000,
      refreshInterval: 0,
    }
  );

  // Update local state when SWR data changes
  useEffect(() => {
    if (swrProfile) {
      setProfile(swrProfile);
      setFormData({
        name: swrProfile.name,
        email: swrProfile.email,
        role: swrProfile.role,
        isActive: swrProfile.isActive,
        avatar: swrProfile.avatar || "",
        company: swrProfile.company || "",
        phone: swrProfile.phone || "",
        address: swrProfile.address || "",
        industry: swrProfile.industry || "",
        website: swrProfile.website || "",
      });
    }
  }, [swrProfile]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Please select an image smaller than 5MB.");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.message || "Upload failed");
      }
      
      const uploadedUrl = result.url;
      if (!uploadedUrl) {
        toast.error("Upload succeeded but no URL returned.");
        return;
      }
      
      handleInputChange("avatar", uploadedUrl);
      toast.success("Avatar updated successfully");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error?.message || "Failed to upload avatar. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    // Form validation
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Website validation (if provided)
    if (formData.website && formData.website.trim()) {
      const websiteRegex = /^https?:\/\/.+/;
      if (!websiteRegex.test(formData.website)) {
        toast.error(
          "Please enter a valid website URL (starting with http:// or https://)"
        );
        return;
      }
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
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

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "CLIENT":
        return "Client";
      case "CLIENT_MEMBER":
        return "Client Member";
      default:
        return role;
    }
  };

  if (loading || isLoading) {
    return (
      <div className="container mx-auto p-6 lg:px-12 space-y-6">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Form Skeleton */}
        <div className="max-w-2xl space-y-6">
          {/* Avatar Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-40" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-44" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* Account Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-36" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
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
    <div className="container mx-auto p-6 lg:px-12 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="figma-h3">Profile</h1>
          <p className="text-muted-foreground">Manage your account settings and profile information</p>
        </div>
      </div>

      {/* Profile Form */}
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Profile Picture</h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={formData.avatar || ""} alt="Profile" />
                  <AvatarFallback className="text-lg">
                    {formData.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Click the camera icon to change your profile picture
                </p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG or GIF. Max size 5MB.
                </p>
              </div>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Personal Information</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Company Information</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company">Company Name</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                  placeholder="Enter company name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => handleInputChange("industry", e.target.value)}
                  placeholder="Enter industry"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter company address"
              />
            </div>
          </div>

          {/* Account Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Account Settings</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleInputChange("role", value)}
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

              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange("isActive", e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isActive">Account is active</Label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving} className="min-w-[120px]">
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
        </form>
      </div>
    </div>
  );
}
