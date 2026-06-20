'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, LogOut, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useUserRole } from '@/hooks/useUserRole';
import { NotificationBell } from './NotificationBell';
import { Avatar } from '@/components/ui/Avatar';

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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = userName || userEmail;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header
      className="h-16 flex items-center justify-between pl-16 pr-4 sm:px-6 shrink-0 sticky top-0 z-30"
      style={{
        background: 'rgba(10,11,14,0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Title */}
      <div className="animate-fade-in">
        <h1 className="text-lg font-bold text-ink tracking-tight leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-ink-subtle mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />

        {/* Avatar + dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-surface-700 transition-all duration-150"
          >
            <Avatar name={displayName} size={32} />
            {!loading && (
              <span className="hidden sm:block text-sm font-medium text-ink max-w-[120px] truncate">
                {displayName}
              </span>
            )}
            <ChevronDown
              size={13}
              className={`text-ink-subtle hidden sm:block transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-64 rounded-2xl z-50 py-1 overflow-hidden animate-fade-in"
              style={{
                background: '#101114',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 20px 60px -10px rgba(0,0,0,0.9), 0 0 0 1px rgba(189,255,46,0.06)',
              }}
            >
              {/* User info */}
              <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <Avatar name={displayName} size={38} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">
                      {userName || 'User'}
                    </p>
                    <p className="text-xs text-ink-muted truncate">{userEmail}</p>
                  </div>
                </div>
                {!loading && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      role === 'coach'
                        ? 'bg-primary-400/15 text-primary-300 ring-1 ring-primary-400/30'
                        : 'bg-accent-400/15 text-accent-300 ring-1 ring-accent-400/30'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                    {role === 'coach' ? 'Coach' : 'Athlete'}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="py-1 px-1">
                <Link
                  href="/dashboard/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-ink-muted hover:text-ink hover:bg-surface-700 transition-all duration-150"
                >
                  <Settings size={15} strokeWidth={1.8} />
                  Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all duration-150"
                >
                  <LogOut size={15} strokeWidth={1.8} />
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
