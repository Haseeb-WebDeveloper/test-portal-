"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient as createBrowserSupabaseClient } from "@/utils/supabase/clients";
import { UserRole } from "@/types/enums";
import { useUser } from "@/store/user";
import type { User as StoreUser } from "@/types/messages";

// Use the shared StoreUser type for consistency across app state

export function useAuth() {
  const storeUser = useUser((s) => s.user);
  const setStoreUser = useUser((s) => s.setUser);
  const [user, setUser] = useState<StoreUser | null>(storeUser ?? null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const lastFetchedAtRef = useRef<number | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Use cached store value if recent (60s window)
        const now = Date.now();
        if (storeUser && lastFetchedAtRef.current && now - lastFetchedAtRef.current < 60000) {
          setUser(storeUser);
          setLoading(false);
          return;
        }

        const supabase = createBrowserSupabaseClient();
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
          setUser(null);
          setStoreUser(undefined);
          setLoading(false);
          return;
        }

        // Fetch user data from API once and cache in store
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = (await response.json()) as StoreUser;
          setUser(userData);
          setStoreUser(userData);
          lastFetchedAtRef.current = now;
        } else {
          setUser(null);
          setStoreUser(undefined);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
        setStoreUser(undefined);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [storeUser, setStoreUser]);

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
      setStoreUser(undefined);
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
