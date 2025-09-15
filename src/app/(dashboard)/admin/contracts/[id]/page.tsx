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
  DollarSign, 
  Clock, 
  User, 
  Tag,
  CheckCircle,
  AlertCircle,
  XCircle,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ContractStatus } from '@/types/enums';

interface Contract {
  id: string;
  title: string;
  description: string | null;
  status: ContractStatus;
  startDate: string | null;
  endDate: string | null;
  currency: string;
  budget: number | null;
  estimatedHours: number | null;
  actualHours: number;
  progressPercentage: number;
  priority: number;
  tags: string[];
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
  assignments: {
    id: string;
    role: string;
    user: {
      id: string;
      name: string;
      avatar: string | null;
    };
  }[];
  tasks: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    dueDate: string | null;
    assignee: {
      id: string;
      name: string;
      avatar: string | null;
    } | null;
  }[];
}

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  TERMINATED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-orange-100 text-orange-800',
};

const priorityColors = {
  1: 'bg-red-100 text-red-800',
  2: 'bg-orange-100 text-orange-800',
  3: 'bg-yellow-100 text-yellow-800',
  4: 'bg-green-100 text-green-800',
  5: 'bg-blue-100 text-blue-800',
};

const statusIcons = {
  DRAFT: AlertCircle,
  PENDING_APPROVAL: Clock,
  ACTIVE: CheckCircle,
  COMPLETED: CheckCircle,
  TERMINATED: XCircle,
  EXPIRED: AlertCircle,
};

export default function ContractViewPage() {
  const params = useParams();
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newTag, setNewTag] = useState('');
  
  // Form state for editing
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    status: ContractStatus.DRAFT,
    startDate: '',
    endDate: '',
    currency: 'USD',
    budget: '',
    estimatedHours: '',
    priority: 3,
    progressPercentage: 0,
    tags: [] as string[]
  });

  useEffect(() => {
    if (params.id) {
      fetchContract(params.id as string);
    }
  }, [params.id]);

  const fetchContract = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/contracts/${id}`);
      if (response.ok) {
        const data = await response.json();
        setContract(data.contract);
        
        // Populate edit data
        setEditData({
          title: data.contract.title,
          description: data.contract.description || '',
          status: data.contract.status,
          startDate: data.contract.startDate ? new Date(data.contract.startDate).toISOString().split('T')[0] : '',
          endDate: data.contract.endDate ? new Date(data.contract.endDate).toISOString().split('T')[0] : '',
          currency: data.contract.currency,
          budget: data.contract.budget?.toString() || '',
          estimatedHours: data.contract.estimatedHours?.toString() || '',
          priority: data.contract.priority,
          progressPercentage: data.contract.progressPercentage,
          tags: data.contract.tags || []
        });
      } else {
        throw new Error('Failed to fetch contract');
      }
    } catch (error) {
      console.error('Error fetching contract:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (contract) {
      setEditData({
        title: contract.title,
        description: contract.description || '',
        status: contract.status,
        startDate: contract.startDate ? new Date(contract.startDate).toISOString().split('T')[0] : '',
        endDate: contract.endDate ? new Date(contract.endDate).toISOString().split('T')[0] : '',
        currency: contract.currency,
        budget: contract.budget?.toString() || '',
        estimatedHours: contract.estimatedHours?.toString() || '',
        priority: contract.priority,
        progressPercentage: contract.progressPercentage,
        tags: contract.tags || []
      });
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!contract) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/contracts/${contract.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editData.title,
          description: editData.description,
          status: editData.status,
          startDate: editData.startDate || null,
          endDate: editData.endDate || null,
          currency: editData.currency,
          budget: editData.budget ? parseFloat(editData.budget) : null,
          estimatedHours: editData.estimatedHours ? parseInt(editData.estimatedHours) : null,
          priority: editData.priority,
          progressPercentage: editData.progressPercentage,
          tags: editData.tags
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setContract(data.contract);
        setIsEditing(false);
        toast.success('Contract updated successfully');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update contract');
      }
    } catch (error) {
      console.error('Error updating contract:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update contract');
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Contract not found</h2>
        <p className="text-muted-foreground mb-4">
          The contract you're looking for doesn't exist or has been deleted.
        </p>
        <Button asChild>
          <Link href="/admin/contracts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Contracts
          </Link>
        </Button>
      </div>
    );
  }

  const StatusIcon = statusIcons[contract.status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/contracts">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contracts
            </Link>
          </Button>
          <div>
            {isEditing ? (
              <Input
                value={editData.title}
                onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                className="text-3xl font-bold border-none p-0 h-auto"
                placeholder="Contract title"
              />
            ) : (
              <h1 className="text-3xl font-bold">{contract.title}</h1>
            )}
            <p className="text-muted-foreground">
              Contract with {contract.client.name}
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
              Edit Contract
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contract Details */}
          <Card>
            <CardHeader>
              <CardTitle>Contract Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                {isEditing ? (
                  <Textarea
                    value={editData.description}
                    onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter contract description"
                    rows={4}
                  />
                ) : (
                  <p className="text-muted-foreground">
                    {contract.description || 'No description provided'}
                  </p>
                )}
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={editData.progressPercentage}
                        onChange={(e) => setEditData(prev => ({ ...prev, progressPercentage: parseInt(e.target.value) || 0 }))}
                        className="w-20 h-8"
                      />
                      <span>%</span>
                    </div>
                  ) : (
                    <span>{contract.progressPercentage}%</span>
                  )}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${isEditing ? editData.progressPercentage : contract.progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Budget and Hours */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Budget:</span>
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <Select 
                        value={editData.currency} 
                        onValueChange={(value) => setEditData(prev => ({ ...prev, currency: value }))}
                      >
                        <SelectTrigger className="w-20 h-8">
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
                      <Input
                        type="number"
                        value={editData.budget}
                        onChange={(e) => setEditData(prev => ({ ...prev, budget: e.target.value }))}
                        placeholder="0.00"
                        className="w-24 h-8"
                      />
                    </div>
                  ) : (
                    <span className="font-medium">
                      {contract.budget ? `${contract.currency} ${contract.budget.toLocaleString()}` : 'Not set'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Hours:</span>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editData.estimatedHours}
                      onChange={(e) => setEditData(prev => ({ ...prev, estimatedHours: e.target.value }))}
                      placeholder="0"
                      className="w-24 h-8"
                    />
                  ) : (
                    <span className="font-medium">
                      {contract.actualHours}/{contract.estimatedHours || 'N/A'}
                    </span>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={editData.startDate}
                      onChange={(e) => setEditData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="h-8"
                    />
                    <span>-</span>
                    <Input
                      type="date"
                      value={editData.endDate}
                      onChange={(e) => setEditData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="h-8"
                    />
                  </div>
                ) : (
                  <span>
                    {contract.startDate 
                      ? new Date(contract.startDate).toLocaleDateString()
                      : 'No start date'
                    }
                    {contract.endDate && ` - ${new Date(contract.endDate).toLocaleDateString()}`}
                  </span>
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
                    {contract.tags.length > 0 ? (
                      contract.tags.map((tag, index) => (
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

          {/* Tasks */}
          {contract.tasks && contract.tasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tasks ({contract.tasks.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {contract.tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{task.status}</Badge>
                        {task.assignee && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <User className="h-3 w-3" />
                            {task.assignee.name}
                          </div>
                        )}
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
          {/* Status and Priority */}
          <Card>
            <CardHeader>
              <CardTitle>Status & Priority</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                {isEditing ? (
                  <Select 
                    value={editData.status} 
                    onValueChange={(value) => setEditData(prev => ({ ...prev, status: value as ContractStatus }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ContractStatus.DRAFT}>Draft</SelectItem>
                      <SelectItem value={ContractStatus.PENDING_APPROVAL}>Pending Approval</SelectItem>
                      <SelectItem value={ContractStatus.ACTIVE}>Active</SelectItem>
                      <SelectItem value={ContractStatus.COMPLETED}>Completed</SelectItem>
                      <SelectItem value={ContractStatus.TERMINATED}>Terminated</SelectItem>
                      <SelectItem value={ContractStatus.EXPIRED}>Expired</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2">
                    <StatusIcon className="h-4 w-4" />
                    <Badge className={statusColors[contract.status]}>
                      {contract.status.replace('_', ' ')}
                    </Badge>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                {isEditing ? (
                  <Select 
                    value={editData.priority.toString()} 
                    onValueChange={(value) => setEditData(prev => ({ ...prev, priority: parseInt(value) }))}
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
                ) : (
                  <div>
                    <Badge variant="outline" className={priorityColors[contract.priority as keyof typeof priorityColors]}>
                      Priority {contract.priority}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle>Client</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {contract.client.avatar ? (
                  <img 
                    src={contract.client.avatar} 
                    alt={contract.client.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                )}
                <div>
                  <h3 className="font-medium">{contract.client.name}</h3>
                  {contract.client.description && (
                    <p className="text-sm text-muted-foreground">{contract.client.description}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Members */}
          {contract.assignments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {contract.assignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center gap-3">
                      {assignment.user.avatar ? (
                        <img 
                          src={assignment.user.avatar} 
                          alt={assignment.user.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">{assignment.user.name}</p>
                        <p className="text-xs text-muted-foreground">{assignment.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contract Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contract Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Created:</span>{' '}
                <span>{new Date(contract.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Last Updated:</span>{' '}
                <span>{new Date(contract.updatedAt).toLocaleDateString()}</span>
              </div>
              {contract.creator && (
                <div>
                  <span className="text-muted-foreground">Created by:</span>{' '}
                  <span>{contract.creator.name}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
