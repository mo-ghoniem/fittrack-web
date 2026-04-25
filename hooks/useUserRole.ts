'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type UserRole = 'athlete' | 'coach' | 'admin' | null;

interface UseUserRoleReturn {
  role: UserRole;
  loading: boolean;
  userId: string | null;
}

export function useUserRole(): UseUserRoleReturn {
  const [role, setRole] = useState<UserRole>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) {
          setLoading(false);
          return;
        }

        setUserId(user.id);

        // First try user_metadata (set during registration)
        const metaRole = user.user_metadata?.role as UserRole;
        if (metaRole === 'coach' || metaRole === 'athlete') {
          if (!cancelled) {
            setRole(metaRole);
            setLoading(false);
          }
          return;
        }

        // Fallback: read from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (!cancelled) {
          setRole((profile?.role as UserRole) ?? 'athlete');
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setRole('athlete'); // default to athlete on error
          setLoading(false);
        }
      }
    }

    fetchRole();

    return () => {
      cancelled = true;
    };
  }, []);

  return { role, loading, userId };
}
