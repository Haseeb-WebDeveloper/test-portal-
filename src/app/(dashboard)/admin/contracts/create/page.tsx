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
import { ArrowLeft, Save, Send, Plus, X, Calendar, DollarSign, Clock } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { ContractStatus } from '@/types/enums';

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
  media: any;
}

export default function CreateContractPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [newTag, setNewTag] = useState('');
  
  const [formData, setFormData] = useState<ContractFormData>({
    clientId: '',
    title: '',
    description: '',
    status: ContractStatus.DRAFT,
    startDate: '',
    endDate: '',
    currency: 'USD',
    budget: '',
    estimatedHours: '',
    priority: 3,
    tags: [],
    media: null
  });

  const [errors, setErrors] = useState<Partial<ContractFormData>>({});

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
    const newErrors: Partial<ContractFormData> = {};

    if (!formData.clientId) {
      newErrors.clientId = 'Client is required';
    }
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (formData.budget && isNaN(parseFloat(formData.budget))) {
      newErrors.budget = 'Budget must be a valid number';
    }
    if (formData.estimatedHours && isNaN(parseInt(formData.estimatedHours))) {
      newErrors.estimatedHours = 'Estimated hours must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (status: ContractStatus) => {
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          status,
          budget: formData.budget ? parseFloat(formData.budget) : null,
          estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : null,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Contract ${status === ContractStatus.DRAFT ? 'saved as draft' : 'created'} successfully`);
        router.push('/admin/contracts');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create contract');
      }
    } catch (error) {
      console.error('Error creating contract:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create contract');
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
          <Link href="/admin/contracts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contracts
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Contract</h1>
          <p className="text-muted-foreground">
            Create a new contract for your client
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contract Details</CardTitle>
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
                  placeholder="Enter contract title"
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
                  placeholder="Enter contract description"
                  rows={6}
                  className={errors.description ? 'border-red-500' : ''}
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
                      onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                      placeholder="0.00"
                      className={`pl-10 ${errors.budget ? 'border-red-500' : ''}`}
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
                      onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: e.target.value }))}
                      placeholder="0"
                      className={`pl-10 ${errors.estimatedHours ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.estimatedHours && (
                    <p className="text-sm text-red-600">{errors.estimatedHours}</p>
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
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
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
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
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
                    onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
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
                    onValueChange={(value) => setFormData(prev => ({ ...prev, priority: parseInt(value) }))}
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
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as ContractStatus }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ContractStatus.DRAFT}>Draft</SelectItem>
                  <SelectItem value={ContractStatus.PENDING_APPROVAL}>Pending Approval</SelectItem>
                  <SelectItem value={ContractStatus.ACTIVE}>Active</SelectItem>
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
                onClick={() => handleSubmit(ContractStatus.DRAFT)}
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
                onClick={() => handleSubmit(ContractStatus.PENDING_APPROVAL)}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Create Contract
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
                <div>
                  <span className="font-medium">Budget:</span>{' '}
                  {formData.budget ? `${formData.currency} ${parseFloat(formData.budget).toLocaleString()}` : 'Not set'}
                </div>
                <div>
                  <span className="font-medium">Hours:</span>{' '}
                  {formData.estimatedHours || 'Not set'}
                </div>
                <div>
                  <span className="font-medium">Priority:</span>{' '}
                  {formData.priority}
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
