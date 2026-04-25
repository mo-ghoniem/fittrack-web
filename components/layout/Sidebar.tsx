'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Activity,
  BarChart3,
  Settings,
  LogOut,
  ClipboardList,
  CreditCard,
  Menu,
  X,
  ClipboardCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useUserRole } from '@/hooks/useUserRole';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  coachOnly?: boolean;
  athleteOnly?: boolean;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/athletes', label: 'My Athletes', icon: UserCheck, coachOnly: true },
  { href: '/dashboard/templates', label: 'Templates', icon: ClipboardList, coachOnly: true },
  { href: '/dashboard/results', label: 'Results Board', icon: ClipboardCheck, coachOnly: true },
  { href: '/dashboard/users', label: 'All Users', icon: Users, adminOnly: true },
  { href: '/dashboard/workouts', label: 'My Workouts', icon: Activity, athleteOnly: true },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/subscriptions', label: 'Subscriptions', icon: CreditCard, coachOnly: true },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { role, loading } = useUserRole();

  const isCoach = role === 'coach';

  const isAdmin = role === 'admin';

  // Filter nav items based on role
  const visibleItems = NAV_ITEMS.filter(
    (item) =>
      (!item.adminOnly || isAdmin) &&
      (!item.coachOnly || isCoach || isAdmin) &&
      (!item.athleteOnly || (!isCoach && !isAdmin)),
  );

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-3 left-4 z-40 p-2 rounded-lg bg-surface-700 shadow-sm border border-surface-border text-ink-muted hover:bg-surface-600"
      >
        <Menu size={20} />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-50 md:hidden transition-opacity backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-60 bg-surface-900 flex flex-col transition-transform duration-300 md:relative md:translate-x-0 shrink-0 h-[100dvh] border-r border-surface-border",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-base bg-lime-gradient"
              style={{ boxShadow: '0 0 18px -4px rgba(189,255,46,0.55)' }}
            >
              🏋️
            </div>
            <div>
              <p className="text-ink font-bold text-sm leading-tight tracking-tight">FitTrack</p>
              <p className="text-ink-subtle text-xs">
                {loading ? 'Loading…' : isCoach ? 'Coach Dashboard' : 'Athlete Dashboard'}
              </p>
            </div>
          </div>
          <button
            className="md:hidden text-ink-muted hover:text-ink transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setIsOpen(false)}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-primary-400/10 text-primary-300 shadow-glow-lime-sm'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-700',
              )}
            >
              {active && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-r bg-primary-400"
                  style={{ boxShadow: '0 0 10px rgba(189,255,46,0.8)' }}
                />
              )}
              <Icon size={18} strokeWidth={1.8} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Role badge + Sign out */}
      <div className="px-3 pb-4 border-t border-surface-border pt-4 space-y-2">
        {!loading && (
          <div className="px-3 py-1.5">
            <span
              className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
                isCoach
                  ? 'bg-primary-400/15 text-primary-300 ring-1 ring-primary-400/30'
                  : 'bg-accent-400/15 text-accent-300 ring-1 ring-accent-400/30',
              )}
            >
              {isCoach ? 'Coach' : 'Athlete'}
            </span>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-ink-muted hover:text-ink hover:bg-surface-700 transition-colors"
        >
          <LogOut size={18} strokeWidth={1.8} />
          Sign out
        </button>
      </div>
    </aside>
    </>
  );
}
