'use client';

import { useState } from 'react';
import { NewsForm } from './news-form';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface NewsFormData {
  title: string;
  description: string;
  content: string;
  featuredImage: string | null;
  sendTo: string[];
  sendToAll: boolean;
}

interface NewsFormWrapperProps {
  initialData?: NewsFormData & { id?: string };
  isEdit?: boolean;
}

export function NewsFormWrapper({ initialData, isEdit = false }: NewsFormWrapperProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (formData: NewsFormData) => {
    setIsLoading(true);
    
    try {
      const url = isEdit 
        ? `/api/admin/news/${initialData?.id}` 
        : '/api/admin/news';
      
      const method = isEdit ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save news');
      }

      const news = await response.json();
      toast.success(isEdit ? 'News updated successfully' : 'News created successfully');
      
      // Redirect to the news detail page
      router.push(`/admin/news/${news.id}`);
    } catch (error) {
      console.error('Error saving news:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save news');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <NewsForm
      initialData={initialData}
      onSubmit={handleSubmit}
      isLoading={isLoading}
    />
  );
}
