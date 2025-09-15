"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Camera, User, Mail, Save, Loader2 } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  isActive: boolean;
}

interface AdminProfileFormProps {
  user: UserProfile;
}

export function AdminProfileForm({ user }: AdminProfileFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [name, setName] = useState<string>(user.name || "");

  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatar || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      // Optionally, a folder can be specified by backend default
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Upload failed");
      }
      const uploadedUrl: string | undefined = result.url;
      if (!uploadedUrl) {
        toast.error("Upload succeeded but no URL returned.");
        return;
      }
      setAvatarUrl(uploadedUrl);

      // Persist avatar to profile immediately
      const saveRes = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: user.email,
          avatar: uploadedUrl,
          role: user.role,
          isActive: user.isActive,
        }),
      });

      if (saveRes.ok) {
        toast.success("Avatar updated successfully.");
      } else {
        const err = await saveRes.json().catch(() => ({}));
        toast.error(err.error || "Failed to save avatar to profile.");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error?.message || "Failed to upload avatar. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fullName = name.trim();
    if (!fullName) {
      toast.error("Name is required");
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          email: user.email,
          avatar: avatarUrl,
          role: user.role,
          isActive: user.isActive,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update profile");
      }

      toast.success("Profile updated successfully.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const initials = () => {
    const parts = (name || user.name || "").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Profile Picture
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={avatarUrl || ""} alt={user.name} />
                <AvatarFallback className="text-lg">{initials()}</AvatarFallback>
              </Avatar>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full p-0"
                onClick={handleAvatarClick}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </Button>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">{user.name}</h3>
              <p className="text-sm text-muted-foreground">
                Click the camera icon to change your profile picture
              </p>
              <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max size 5MB.</p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Personal Information
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input id="role" value={user.role.replace(/_/g, " ")} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">Your role cannot be changed</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setName(user.name || "");
            setAvatarUrl(user.avatar || null);
          }}
          disabled={isSaving}
        >
          Reset
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
