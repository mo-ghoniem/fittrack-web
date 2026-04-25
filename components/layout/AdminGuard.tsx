'use client';

import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { role, loading } = useUserRole();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full" />
      </div>
    );
  }

  if (role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <ShieldAlert size={32} className="text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Admin Access Only</h2>
        <p className="text-slate-500 text-sm text-center max-w-md">
          This page is only available to system administrators.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-2 px-6 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
