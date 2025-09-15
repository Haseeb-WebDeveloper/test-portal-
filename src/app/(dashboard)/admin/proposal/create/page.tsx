"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ArrowLeft, Save, Send, Plus, X } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { ProposalStatus } from "@/types/enums";
import { MediaGrid } from "@/components/admin/media-grid";

interface Client {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  avatar: string | null;
}

interface ProposalFormData {
  clientId: string;
  title: string;
  description: string;
  status: ProposalStatus;
  tags: string[];
  media: any[];
}

export default function CreateProposalPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [newTag, setNewTag] = useState("");
  const [createRoom, setCreateRoom] = useState(true);
  const [roomName, setRoomName] = useState("");
  const [roomAvatar, setRoomAvatar] = useState<any | null>(null);
  const [isUploadingRoomAvatar, setIsUploadingRoomAvatar] = useState(false);
  const roomAvatarInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState<ProposalFormData>({
    clientId: "",
    title: "",
    description: "",
    status: ProposalStatus.DRAFT,
    tags: [],
    media: [],
  });

  const [errors, setErrors] = useState<Partial<ProposalFormData>>({});

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/admin/clients");
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      } else {
        throw new Error("Failed to fetch clients");
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Failed to fetch clients");
    } finally {
      setIsLoadingClients(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ProposalFormData> = {};

    if (!formData.clientId) {
      newErrors.clientId = "Client is required";
    }
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    // @ts-ignore UI-only validation key
    if (createRoom && !roomName.trim()) {
      (newErrors as any).roomName =
        "Room name is required when creating a room";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (status: ProposalStatus) => {
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/proposals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          status,
          createRoom,
          roomName: createRoom ? roomName.trim() : undefined,
          roomAvatar: createRoom ? roomAvatar?.filePath : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(
          `Proposal ${
            status === ProposalStatus.DRAFT ? "created" : "created and sent"
          } successfully`
        );
        router.push("/admin/proposal");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create proposal");
      }
    } catch (error) {
      console.error("Error creating proposal:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create proposal"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleFileUpload = async (files: any[]) => {
    try {
      setFormData((prev) => ({
        ...prev,
        media: [...prev.media, ...files],
      }));
      toast.success("Files uploaded successfully");
    } catch (error) {
      console.error("Error adding files:", error);
      toast.error("Failed to add files");
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setFormData((prev) => ({
      ...prev,
      media: prev.media.filter((file: any) => file.id !== fileId),
    }));
  };

  if (isLoadingClients) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:px-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="figma-h3">Create New Proposal</h1>
        </div>
        <Link
          href="/admin/proposal"
          className="cursor-pointer px-6 py-2 flex items-center gap-2 transition-all"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Proposals
        </Link>
      </div>

      <div className="max-w-4xl">
        {/* Main Form (single column) */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Client Selection */}
              <div className="space-y-2">
                <Label htmlFor="clientId">Client *</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, clientId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        <div className="flex items-center gap-2">
                          {client.avatar && (
                            <img
                              src={client.avatar}
                              alt={client.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          )}
                          <span>{client.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.clientId && (
                  <p className="text-sm text-red-600">{errors.clientId}</p>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Enter proposal title"
                  className={errors.title ? "border-red-500" : ""}
                />
                {errors.title && (
                  <p className="text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Enter proposal description"
                  rows={6}
                  className={errors.description ? "border-red-500" : ""}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Service Tags</Label>
                <p className="text-xs text-muted-foreground">
                  Add service tags (type to create custom tags)
                </p>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Type to add custom tags or select from suggestions..."
                    className="flex-1"
                  />
                  <Button type="button" onClick={handleAddTag} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Proposal Room */}
          <Card>
            <CardHeader>
              <CardTitle>Proposal Room</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  id="createRoom"
                  type="checkbox"
                  checked={createRoom}
                  onChange={(e) => setCreateRoom(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="createRoom" className="cursor-pointer">
                  Create a discussion room for this Proposal
                </Label>
              </div>

              {createRoom && (
                <div className="space-y-2">
                  <Label htmlFor="roomName">Room Name</Label>
                  <Input
                    id="roomName"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Room Name"
                  />
                  {(errors as any).roomName && (
                    <p className="text-sm text-red-600">
                      {(errors as any).roomName}
                    </p>
                  )}
                  <div className="pt-2">
                    <Label>Room Avatar</Label>
                    <div className="mt-2 flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => roomAvatarInputRef.current?.click()}
                        className="relative w-14 h-14 rounded-full overflow-hidden ring-1 ring-border hover:ring-2 hover:ring-primary transition"
                        aria-label="Change room avatar"
                      >
                        <img
                          src={roomAvatar?.filePath || 'https://i.pravatar.cc/100?img=13'}
                          alt="Room Avatar"
                          className="w-full h-full object-cover"
                        />
                        {isUploadingRoomAvatar && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <LoadingSpinner className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </button>
                      <input
                        ref={roomAvatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            setIsUploadingRoomAvatar(true);
                            const form = new FormData();
                            form.append('file', file);
                            form.append('folder', 'agency-portal/rooms');
                            const res = await fetch('/api/upload', { method: 'POST', body: form });
                            if (res.ok) {
                              const data = await res.json();
                              setRoomAvatar({
                                id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                                fileName: data.name,
                                filePath: data.url,
                                fileSize: data.size,
                                mimeType: data.type,
                                uploadedAt: new Date().toISOString(),
                              });
                              toast.success('Room avatar uploaded');
                            } else {
                              toast.error('Failed to upload avatar');
                            }
                          } catch (err) {
                            toast.error('Failed to upload avatar');
                          } finally {
                            setIsUploadingRoomAvatar(false);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Assets */}
          <div>
            <MediaGrid
              files={formData.media}
              onUpload={handleFileUpload}
              onRemove={handleRemoveFile}
              canEdit={true}
              maxFiles={10}
            />
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="sticky bottom-0 mt-8 border-t py-4">
        <div className="max-w-4xl flex items-center justify-between gap-3">
          <div className="w-52">
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  status: value as ProposalStatus,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ProposalStatus.DRAFT}>Draft</SelectItem>
                <SelectItem value={ProposalStatus.SENT}>Sent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/admin/proposal">Cancel</Link>
            </Button>
            <Button
              disabled={isLoading}
              onClick={() => handleSubmit(formData.status)}
            >
              {isLoading ? (
                <LoadingSpinner className="mr-2 h-4 w-4" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Create Proposal
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
