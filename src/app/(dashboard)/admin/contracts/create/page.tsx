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
import { MediaGrid } from "@/components/admin/media-grid";
import {
  ArrowLeft,
  Save,
  Plus,
  X,
  Calendar,
  DollarSign,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { ContractStatus } from "@/types/enums";

interface Client {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  avatar: string | null;
}

interface ContractFormData {
  clientId: string;
  title: string;
  description: string;
  status: ContractStatus;
  startDate: string;
  endDate: string;
  currency: string;
  budget: string;
  estimatedHours: string;
  priority: number;
  tags: string[];
  media: any[];
}

export default function CreateContractPage() {
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

  const [formData, setFormData] = useState<ContractFormData>({
    clientId: "",
    title: "",
    description: "",
    status: ContractStatus.DRAFT,
    startDate: "",
    endDate: "",
    currency: "USD",
    budget: "",
    estimatedHours: "",
    priority: 3,
    tags: [],
    media: [],
  });

  const [errors, setErrors] = useState<Partial<ContractFormData>>({});

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
    const newErrors: Partial<ContractFormData> = {};

    if (!formData.clientId) {
      newErrors.clientId = "Client is required";
    }
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (formData.budget && isNaN(parseFloat(formData.budget))) {
      newErrors.budget = "Budget must be a valid number";
    }
    if (formData.estimatedHours && isNaN(parseInt(formData.estimatedHours))) {
      newErrors.estimatedHours = "Estimated hours must be a valid number";
    }
    if (createRoom && !roomName.trim()) {
      (newErrors as any).roomName =
        "Room name is required when creating a room";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (status: ContractStatus) => {
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/contracts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          status,
          budget: formData.budget ? parseFloat(formData.budget) : null,
          estimatedHours: formData.estimatedHours
            ? parseInt(formData.estimatedHours)
            : null,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          createRoom,
          roomName: createRoom ? roomName.trim() : undefined,
          roomAvatar: createRoom ? roomAvatar?.filePath : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(
          `Contract ${
            status === ContractStatus.DRAFT ? "saved as draft" : "created"
          } successfully`
        );
        router.push("/admin/contracts");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create contract");
      }
    } catch (error) {
      console.error("Error creating contract:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create contract"
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
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleFileUpload = (files: any[]) => {
    setFormData((prev) => ({
      ...prev,
      media: [...prev.media, ...files],
    }));
  };

  const handleRemoveFile = (fileId: string) => {
    setFormData((prev) => ({
      ...prev,
      media: prev.media.filter((file) => file.id !== fileId),
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
      <div className="flex items-center gap-4 justify-between w-full">
        <h1 className="figma-h3">Create New Contract</h1>
        <Link href="/admin/contracts" className="cursor-pointer flex items-center">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Contracts
        </Link>
      </div>

      <div className=" mx-auto space-y-6">
        {/* Basic Information */}
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
                placeholder="Enter contract title"
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
                placeholder="Enter contract description"
                rows={6}
                className={errors.description ? "border-red-500" : ""}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Budget and Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Budget</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        budget: e.target.value,
                      }))
                    }
                    placeholder="0.00"
                    className={`pl-10 ${errors.budget ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.budget && (
                  <p className="text-sm text-red-600">{errors.budget}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedHours">Estimated Hours</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="estimatedHours"
                    type="number"
                    value={formData.estimatedHours}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        estimatedHours: e.target.value,
                      }))
                    }
                    placeholder="0"
                    className={`pl-10 ${
                      errors.estimatedHours ? "border-red-500" : ""
                    }`}
                  />
                </div>
                {errors.estimatedHours && (
                  <p className="text-sm text-red-600">
                    {errors.estimatedHours}
                  </p>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Currency and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, currency: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                    <SelectItem value="AUD">AUD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority.toString()}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      priority: parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Critical</SelectItem>
                    <SelectItem value="2">High</SelectItem>
                    <SelectItem value="3">Medium</SelectItem>
                    <SelectItem value="4">Low</SelectItem>
                    <SelectItem value="5">Very Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Service Tags */}
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

        {/* Contract Room */}
        <Card>
          <CardHeader>
            <CardTitle>Contract Room</CardTitle>
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
                Create a discussion room for this Contract
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
                        src={
                          roomAvatar?.filePath ||
                          "https://i.pravatar.cc/100?img=13"
                        }
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
                          form.append("file", file);
                          form.append("folder", "agency-portal/rooms");
                          const res = await fetch("/api/upload", {
                            method: "POST",
                            body: form,
                          });
                          if (res.ok) {
                            const data = await res.json();
                            setRoomAvatar({
                              id: `${Date.now()}-${Math.random()
                                .toString(36)
                                .slice(2)}`,
                              fileName: data.name,
                              filePath: data.url,
                              fileSize: data.size,
                              mimeType: data.type,
                              uploadedAt: new Date().toISOString(),
                            });
                            toast.success("Room avatar uploaded");
                          } else {
                            toast.error("Failed to upload avatar");
                          }
                        } catch (err) {
                          toast.error("Failed to upload avatar");
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
        <Card>
          <CardHeader>
            <CardTitle>Project Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <MediaGrid
              files={formData.media}
              onUpload={handleFileUpload}
              onRemove={handleRemoveFile}
              canEdit={true}
              maxFiles={10}
            />
          </CardContent>
        </Card>
      </div>

      {/* Bottom action bar */}
      <div className="sticky bottom-0 mt-8 border-t py-4">
        <div className=" mx-auto flex items-center justify-between gap-3">
          <div className="w-52">
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  status: value as ContractStatus,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ContractStatus.DRAFT}>Draft</SelectItem>
                <SelectItem value={ContractStatus.PENDING_APPROVAL}>
                  Pending Approval
                </SelectItem>
                <SelectItem value={ContractStatus.ACTIVE}>Active</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/admin/contracts">Cancel</Link>
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
              Create Contract
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
