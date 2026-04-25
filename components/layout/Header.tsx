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
    <header className="h-16 bg-surface-900/70 backdrop-blur-md border-b border-surface-border flex items-center justify-between pl-16 pr-4 sm:px-6 shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-ink tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-ink-muted">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications — live bell with Supabase Realtime */}
        <NotificationBell />

        {/* Avatar + dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-surface-700 transition-colors"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-surface-900 text-xs font-bold shrink-0 bg-lime-gradient"
              style={{ boxShadow: '0 0 14px -3px rgba(189,255,46,0.55)' }}
            >
              {initials}
            </div>
            {!loading && (
              <span className="hidden sm:block text-sm font-medium text-ink max-w-[120px] truncate">
                {userName || userEmail}
              </span>
            )}
            <ChevronDown size={14} className="text-ink-subtle hidden sm:block" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-60 bg-surface-800 rounded-xl border border-surface-border shadow-card-dark z-50 py-1 overflow-hidden">
              {/* User info */}
              <div className="px-4 py-3 border-b border-surface-border">
                <p className="text-sm font-semibold text-ink truncate">
                  {userName || 'User'}
                </p>
                <p className="text-xs text-ink-muted truncate">{userEmail}</p>
                {!loading && (
                  <span
                    className={`mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      role === 'coach'
                        ? 'bg-primary-400/15 text-primary-300 ring-1 ring-primary-400/30'
                        : 'bg-accent-400/15 text-accent-300 ring-1 ring-accent-400/30'
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
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
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
