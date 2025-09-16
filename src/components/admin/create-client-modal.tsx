"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Plus,
  User,
  Mail,
  Camera,
  Pencil,
  Trash2,
  AlertCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateClientModalProps {
  onClientCreated: () => void;
}

interface FormData {
  name: string;
  email: string;
  description: string;
  website: string;
  avatar: string | null;
}

interface ClientMember {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  general?: string;
  members?: string;
}

export function CreateClientModal({ onClientCreated }: CreateClientModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    description: "",
    website: "",
    avatar: null,
  });
  const [members, setMembers] = useState<ClientMember[]>([
    { firstName: "", lastName: "", email: "", role: "member" },
  ]);

  // Add new member
  const addMember = () =>
    setMembers([
      ...members,
      { firstName: "", lastName: "", email: "", role: "member" },
    ]);

  // Update member
  const updateMember = (
    idx: number,
    field: keyof ClientMember,
    value: string
  ) => {
    const updated = [...members];
    updated[idx][field] = value;
    setMembers(updated);
  };

  // Remove member
  const removeMember = (idx: number) =>
    setMembers(members.filter((_, i) => i !== idx));

  const handleInputChange = useCallback(
    (field: keyof FormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Clear error when user starts typing
      if (errors[field as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  const handleImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          general: "Please select an image file",
        }));
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          general: "Image size must be less than 5MB",
        }));
        return;
      }

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Upload failed");
        }

        const result = await response.json();
        setFormData((prev) => ({ ...prev, avatar: result.url }));
        setErrors((prev) => ({ ...prev, general: undefined })); // Clear any previous errors
      } catch (error) {
        console.error("Upload error:", error);
        setErrors((prev) => ({
          ...prev,
          general:
            error instanceof Error
              ? error.message
              : "Failed to upload image. Please try again.",
        }));
      } finally {
        setUploading(false);
      }
    },
    []
  );

  const handleRemoveImage = useCallback(() => {
    setFormData((prev) => ({ ...prev, avatar: null }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Clear previous errors
      setErrors({});

      const newErrors: FormErrors = {};

      if (!formData.name.trim()) {
        newErrors.name = "Client name is required";
      }

      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
      } else {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          newErrors.email = "Please enter a valid email address";
        }
      }

      // Validate members
      const hasInvalidMember = members.some(
        (member) =>
          member.firstName.trim() === "" ||
          member.lastName.trim() === "" ||
          member.email.trim() === "" ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)
      );

      if (hasInvalidMember) {
        newErrors.members =
          "All member fields are required and emails must be valid";
      }

      // If there are validation errors, set them and return
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch("/api/admin/clients", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim(),
            description: formData.description.trim() || null,
            website: formData.website.trim() || null,
            avatar: formData.avatar,
            members: members.map((member) => ({
              firstName: member.firstName.trim(),
              lastName: member.lastName.trim(),
              email: member.email.trim(),
              role: member.role,
            })),
          }),
        });

        if (!response.ok) {
          const error = await response.json();

          // Parse specific error messages for better user experience
          let errorMessage = error.message || "Failed to create client";

          // Handle different HTTP status codes
          if (response.status === 409) {
            // Conflict - user already exists
            errorMessage =
              "A user with this email address already exists. Please use a different email.";
            // Set email field error for better UX
            setErrors((prev) => ({
              ...prev,
              email: "This email address is already in use",
              general: undefined,
            }));
            throw new Error(errorMessage);
          } else if (response.status === 400) {
            // Bad Request - validation error
            errorMessage =
              error.message || "Please check your input and try again.";
          } else if (response.status === 429) {
            // Too Many Requests
            errorMessage =
              "Too many requests. Please wait a moment and try again.";
          } else if (response.status === 503) {
            // Service Unavailable
            errorMessage =
              "Service temporarily unavailable. Please try again later.";
          } else if (error.details) {
            // Check for specific Supabase auth errors in details
            const details = error.details.toLowerCase();
            if (
              details.includes("already registered") ||
              details.includes("already exists") ||
              details.includes("user already registered")
            ) {
              errorMessage =
                "A user with this email address already exists. Please use a different email.";
            } else if (details.includes("invalid email")) {
              errorMessage =
                "The email address format is invalid. Please check and try again.";
            } else if (details.includes("password should be at least")) {
              errorMessage = "Password requirements not met. Please try again.";
            } else if (details.includes("rate limit")) {
              errorMessage =
                "Too many requests. Please wait a moment and try again.";
            } else if (
              details.includes("network") ||
              details.includes("connection")
            ) {
              errorMessage =
                "Network error. Please check your connection and try again.";
            } else {
              // Show the actual error details for debugging
              errorMessage = `Authentication error: ${error.details}`;
            }
          }

          throw new Error(errorMessage);
        }

        // Reset form and close modal
        setFormData({
          name: "",
          email: "",
          description: "",
          website: "",
          avatar: null,
        });
        setMembers([
          { firstName: "", lastName: "", email: "", role: "member" },
        ]);
        setErrors({});
        setOpen(false);
        onClientCreated();
      } catch (error) {
        console.error("Create client error:", error);
        setErrors((prev) => ({
          ...prev,
          general:
            error instanceof Error ? error.message : "Failed to create client",
        }));
      } finally {
        setLoading(false);
      }
    },
    [formData, members, onClientCreated]
  );

  const handleReset = useCallback(() => {
    setFormData({
      name: "",
      email: "",
      description: "",
      website: "",
      avatar: null,
    });
    setMembers([{ firstName: "", lastName: "", email: "", role: "member" }]);
    setErrors({});
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-figma-active-sidebar-gradient hover:opacity-90 text-figma-text-white figma-btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Create new client
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-black max-w-[600px] max-h-[90vh] border-border flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="figma-h3 text-figma-text-white">
            Create New Client
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <form
            id="create-client-form"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* General Error Message */}
            {errors.general && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="figma-small text-red-400">
                  {errors.general}
                </span>
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="figma-small font-medium text-figma-text-white"
              >
                Full name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-figma-text-grey" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter client name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={`pl-10 bg-input border-border text-figma-text-white placeholder:text-figma-text-grey ${
                    errors.name
                      ? "border-red-400 focus:border-red-400"
                      : "focus:border-figma-primary"
                  }`}
                  required
                />
              </div>
              {errors.name && (
                <p className="figma-small text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email Address */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="figma-small font-medium text-figma-text-white"
              >
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-figma-text-grey" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`pl-10 bg-input border-border text-figma-text-white placeholder:text-figma-text-grey ${
                    errors.email
                      ? "border-red-400 focus:border-red-400 ring-1 ring-red-400/20"
                      : "focus:border-figma-primary"
                  }`}
                  required
                />
              </div>
              {errors.email && (
                <p className="figma-small text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Photo Upload */}
            <div className="space-y-2">
              <Label className="figma-small font-medium text-figma-text-white">
                Photo
              </Label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="w-16 h-16">
                    <AvatarImage
                      src={formData.avatar || ""}
                      alt="Client logo"
                    />
                    <AvatarFallback className="bg-muted text-figma-text-grey">
                      <Camera className="w-6 h-6" />
                    </AvatarFallback>
                  </Avatar>
                  {uploading && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-full">
                      <LoadingSpinner size="sm" />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="logo-upload"
                    disabled={uploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      document.getElementById("logo-upload")?.click()
                    }
                    disabled={uploading}
                    className="border-figma-primary/40 hover:bg-figma-transparency-10 text-figma-text-white"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Change photo
                  </Button>
                  {formData.avatar && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveImage}
                      className="border-figma-alert/40 hover:bg-figma-alert/10 text-figma-alert"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label
                htmlFor="website"
                className="figma-small font-medium text-figma-text-white"
              >
                Website
              </Label>
              <Input
                id="website"
                type="url"
                placeholder="https://example.com"
                value={formData.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
                className="bg-input border-border text-figma-text-white placeholder:text-figma-text-grey focus:border-figma-primary"
              />
            </div>

            {/* Short Description */}
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="figma-small font-medium text-figma-text-white"
              >
                Short description
              </Label>
              <div className="relative">
                <Pencil className="absolute left-3 top-3 h-4 w-4 text-figma-text-grey" />
                <Textarea
                  id="description"
                  placeholder="Write a short bio about the client..."
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  className="pl-10 min-h-[100px] resize-none bg-input border-border text-figma-text-white placeholder:text-figma-text-grey focus:border-figma-primary"
                />
              </div>
            </div>

            {/* Client Members Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="figma-small font-medium text-figma-text-white">
                  Client Members
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMember}
                  className="text-figma-primary hover:text-figma-primary-purple-1 border-figma-primary/40 hover:bg-figma-transparency-10"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              </div>

              {errors.members && (
                <p className="figma-small text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.members}
                </p>
              )}

              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {members.map((member, idx) => (
                  <div
                    key={idx}
                    className="border border-border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="figma-small text-figma-text-grey"
                      >
                        Member {idx + 1}
                      </span>
                      {members.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeMember(idx)}
                          variant="ghost"
                          size="sm"
                          className="text-figma-alert hover:text-figma-alert/80"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="figma-x-small text-figma-text-grey mb-1 block">
                          First Name
                        </Label>
                        <Input
                          type="text"
                          value={member.firstName}
                          onChange={(e) =>
                            updateMember(idx, "firstName", e.target.value)
                          }
                          placeholder="First Name"
                          className="h-9 bg-primary border-border text-figma-text-white placeholder:text-figma-text-grey focus:border-figma-primary"
                          required
                        />
                      </div>
                      <div>
                        <Label className="figma-x-small text-figma-text-grey mb-1 block">
                          Last Name
                        </Label>
                        <Input
                          type="text"
                          value={member.lastName}
                          onChange={(e) =>
                            updateMember(idx, "lastName", e.target.value)
                          }
                          placeholder="Last Name"
                          className="h-9 bg-primary border-border text-figma-text-white placeholder:text-figma-text-grey focus:border-figma-primary"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="figma-x-small text-figma-text-grey mb-1 block">
                          Email
                        </Label>
                        <Input
                          type="email"
                          value={member.email}
                          onChange={(e) =>
                            updateMember(idx, "email", e.target.value)
                          }
                          placeholder="email@example.com"
                          className="h-9 bg-primary border-border text-figma-text-white placeholder:text-figma-text-grey focus:border-figma-primary"
                          required
                        />
                      </div>
                      <div>
                        <Label className="figma-x-small text-figma-text-grey mb-1 block">
                          Role
                        </Label>
                        <Select
                          value={member.role}
                          onValueChange={(value) =>
                            updateMember(idx, "role", value)
                          }
                        >
                          <SelectTrigger className="h-9 bg-primary border-border text-figma-text-white focus:border-figma-primary">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Action Buttons Footer */}
        <div className="p-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={handleReset}
              className="text-figma-text-grey hover:text-figma-text-white figma-small"
            >
              Reset changes
            </Button>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="create-client-form"
                disabled={loading}
                className="bg-figma-active-sidebar-gradient hover:opacity-90 text-figma-text-white figma-btn-primary"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Client"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
