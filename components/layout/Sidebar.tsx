'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Dumbbell,
  Activity,
  BarChart3,
  Settings,
  LogOut,
  ClipboardList,
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
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/athletes', label: 'My Athletes', icon: UserCheck, coachOnly: true },
  { href: '/dashboard/templates', label: 'Templates', icon: ClipboardList, coachOnly: true },
  { href: '/dashboard/users', label: 'All Users', icon: Users, coachOnly: true },
  { href: '/dashboard/exercises', label: 'Exercises', icon: Dumbbell, coachOnly: true },
  { href: '/dashboard/workouts', label: 'My Workouts', icon: Activity, athleteOnly: true },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, loading } = useUserRole();

  const isCoach = role === 'coach';

  // Filter nav items based on role
  const visibleItems = NAV_ITEMS.filter(
    (item) =>
      (!item.coachOnly || isCoach) &&
      (!item.athleteOnly || !isCoach),
  );

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside className="w-60 min-h-screen bg-slate-900 flex flex-col shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700">
        <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-base">
          🏋️
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">FitTrack</p>
          <p className="text-slate-400 text-xs">
            {loading ? 'Loading…' : isCoach ? 'Coach Dashboard' : 'Athlete Dashboard'}
          </p>
        </div>
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
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800',
              )}
            >
              <Icon size={18} strokeWidth={1.8} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Role badge + Sign out */}
      <div className="px-3 pb-4 border-t border-slate-700 pt-4 space-y-2">
        {!loading && (
          <div className="px-3 py-1.5">
            <span
              className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
                isCoach
                  ? 'bg-primary-600/20 text-primary-300'
                  : 'bg-emerald-600/20 text-emerald-300',
              )}
            >
              {isCoach ? 'Coach' : 'Athlete'}
            </span>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <LogOut size={18} strokeWidth={1.8} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
