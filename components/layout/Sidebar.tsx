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
<<<<<<< HEAD
=======
  Zap,
>>>>>>> d952a10dfe09291a556c79a7edfcded67d527a73
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

<<<<<<< HEAD
  const isAdmin = role === 'admin';

  // Filter nav items based on role
=======
>>>>>>> d952a10dfe09291a556c79a7edfcded67d527a73
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
<<<<<<< HEAD
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
=======
        className="md:hidden fixed top-3 left-4 z-40 p-2 rounded-xl bg-surface-800 shadow-sm border border-surface-border text-ink-muted hover:text-ink hover:bg-surface-700 transition-colors"
      >
        <Menu size={20} />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-50 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-60 flex flex-col transition-transform duration-300 md:relative md:translate-x-0 shrink-0 h-[100dvh]',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      )}
        style={{
          background: 'linear-gradient(180deg, #0a0b0e 0%, #0d0e12 100%)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-base bg-lime-gradient shrink-0"
              style={{ boxShadow: '0 0 20px -4px rgba(189,255,46,0.6)' }}
>>>>>>> d952a10dfe09291a556c79a7edfcded67d527a73
            >
              <Zap size={18} style={{ color: '#0a0b0e' }} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-ink font-extrabold text-sm leading-tight tracking-tight">FitTrack</p>
              <p className="text-ink-subtle text-[10px] font-medium tracking-wide uppercase">
                {loading ? '—' : isAdmin ? 'Admin' : isCoach ? 'Coach' : 'Athlete'}
              </p>
            </div>
          </div>
<<<<<<< HEAD
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
=======
          <button
            className="md:hidden text-ink-subtle hover:text-ink transition-colors p-1 rounded-lg hover:bg-surface-700"
            onClick={() => setIsOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-hide">
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
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  active
                    ? 'text-surface-900'
                    : 'text-ink-muted hover:text-ink hover:bg-surface-800',
                )}
                style={active ? {
                  background: 'linear-gradient(135deg, #d8ff5c 0%, #bdff2e 100%)',
                  boxShadow: '0 0 20px -4px rgba(189,255,46,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
                } : undefined}
              >
                <span className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all',
                  active
                    ? 'bg-black/15'
                    : 'bg-surface-700 group-hover:bg-surface-600',
                )}>
                  <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
                </span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-5 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
          {!loading && (
            <div className="px-3 py-2 mb-1">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
                  isAdmin
                    ? 'bg-red-500/15 text-red-300 ring-1 ring-red-500/30'
                    : isCoach
                    ? 'bg-primary-400/15 text-primary-300 ring-1 ring-primary-400/30'
                    : 'bg-accent-400/15 text-accent-300 ring-1 ring-accent-400/30',
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                {isAdmin ? 'Admin' : isCoach ? 'Coach' : 'Athlete'}
              </span>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-ink-subtle hover:text-red-300 hover:bg-red-500/10 transition-all duration-150"
          >
            <span className="w-7 h-7 rounded-lg bg-surface-700 flex items-center justify-center shrink-0">
              <LogOut size={15} strokeWidth={1.8} />
            </span>
            Sign out
          </button>
        </div>
      </aside>
>>>>>>> d952a10dfe09291a556c79a7edfcded67d527a73
    </>
  );
}
