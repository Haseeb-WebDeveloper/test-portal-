'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient as createBrowserSupabaseClient } from '@/utils/supabase/clients';
import { UserRole } from '@/types/enums';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  isActive: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createBrowserSupabaseClient();
        
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !authUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        // Fetch user data from your API
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const requireAdmin = () => {
    if (!user || (user.role !== 'PLATFORM_ADMIN' && user.role !== 'AGENCY_MEMBER')) {
      router.push('/unauthorized');
      return false;
    }
    return true;
  };

  const requireClient = () => {
    if (!user || (user.role !== 'CLIENT' && user.role !== 'CLIENT_MEMBER')) {
      router.push('/unauthorized');
      return false;
    }
    return true;
  };

  const logout = async () => {
    try {
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.signOut();
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    user,
    loading,
    requireAdmin,
    requireClient,
    logout,
  };
}
