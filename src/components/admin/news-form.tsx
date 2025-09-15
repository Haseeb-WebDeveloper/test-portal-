'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Combobox } from '@/components/ui/new-combobox';
import FileUpload from '@/components/ui/file-upload';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  agencyMembership?: {
    function: string;
  } | null;
}

interface NewsFormData {
  title: string;
  description: string;
  content: string;
  featuredImage: string | null;
  sendTo: string[];
  sendToAll: boolean;
}

interface NewsFormProps {
  initialData?: NewsFormData & { id?: string };
  onSubmit: (data: NewsFormData) => Promise<void>;
  isLoading?: boolean;
}

export function NewsForm({ initialData, onSubmit, isLoading = false }: NewsFormProps) {
  const [formData, setFormData] = useState<NewsFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    content: initialData?.content || '',
    featuredImage: initialData?.featuredImage || null,
    sendTo: initialData?.sendTo || [],
    sendToAll: initialData?.sendToAll || false
  });

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Update selected users when sendTo changes
  useEffect(() => {
    if (formData.sendTo.length > 0 && users.length > 0) {
      const selected = users.filter(user => formData.sendTo.includes(user.id));
      setSelectedUsers(selected);
    }
  }, [formData.sendTo, users]);

  const fetchUsers = async (search = '') => {
    setIsLoadingUsers(true);
    try {
      const response = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        toast.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleInputChange = (field: keyof NewsFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUserSelect = (user: User) => {
    const isSelected = selectedUsers.some(u => u.id === user.id);
    
    if (isSelected) {
      // Remove user
      const newSelected = selectedUsers.filter(u => u.id !== user.id);
      setSelectedUsers(newSelected);
      handleInputChange('sendTo', newSelected.map(u => u.id));
    } else {
      // Add user
      const newSelected = [...selectedUsers, user];
      setSelectedUsers(newSelected);
      handleInputChange('sendTo', newSelected.map(u => u.id));
    }
  };

  const handleRemoveUser = (userId: string) => {
    const newSelected = selectedUsers.filter(u => u.id !== userId);
    setSelectedUsers(newSelected);
    handleInputChange('sendTo', newSelected.map(u => u.id));
  };

  const handleSendToAllChange = (checked: boolean) => {
    handleInputChange('sendToAll', checked);
    if (checked) {
      // Clear individual selections when sending to all
      setSelectedUsers([]);
      handleInputChange('sendTo', []);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    if (!formData.sendToAll && formData.sendTo.length === 0) {
      toast.error('Please select users to send the news to or select "Send to All"');
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to save news');
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {initialData?.id ? 'Edit News' : 'Create News'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter news title"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter news description"
              rows={3}
            />
          </div>

          {/* Featured Image */}
          <div className="space-y-2">
            <Label>Featured Image</Label>
            <FileUpload
              value={formData.featuredImage || undefined}
              onChange={(url) => handleInputChange('featuredImage', url)}
              accept="image/*"
              maxSize={5} // 5MB
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Enter news content"
              rows={10}
              required
            />
          </div>

          {/* Send To All */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sendToAll"
              checked={formData.sendToAll}
              onCheckedChange={handleSendToAllChange}
            />
            <Label htmlFor="sendToAll">Send to all users</Label>
          </div>

          {/* User Selection */}
          {!formData.sendToAll && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Users to Send To</Label>
                <Combobox
                  placeholder="Search users..."
                  onSearch={fetchUsers}
                  onSelect={(user) => handleUserSelect(user)}
                  items={users}
                  isLoading={isLoadingUsers}
                  renderItem={(user) => (
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar || ''} />
                        <AvatarFallback>
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {user.role}
                      </Badge>
                    </div>
                  )}
                />
              </div>

              {/* Selected Users */}
              {selectedUsers.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Users ({selectedUsers.length})</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map((user) => (
                      <Badge
                        key={user.id}
                        variant="secondary"
                        className="flex items-center gap-2 px-3 py-1"
                      >
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={user.avatar || ''} />
                          <AvatarFallback className="text-xs">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {user.name}
                        <button
                          type="button"
                          onClick={() => handleRemoveUser(user.id)}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <LoadingSpinner className="mr-2 h-4 w-4" />}
              {initialData?.id ? 'Update News' : 'Create News'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
