'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { MediaGrid } from '@/components/admin/media-grid';
import { 
  X, 
  Plus, 
  Save, 
  Send,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { ProposalStatus } from '@/types/enums';

const proposalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  clientId: z.string().min(1, 'Client is required'),
  status: z.nativeEnum(ProposalStatus),
  tags: z.array(z.string()),
  media: z.any().optional()
});

type ProposalFormData = z.infer<typeof proposalSchema>;

interface Client {
  id: string;
  name: string;
  avatar?: string;
}

interface ProposalFormProps {
  initialData?: Partial<ProposalFormData> & { id?: string };
  onSave: (data: ProposalFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function ProposalForm({ 
  initialData, 
  onSave, 
  onCancel, 
  loading = false 
}: ProposalFormProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [tagInput, setTagInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
    reset
  } = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      clientId: initialData?.clientId || '',
      status: initialData?.status || ProposalStatus.DRAFT,
      tags: initialData?.tags || [],
      media: initialData?.media || null
    }
  });

  const watchedTags = watch('tags');
  const watchedStatus = watch('status');

  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setClientsLoading(true);
        const response = await fetch('/api/admin/clients');
        const data = await response.json();
        
        if (response.ok) {
          setClients(data.clients || []);
        } else {
          console.error('Failed to fetch clients:', data.error);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setClientsLoading(false);
      }
    };

    fetchClients();
  }, []);

  const handleAddTag = () => {
    if (tagInput.trim() && !watchedTags.includes(tagInput.trim())) {
      const newTags = [...watchedTags, tagInput.trim()];
      setValue('tags', newTags, { shouldDirty: true });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = watchedTags.filter(tag => tag !== tagToRemove);
    setValue('tags', newTags, { shouldDirty: true });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleFileUpload = (files: any[]) => {
    setUploadedFiles(files);
    setValue('media', files, { shouldDirty: true });
  };

  const onSubmit = async (data: ProposalFormData) => {
    try {
      setIsSubmitting(true);
      await onSave(data);
    } catch (error) {
      console.error('Error saving proposal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions = [
    { value: ProposalStatus.DRAFT, label: 'Draft', description: 'Work in progress' },
    { value: ProposalStatus.SENT, label: 'Sent', description: 'Sent to client' },
    { value: 'SEEN', label: 'Seen', description: 'Client has viewed' },
    { value: ProposalStatus.ACCEPTED, label: 'Accepted', description: 'Client accepted' },
    { value: ProposalStatus.DECLINED, label: 'Declined', description: 'Client declined' },
    { value: ProposalStatus.EXPIRED, label: 'Expired', description: 'Proposal expired' },
    { value: ProposalStatus.WITHDRAWN, label: 'Withdrawn', description: 'Proposal withdrawn' },
  ];

  if (clientsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {initialData?.id ? 'Edit Proposal' : 'Create New Proposal'}
            {isDirty && (
              <Badge variant="outline" className="text-xs">
                Unsaved changes
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Enter proposal title"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Brief description of the proposal"
              rows={3}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="clientId">Client *</Label>
            <Select
              value={watch('clientId')}
              onValueChange={(value) => setValue('clientId', value, { shouldDirty: true })}
            >
              <SelectTrigger className={errors.clientId ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      {client.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.clientId && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.clientId.message}
              </p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={watchedStatus}
              onValueChange={(value) => setValue('status', value as ProposalStatus, { shouldDirty: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      <span className="text-xs text-gray-500">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a tag"
                  className="flex-1"
                />
                <Button type="button" onClick={handleAddTag} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {watchedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {watchedTags.map((tag, index) => (
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
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Attachments</Label>
            <MediaGrid
              files={uploadedFiles}
              onUpload={handleFileUpload}
              onRemove={(fileId) => {
                const newFiles = uploadedFiles.filter(file => file.id !== fileId);
                setUploadedFiles(newFiles);
                setValue('media', newFiles, { shouldDirty: true });
              }}
              canEdit={true}
              maxFiles={5}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || loading}
          className="min-w-[120px]"
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {initialData?.id ? 'Update' : 'Create'} Proposal
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
