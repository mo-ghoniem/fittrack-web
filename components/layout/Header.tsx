'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUserRole } from '@/hooks/useUserRole';
import { NotificationBell } from './NotificationBell';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { role, loading } = useUserRole();
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserName(
          user.user_metadata?.firstName
            ? `${user.user_metadata.firstName} ${user.user_metadata.lastName ?? ''}`.trim()
            : user.user_metadata?.name ?? '',
        );
        setUserEmail(user.email ?? '');
      }
    });
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = userName
    ? userName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : userEmail[0]?.toUpperCase() ?? 'U';

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications — live bell with Supabase Realtime */}
        <NotificationBell />

        {/* Avatar + dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            {!loading && (
              <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[120px] truncate">
                {userName || userEmail}
              </span>
            )}
            <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-xl border border-slate-200 shadow-lg z-50 py-1 overflow-hidden">
              {/* User info */}
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {userName || 'User'}
                </p>
                <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                {!loading && (
                  <span
                    className={`mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      role === 'coach'
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {role === 'coach' ? 'Coach' : 'Athlete'}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="py-1">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
