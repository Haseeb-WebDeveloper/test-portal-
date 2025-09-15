'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ArrowLeft, Save, Send, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { ProposalStatus } from '@/types/enums';
import { MediaGrid } from '@/components/admin/media-grid';

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
  const [newTag, setNewTag] = useState('');
  
  const [formData, setFormData] = useState<ProposalFormData>({
    clientId: '',
    title: '',
    description: '',
    status: ProposalStatus.DRAFT,
    tags: [],
    media: []
  });

  const [errors, setErrors] = useState<Partial<ProposalFormData>>({});

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/admin/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      } else {
        throw new Error('Failed to fetch clients');
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to fetch clients');
    } finally {
      setIsLoadingClients(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ProposalFormData> = {};

    if (!formData.clientId) {
      newErrors.clientId = 'Client is required';
    }
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (status: ProposalStatus) => {
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          status
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Proposal ${status === ProposalStatus.DRAFT ? 'saved as draft' : 'sent'} successfully`);
        router.push('/admin/proposal');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create proposal');
      }
    } catch (error) {
      console.error('Error creating proposal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create proposal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
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
    try {
      setFormData(prev => ({
        ...prev,
        media: [...prev.media, ...files]
      }));
      toast.success('Files uploaded successfully');
    } catch (error) {
      console.error('Error adding files:', error);
      toast.error('Failed to add files');
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setFormData(prev => ({
      ...prev,
      media: prev.media.filter((file: any) => file.id !== fileId)
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/proposal">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Proposals
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Proposal</h1>
          <p className="text-muted-foreground">
            Create a new proposal for your client
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Proposal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Client Selection */}
              <div className="space-y-2">
                <Label htmlFor="clientId">Client *</Label>
                <Select 
                  value={formData.clientId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter proposal title"
                  className={errors.title ? 'border-red-500' : ''}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter proposal description"
                  rows={6}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
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
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag, index) => (
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

          {/* Media Files */}
          <Card>
            <CardHeader>
              <CardTitle>Media Files</CardTitle>
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

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as ProposalStatus }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ProposalStatus.DRAFT}>Draft</SelectItem>
                  <SelectItem value={ProposalStatus.SENT}>Sent</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => handleSubmit(ProposalStatus.DRAFT)}
                disabled={isLoading}
                className="w-full"
                variant="outline"
              >
                {isLoading ? (
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save as Draft
              </Button>
              
              <Button 
                onClick={() => handleSubmit(ProposalStatus.SENT)}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send Proposal
              </Button>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Client:</span>{' '}
                  {clients.find(c => c.id === formData.clientId)?.name || 'Not selected'}
                </div>
                <div>
                  <span className="font-medium">Title:</span>{' '}
                  {formData.title || 'No title'}
                </div>
                <div>
                  <span className="font-medium">Status:</span>{' '}
                  <Badge variant="outline">
                    {formData.status.replace('_', ' ')}
                  </Badge>
                </div>
                {formData.tags.length > 0 && (
                  <div>
                    <span className="font-medium">Tags:</span>{' '}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {formData.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
