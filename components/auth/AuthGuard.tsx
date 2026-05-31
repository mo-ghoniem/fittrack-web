'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => router.replace('/login'), 3000);
    supabase.auth.getSession().then(({ data }) => {
      clearTimeout(timeout);
      if (!data.session) {
        router.replace('/login');
      } else {
        setChecking(false);
      }
    }).catch(() => {
      clearTimeout(timeout);
      router.replace('/login');
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace('/login');
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-400" />
      </div>
    );
  }

  return <>{children}</>;
}
