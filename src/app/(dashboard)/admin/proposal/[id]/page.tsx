"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { 
  ArrowLeft, 
  Edit, 
  Save,
  X,
  User, 
  Tag,
  CheckCircle,
  AlertCircle,
  XCircle,
  Plus,
  Send,
  Eye,
  Clock
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ProposalStatus } from "@/types/enums";
import { MediaGrid } from "@/components/admin/media-grid";

interface Proposal {
  id: string;
  title: string;
  description: string | null;
  status: ProposalStatus;
  hasReviewed: boolean;
  tags: string[];
  media: any;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    name: string;
    avatar: string | null;
    description: string | null;
    website: string | null;
  };
  creator: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  } | null;
  contracts: {
    id: string;
    title: string;
    status: string;
    createdAt: string;
  }[];
  rooms?: { id: string; name: string; avatar?: string | null }[];
}

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  SEEN: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  DECLINED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-orange-100 text-orange-800',
  WITHDRAWN: 'bg-purple-100 text-purple-800',
};

const statusIcons = {
  DRAFT: AlertCircle,
  SENT: Send,
  SEEN: Eye,
  ACCEPTED: CheckCircle,
  DECLINED: XCircle,
  EXPIRED: Clock,
  WITHDRAWN: XCircle,
};

export default function ProposalViewPage() {
  const params = useParams();
  const router = useRouter();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [roomName, setRoomName] = useState("");
  const [roomAvatar, setRoomAvatar] = useState<any | null>(null);
  const [isUploadingRoomAvatar, setIsUploadingRoomAvatar] = useState(false);
  const roomAvatarInputRef = useRef<HTMLInputElement | null>(null);
  
  // Form state for editing
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    status: ProposalStatus.DRAFT,
    hasReviewed: false,
    tags: [] as string[]
  });

  useEffect(() => {
    if (params.id) {
      fetchProposal(params.id as string);
    }
  }, [params.id]);

  const fetchProposal = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/proposals/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProposal(data.proposal);
        const r = (data.proposal.rooms || [])[0];
        if (r) {
          setRoomName(r.name || "");
          if (r.avatar) {
            setRoomAvatar({ filePath: r.avatar });
          }
        }
        
        // Populate edit data
        setEditData({
          title: data.proposal.title,
          description: data.proposal.description || '',
          status: data.proposal.status,
          hasReviewed: data.proposal.hasReviewed,
          tags: data.proposal.tags || []
        });
      } else {
        throw new Error('Failed to fetch proposal');
      }
    } catch (error) {
      console.error('Error fetching proposal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (proposal) {
      setEditData({
        title: proposal.title,
        description: proposal.description || '',
        status: proposal.status,
        hasReviewed: proposal.hasReviewed,
        tags: proposal.tags || []
      });
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!proposal) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/proposals/${proposal.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...editData,
          createRoom: true,
          roomName: roomName || undefined,
          roomAvatar: roomAvatar || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProposal(data.proposal);
        setIsEditing(false);
        toast.success("Proposal updated successfully");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update proposal");
      }
    } catch (error) {
      console.error("Error updating proposal:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update proposal");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !editData.tags.includes(newTag.trim())) {
      setEditData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleFileUpload = async (files: any[]) => {
    if (!proposal) return;

    try {
      // Update proposal with new media
      const updatedMedia = [...(proposal.media || []), ...files];
      
      const updateResponse = await fetch(`/api/admin/proposals/${proposal.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ media: updatedMedia }),
      });

      if (updateResponse.ok) {
        const updatedProposal = await updateResponse.json();
        setProposal(updatedProposal.proposal);
        toast.success('Files uploaded successfully');
      } else {
        throw new Error('Failed to update proposal with new files');
      }
    } catch (error) {
      console.error('Error updating proposal with files:', error);
      toast.error('Failed to update proposal with files');
    }
  };

  const handleRemoveFile = async (fileId: string) => {
    if (!proposal) return;

    try {
      const updatedMedia = proposal.media?.filter((file: any) => file.id !== fileId) || [];
      
      const response = await fetch(`/api/admin/proposals/${proposal.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ media: updatedMedia }),
      });

      if (response.ok) {
        const data = await response.json();
        setProposal(data.proposal);
        toast.success('File removed successfully');
      } else {
        throw new Error('Failed to remove file');
      }
    } catch (error) {
      console.error('Error removing file:', error);
      toast.error('Failed to remove file');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Proposal not found</h2>
        <p className="text-muted-foreground mb-4">
          The proposal you're looking for doesn't exist or has been deleted.
        </p>
        <Button asChild>
          <Link href="/admin/proposal">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Proposals
          </Link>
        </Button>
      </div>
    );
  }

  const StatusIcon = statusIcons[proposal.status];

  return (
    <div className="space-y-6 p-6 lg:px-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          {isEditing ? (
            <Input
              value={editData.title}
              onChange={(e) => setEditData((prev) => ({ ...prev, title: e.target.value }))}
              className="figma-h3 border-none p-0 h-auto"
              placeholder="Proposal title"
            />
          ) : (
            <h1 className="figma-h3">{proposal.title}</h1>
          )}
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
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Proposal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editData.description}
                  onChange={(e) => setEditData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter proposal description"
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label>Service Tags</Label>
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
                {editData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {editData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
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
              <div className="space-y-2">
                <Label htmlFor="roomName">Room Name</Label>
                <Input
                  id="roomName"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Room Name"
                />
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
            </CardContent>
          </Card>

          {/* Project Assets */}
          <Card>
            <CardHeader>
              <CardTitle>Project Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <MediaGrid
                files={proposal.media || []}
                onUpload={handleFileUpload}
                onRemove={handleRemoveFile}
                canEdit={true}
                maxFiles={10}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="sticky bottom-0 mt-8 border-t py-4">
        <div className="max-w-4xl flex items-center justify-between gap-3">
          <div className="w-52">
            <Select
              value={editData.status}
              onValueChange={(value) => setEditData((prev) => ({ ...prev, status: value as ProposalStatus }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ProposalStatus.DRAFT}>Draft</SelectItem>
                <SelectItem value={ProposalStatus.SENT}>Sent</SelectItem>
                <SelectItem value="SEEN">Seen</SelectItem>
                <SelectItem value={ProposalStatus.ACCEPTED}>Accepted</SelectItem>
                <SelectItem value={ProposalStatus.DECLINED}>Declined</SelectItem>
                <SelectItem value={ProposalStatus.EXPIRED}>Expired</SelectItem>
                <SelectItem value={ProposalStatus.WITHDRAWN}>Withdrawn</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCancel} variant="outline" disabled={isSaving}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <LoadingSpinner className="mr-2 h-4 w-4" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
