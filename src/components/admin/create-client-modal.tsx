"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Plus, User, Mail, Camera, Pencil, Trash2, AlertCircle } from "lucide-react";

interface CreateClientModalProps {
  onClientCreated: () => void;
}

interface FormData {
  name: string;
  email: string;
  description: string;
  website: string;
  avatar: string | null;
}

interface FormErrors {
  name?: string;
  email?: string;
  general?: string;
}

export function CreateClientModal({ onClientCreated }: CreateClientModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    description: "",
    website: "",
    avatar: null,
  });

  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, general: 'Please select an image file' }));
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, general: 'Image size must be less than 5MB' }));
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const result = await response.json();
      setFormData(prev => ({ ...prev, avatar: result.url }));
      setErrors(prev => ({ ...prev, general: undefined })); // Clear any previous errors
    } catch (error) {
      console.error('Upload error:', error);
      setErrors(prev => ({ 
        ...prev, 
        general: error instanceof Error ? error.message : 'Failed to upload image. Please try again.' 
      }));
    } finally {
      setUploading(false);
    }
  }, []);

  const handleRemoveImage = useCallback(() => {
    setFormData(prev => ({ ...prev, avatar: null }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Client name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // If there are validation errors, set them and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          description: formData.description.trim() || null,
          website: formData.website.trim() || null,
          avatar: formData.avatar,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        
        // Parse specific error messages for better user experience
        let errorMessage = error.message || 'Failed to create client';
        
        // Handle different HTTP status codes
        if (response.status === 409) {
          // Conflict - user already exists
          errorMessage = 'A user with this email address already exists. Please use a different email.';
          // Set email field error for better UX
          setErrors(prev => ({ 
            ...prev, 
            email: 'This email address is already in use',
            general: undefined 
          }));
          throw new Error(errorMessage);
        } else if (response.status === 400) {
          // Bad Request - validation error
          errorMessage = error.message || 'Please check your input and try again.';
        } else if (response.status === 429) {
          // Too Many Requests
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (response.status === 503) {
          // Service Unavailable
          errorMessage = 'Service temporarily unavailable. Please try again later.';
        } else if (error.details) {
          // Check for specific Supabase auth errors in details
          const details = error.details.toLowerCase();
          if (details.includes('already registered') || 
              details.includes('already exists') ||
              details.includes('user already registered')) {
            errorMessage = 'A user with this email address already exists. Please use a different email.';
          } else if (details.includes('invalid email')) {
            errorMessage = 'The email address format is invalid. Please check and try again.';
          } else if (details.includes('password should be at least')) {
            errorMessage = 'Password requirements not met. Please try again.';
          } else if (details.includes('rate limit')) {
            errorMessage = 'Too many requests. Please wait a moment and try again.';
          } else if (details.includes('network') || details.includes('connection')) {
            errorMessage = 'Network error. Please check your connection and try again.';
          } else {
            // Show the actual error details for debugging
            errorMessage = `Authentication error: ${error.details}`;
          }
        }
        
        throw new Error(errorMessage);
      }

      // Reset form and close modal
      setFormData({
        name: "",
        email: "",
        description: "",
        website: "",
        avatar: null,
      });
      setErrors({});
      setOpen(false);
      onClientCreated();
    } catch (error) {
      console.error('Create client error:', error);
      setErrors(prev => ({ 
        ...prev, 
        general: error instanceof Error ? error.message : 'Failed to create client' 
      }));
    } finally {
      setLoading(false);
    }
  }, [formData, onClientCreated]);

  const handleReset = useCallback(() => {
    setFormData({
      name: "",
      email: "",
      description: "",
      website: "",
      avatar: null,
    });
    setErrors({});
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="bg-gradient-to-r from-[#6B42D1] to-[#FF2AFF] hover:from-[#5A3BC7] hover:to-[#E625E6] text-white">
          <Plus className="w-4 h-4 mr-2" />
          Create new client
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] bg-card border-border flex flex-col p-0">
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <SheetTitle className="text-xl font-semibold text-foreground">
            Create New Client
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto p-6">
          <form id="create-client-form" onSubmit={handleSubmit} className="space-y-6">
          {/* General Error Message */}
          {errors.general && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <span className="text-sm text-destructive">{errors.general}</span>
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-foreground">
              Full name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="Enter client name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`pl-10 ${errors.name ? 'border-destructive focus:border-destructive' : ''}`}
                required
              />
            </div>
            {errors.name && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Email Address */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              Email address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`pl-10 ${errors.email ? 'border-destructive focus:border-destructive ring-1 ring-destructive/20' : ''}`}
                required
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.email}
              </p>
            )}
          </div>


          {/* Photo Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Photo
            </Label>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={formData.avatar || ""} alt="Client logo" />
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    <Camera className="w-6 h-6" />
                  </AvatarFallback>
                </Avatar>
                {uploading && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-full">
                    <LoadingSpinner size="sm" />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="logo-upload"
                  disabled={uploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  disabled={uploading}
                  className="border-primary/40 hover:bg-primary/10"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Change photo
                </Button>
                {formData.avatar && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="border-destructive/40 hover:bg-destructive/10 text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website" className="text-sm font-medium text-foreground">
              Website
            </Label>
            <Input
              id="website"
              type="url"
              placeholder="https://example.com"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
            />
          </div>

          {/* Short Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-foreground">
              Short description
            </Label>
            <div className="relative">
              <Pencil className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="description"
                placeholder="Write a short bio about the client..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="pl-10 min-h-[100px] resize-none"
              />
            </div>
          </div>

          </form>
        </div>
        
        {/* Action Buttons Footer */}
        <div className="p-6 pt-4 border-t border-border bg-card">
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={handleReset}
              className="text-muted-foreground hover:text-foreground"
            >
              Reset changes
            </Button>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="create-client-form"
                disabled={loading}
                className="bg-gradient-to-r from-[#6B42D1] to-[#FF2AFF] hover:from-[#5A3BC7] hover:to-[#E625E6] text-white"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Client'
                )}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
