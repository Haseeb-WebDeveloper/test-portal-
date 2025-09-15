"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  Loader2,
  Image as ImageIcon,
  Trash2,
  Pencil,
  User,
  Mail,
  Plus,
  Minus,
} from "lucide-react";
import { useAvatarUpload } from "@/hooks/use-avatar-upload";
import { ClientWithDetails } from "@/lib/clients";
import { Input } from "../ui/input";

interface ClientMember {
  id?: string;
  name: string;
  email: string;
  role: string;
  isNew?: boolean;
}

interface ClientEditModalProps {
  client: ClientWithDetails;
  onClose: () => void;
  onClientUpdated: () => void;
}

interface ClientFormData {
  name: string;
  description: string;
  avatar: string;
  website: string;
  email: string;
  clientMembers: ClientMember[];
}

const AVATAR_PLACEHOLDER =
  "https://api.dicebear.com/7.x/lorelei-neutral/svg?seed=client";

export function ClientEditModal({
  client,
  onClose,
  onClientUpdated,
}: ClientEditModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ClientFormData>({
    name: client.name,
    description: client.description || "",
    avatar: client.avatar || "",
    website: client.website || "",
    email: client.teamMembers.find(member => member.role === 'PRIMARY_CONTACT')?.email || client.teamMembers[0]?.email || "",
    clientMembers: client.teamMembers.filter(member => member.role !== 'PRIMARY_CONTACT').map(member => ({
      id: member.id,
      name: member.name,
      email: member.email || "",
      role: member.role || "member",
      isNew: false,
    })),
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    uploadFile: uploadAvatar,
    clearFile: clearAvatar,
    isUploading: isUploadingAvatar,
    previewUrl: avatarPreview,
    setInitialFile,
  } = useAvatarUpload({
    folder: 'agency-portal/avatars',
    onSuccess: (file) => {
      setFormData((prev) => ({ ...prev, avatar: file.url }));
    },
    onError: (error) => {
      setError(error);
    },
  });

  // Initialize the preview with existing avatar
  useEffect(() => {
    if (client.avatar) {
      setInitialFile({ url: client.avatar, type: 'image', name: 'avatar', size: 0 });
    }
  }, [client.avatar, setInitialFile]);

  const handleInputChange = (field: keyof ClientFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addClientMember = () => {
    const newMember: ClientMember = {
      name: "",
      email: "",
      role: "member",
      isNew: true,
    };
    setFormData((prev) => ({
      ...prev,
      clientMembers: [...prev.clientMembers, newMember],
    }));
  };

  const removeClientMember = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      clientMembers: prev.clientMembers.filter((_, i) => i !== index),
    }));
  };

  const updateClientMember = (index: number, field: keyof ClientMember, value: string) => {
    setFormData((prev) => ({
      ...prev,
      clientMembers: prev.clientMembers.map((member, i) =>
        i === index ? { ...member, [field]: value } : member
      ),
    }));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    try {
      await uploadAvatar(file);
    } catch (err) {
      // Error is already handled by the hook's onError callback
    }
  };

  const handleAvatarDelete = () => {
    clearAvatar();
    setFormData((prev) => ({ ...prev, avatar: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Remove email from formData since it's not editable
      const { email, ...updateData } = formData;
      
      console.log('Updating client with data:', updateData);
      
      const response = await fetch(`/api/admin/clients/${client.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Update failed:', errorData);
        throw new Error(errorData.error || "Failed to update client");
      }

      console.log('Client updated successfully');
      onClientUpdated();
    } catch (err) {
      console.error('Update error:', err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const isValid =
    formData.name.trim() !== "" &&
    formData.clientMembers.every(member => 
      member.name.trim() !== "" && 
      member.email.trim() !== ""
    );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-[#18132A] border border-[#2B2346] rounded-xl w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2B2346]">
          <h2 className="text-lg font-bold text-white">Edit Client</h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/70 transition-colors"
            disabled={isLoading || isUploadingAvatar}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {error && (
            <div className="bg-red-900/10 border border-red-900/20 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Company name */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-base mb-2">
              <User className="w-4 h-4" />
              Company Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Company Name"
              className="w-full bg-transparent border border-[#2B2346] rounded-lg px-4 py-2 placeholder:text-white/40 focus:outline-none transition-all"
              required
              autoFocus
            />
          </div>

          {/* Email address */}
          <div>
            <label className="flex items-center gap-2 text-base mb-2">
              <Mail className="w-4 h-4" />
              Email address
            </label>
            <input
              type="email"
              value={formData.email}
              placeholder="john@dashdark.com"
              className="w-full bg-[#201A36] border border-[#2B2346] rounded-lg px-4 py-2 text-white/60 cursor-not-allowed"
              disabled
              readOnly
            />
            <p className="text-xs text-white/40 mt-1">Primary contact email cannot be changed</p>
          </div>

          {/* Website */}
          <div>
            <label className="flex items-center gap-2 text-base mb-2">
              <Pencil className="w-4 h-4" />
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange("website", e.target.value)}
              placeholder="https://example.com"
              className="w-full bg-transparent border border-[#2B2346] rounded-lg px-4 py-2 placeholder:text-white/40 focus:outline-none transition-all"
            />
          </div>

          {/* Photo */}
          <div>
            <label className="flex items-center gap-2 text-base mb-2">
              <ImageIcon className="w-4 h-4" />
              Photo
            </label>
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <img
                  src={avatarPreview || AVATAR_PLACEHOLDER}
                  alt="Client avatar"
                  className="w-28 h-28 rounded-full object-cover border-4 border-[#2B2346] bg-[#201A36]"
                />
                {/* Loading overlay */}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <div className="relative">
                      <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                    </div>
                  </div>
                )}
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                  disabled={isLoading || isUploadingAvatar}
                />
              </div>
              <div className="flex gap-4 mt-2">
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs text-white/80 hover:text-[#7C5CFA] transition-colors disabled:opacity-50"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || isUploadingAvatar}
                >
                  <Pencil className="w-4 h-4" />
                  {isUploadingAvatar ? "Uploading..." : "Change photo"}
                </button>
                {(avatarPreview && avatarPreview !== AVATAR_PLACEHOLDER) && (
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                    onClick={handleAvatarDelete}
                    disabled={isLoading || isUploadingAvatar}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Short description */}
          <div>
            <label className="flex items-center gap-2 text-base mb-2">
              <Pencil className="w-4 h-4" />
              Short description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Write a short bio about the client..."
              rows={3}
              className="w-full bg-transparent border border-[#2B2346] rounded-lg px-4 py-2 placeholder:text-white/40 focus:outline-none transition-all resize-none"
            />
          </div>

          {/* Client Members Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-base">
                <User className="w-4 h-4" />
                Client Members
              </label>
              <button
                type="button"
                onClick={addClientMember}
                className="flex items-center gap-2 text-sm text-[#7C5CFA] hover:text-[#6B42D1] transition-colors"
                disabled={isLoading || isUploadingAvatar}
              >
                <Plus className="w-4 h-4" />
                Add Member
              </button>
            </div>

            {formData.clientMembers.length > 0 && (
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {formData.clientMembers.map((member, index) => (
                  <div
                    key={index}
                    className="bg-[#201A36] border border-[#2B2346] rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/60">
                        Member {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeClientMember(index)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                        disabled={isLoading || isUploadingAvatar}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-white/60 mb-1 block">
                          Name
                        </label>
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) => updateClientMember(index, "name", e.target.value)}
                          placeholder="Full Name"
                          className="w-full bg-transparent border border-[#2B2346] rounded px-3 py-2 text-sm placeholder:text-white/40 focus:outline-none transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs text-white/60 mb-1 block">
                          Email
                        </label>
                        <input
                          type="email"
                          value={member.email}
                          onChange={(e) => updateClientMember(index, "email", e.target.value)}
                          placeholder="email@example.com"
                          className="w-full bg-transparent border border-[#2B2346] rounded px-3 py-2 text-sm placeholder:text-white/40 focus:outline-none transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-white/60 mb-1 block">
                          Role
                        </label>
                        <select
                          value={member.role}
                          onChange={(e) => updateClientMember(index, "role", e.target.value)}
                          className="w-full bg-transparent border border-[#2B2346] rounded px-3 py-2 text-sm focus:outline-none transition-all"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {formData.clientMembers.length === 0 && (
              <div className="text-center py-8 text-white/40">
                <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No additional members added yet</p>
                <p className="text-xs">Click "Add Member" to add team members</p>
              </div>
            )}
          </div>

          <hr className="border-[#2B2346] my-2" />

          {/* Footer */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              disabled={!isValid || isLoading || isUploadingAvatar}
              className="bg-[#7C5CFA] hover:bg-[#6B42D1] px-8 py-2 rounded-lg transition-colors disabled:opacity-60"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </span>
              ) : (
                <span className="cursor-pointer flex items-center gap-2 disabled:cursor-not-allowed">
                  Update Client
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-white/60 hover:text-white/90 transition-colors px-2 py-2"
              disabled={isLoading || isUploadingAvatar}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}