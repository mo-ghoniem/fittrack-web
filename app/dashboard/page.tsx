'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, TrendingUp, Users } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/ui/StatCard';
import { workoutsApi } from '@/lib/api';
import { formatRelative } from '@/lib/utils';
import { useUserRole } from '@/hooks/useUserRole';

function ActivityRow({
  name,
  workout,
  time,
}: {
  name: string;
  workout: string;
  time: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm shrink-0">
        {name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{name}</p>
        <p className="text-xs text-slate-500 truncate">{workout}</p>
      </div>
      <span className="text-xs text-slate-400 shrink-0">{time}</span>
    </div>
  );
}

export default function DashboardPage() {
  const { role } = useUserRole();
  const isCoach = role === 'coach';

  const { data: feed } = useQuery({
    queryKey: ['feed'],
    queryFn: () => workoutsApi.feed({ limit: 8 }),
  });

  const recentWorkouts = feed?.data ?? [];

  // Role-aware quick actions
  const coachActions = [
    { label: 'My Athletes', href: '/dashboard/athletes', icon: '🏃' },
    { label: 'All Workouts', href: '/dashboard/workouts', icon: '📋' },
    { label: 'Exercise Library', href: '/dashboard/exercises', icon: '🏋️' },
    { label: 'Analytics', href: '/dashboard/analytics', icon: '📊' },
  ];

  const athleteActions = [
    { label: 'My Workouts', href: '/dashboard/workouts', icon: '📋' },
    { label: 'Analytics', href: '/dashboard/analytics', icon: '📊' },
  ];

  const quickActions = isCoach ? coachActions : athleteActions;

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Overview"
        subtitle={isCoach ? 'Coach Dashboard' : 'Athlete Dashboard'}
      />

      <main className="flex-1 p-6 overflow-y-auto">
        {/* Stat cards — role-aware */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Workouts This Month"
            value={feed?.total ?? '—'}
            icon={Activity}
            color="green"
          />
          <StatCard
            label="Active Streak (Avg)"
            value="—"
            icon={TrendingUp}
            color="orange"
          />
          {isCoach && (
            <StatCard
              label="My Athletes"
              value="—"
              icon={Users}
              color="blue"
            />
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Recent activity */}
          <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Recent Workouts</h2>
              <p className="text-xs text-slate-500 mt-0.5">Latest public activity</p>
            </div>
            <div className="px-5 divide-y divide-slate-100">
              {recentWorkouts.length === 0 ? (
                <p className="text-sm text-slate-500 py-8 text-center">No recent workouts</p>
              ) : (
                recentWorkouts.map((w: any) => (
                  <ActivityRow
                    key={w.id}
                    name={w.user?.name ?? 'Unknown'}
                    workout={w.name}
                    time={formatRelative(w.completed_at ?? w.started_at)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h2 className="font-semibold text-slate-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {quickActions.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-base">{item.icon}</span>
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            {isCoach && (
              <div className="bg-primary-600 rounded-xl p-5 text-white">
                <p className="font-semibold text-sm mb-1">Manage Your Athletes</p>
                <p className="text-primary-200 text-xs mb-3">
                  Add athletes, assign programs and track their progress.
                </p>
                <a
                  href="/dashboard/athletes"
                  className="inline-block bg-white text-primary-700 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  Go to Athletes →
                </a>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
