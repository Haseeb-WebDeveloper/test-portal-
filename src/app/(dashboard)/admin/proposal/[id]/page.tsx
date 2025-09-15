'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  ArrowLeft, 
  Edit, 
  Save,
  X,
  Calendar, 
  User, 
  Tag,
  CheckCircle,
  AlertCircle,
  XCircle,
  Plus,
  Send,
  Eye,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ProposalStatus } from '@/types/enums';
import { MediaGrid } from '@/components/admin/media-grid';

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
  const [newTag, setNewTag] = useState('');
  
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
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        const data = await response.json();
        setProposal(data.proposal);
        setIsEditing(false);
        toast.success('Proposal updated successfully');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update proposal');
      }
    } catch (error) {
      console.error('Error updating proposal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update proposal');
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
    if (e.key === 'Enter') {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/proposal">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Proposals
            </Link>
          </Button>
          <div>
            {isEditing ? (
              <Input
                value={editData.title}
                onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                className="text-3xl font-bold border-none p-0 h-auto"
                placeholder="Proposal title"
              />
            ) : (
              <h1 className="text-3xl font-bold">{proposal.title}</h1>
            )}
            <p className="text-muted-foreground">
              Proposal for {proposal.client.name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
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
            </>
          ) : (
            <Button onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Proposal
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Proposal Details */}
          <Card>
            <CardHeader>
              <CardTitle>Proposal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                {isEditing ? (
                  <Textarea
                    value={editData.description}
                    onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter proposal description"
                    rows={6}
                  />
                ) : (
                  <p className="text-muted-foreground">
                    {proposal.description || 'No description provided'}
                  </p>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <h3 className="font-medium">Tags</h3>
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Add a tag"
                        className="flex-1"
                      />
                      <Button type="button" onClick={handleAddTag} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {editData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {editData.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            <Tag className="mr-1 h-3 w-3" />
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
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {proposal.tags.length > 0 ? (
                      proposal.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          <Tag className="mr-1 h-3 w-3" />
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">No tags</span>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Media Files */}
          <Card>
            <CardHeader>
              <CardTitle>Media Files</CardTitle>
            </CardHeader>
            <CardContent>
              <MediaGrid
                files={proposal.media || []}
                onUpload={handleFileUpload}
                onRemove={handleRemoveFile}
                canEdit={isEditing}
                maxFiles={10}
              />
            </CardContent>
          </Card>

          {/* Related Contracts */}
          {proposal.contracts && proposal.contracts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Related Contracts ({proposal.contracts.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {proposal.contracts.map((contract) => (
                    <div key={contract.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{contract.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Created {new Date(contract.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{contract.status}</Badge>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/contracts/${contract.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                {isEditing ? (
                  <Select 
                    value={editData.status} 
                    onValueChange={(value) => setEditData(prev => ({ ...prev, status: value as ProposalStatus }))}
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
                ) : (
                  <div className="flex items-center gap-2">
                    <StatusIcon className="h-4 w-4" />
                    <Badge className={statusColors[proposal.status]}>
                      {proposal.status.replace('_', ' ')}
                    </Badge>
                  </div>
                )}
              </div>
              
              {isEditing && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="hasReviewed"
                    checked={editData.hasReviewed}
                    onChange={(e) => setEditData(prev => ({ ...prev, hasReviewed: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="hasReviewed" className="text-sm">
                    Mark as reviewed
                  </Label>
                </div>
              )}
              
              {!isEditing && proposal.hasReviewed && (
                <Badge variant="outline" className="text-green-600">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Reviewed
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle>Client</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {proposal.client.avatar ? (
                  <img 
                    src={proposal.client.avatar} 
                    alt={proposal.client.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                )}
                <div>
                  <h3 className="font-medium">{proposal.client.name}</h3>
                  {proposal.client.description && (
                    <p className="text-sm text-muted-foreground">{proposal.client.description}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Proposal Info */}
          <Card>
            <CardHeader>
              <CardTitle>Proposal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Created:</span>{' '}
                <span>{new Date(proposal.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Last Updated:</span>{' '}
                <span>{new Date(proposal.updatedAt).toLocaleDateString()}</span>
              </div>
              {proposal.creator && (
                <div>
                  <span className="text-muted-foreground">Created by:</span>{' '}
                  <span>{proposal.creator.name}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
