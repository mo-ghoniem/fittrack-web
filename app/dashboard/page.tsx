'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, TrendingUp, Users, Dumbbell, Timer, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/ui/StatCard';
import { workoutsApi, assignedWorkoutsApi } from '@/lib/api';
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
      <div className="w-8 h-8 rounded-full bg-primary-400/15 ring-1 ring-primary-400/30 flex items-center justify-center text-primary-300 font-semibold text-sm shrink-0">
        {name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink truncate">{name}</p>
        <p className="text-xs text-ink-muted truncate">{workout}</p>
      </div>
      <span className="text-xs text-ink-subtle shrink-0">{time}</span>
    </div>
  );
}

/* ── Today's Workout hero card (athletes only) ─────────────────── */
function TodayWorkoutCard() {
  const { data, isLoading } = useQuery({
    queryKey: ['today-workouts'],
    queryFn: () => assignedWorkoutsApi.getToday(),
    staleTime: 60_000,
  });

  const workouts: any[] = data?.data ?? [];
  const pending   = workouts.filter((w) => w.status === 'pending');
  const completed = workouts.filter((w) => w.status === 'completed');
  const total     = workouts.length;

  if (isLoading) {
    return (
      <div className="rounded-2xl p-5 border border-surface-border bg-surface-800 animate-pulse h-28" />
    );
  }

  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(189,255,46,0.13) 0%, rgba(34,211,238,0.05) 100%)',
        border: '1px solid rgba(189,255,46,0.22)',
        boxShadow: '0 0 32px -10px rgba(189,255,46,0.3)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-primary-400 uppercase tracking-widest mb-1">
            Today's Workout
          </p>
          {total === 0 ? (
            <>
              <p className="font-semibold text-ink text-sm">Rest day 🛌</p>
              <p className="text-xs text-ink-muted mt-0.5">No workouts scheduled today.</p>
            </>
          ) : (
            <>
              <p className="font-semibold text-ink text-sm">
                {completed.length === total
                  ? `All done! ${total} workout${total !== 1 ? 's' : ''} completed ✅`
                  : `${pending.length} workout${pending.length !== 1 ? 's' : ''} waiting`}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {workouts.slice(0, 3).map((w: any) => (
                  <span
                    key={w.id}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      w.status === 'completed'
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-primary-400/15 text-primary-300'
                    }`}
                  >
                    <Dumbbell size={10} />
                    {w.title}
                  </span>
                ))}
                {total > 3 && (
                  <span className="text-[11px] text-ink-muted">+{total - 3} more</span>
                )}
              </div>
            </>
          )}
        </div>
        <Link
          href="/dashboard/workouts"
          className="btn-lime shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-full"
        >
          {total === 0 ? 'See Plan' : completed.length === total ? 'View' : 'Start'}
          <ChevronRight size={13} />
        </Link>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(completed.length / total) * 100}%`,
              background: 'rgba(189,255,46,0.6)',
            }}
          />
        </div>
      )}
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
        {/* Today's workout hero — athletes only */}
        {!isCoach && (
          <div className="mb-6">
            <TodayWorkoutCard />
          </div>
        )}

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
          <div className="xl:col-span-2 card-glow rounded-2xl">
            <div className="px-5 py-4 border-b border-surface-border">
              <h2 className="font-semibold text-ink">Recent Workouts</h2>
              <p className="text-xs text-ink-muted mt-0.5">Latest public activity</p>
            </div>
            <div className="px-5 divide-y divide-surface-border">
              {recentWorkouts.length === 0 ? (
                <p className="text-sm text-ink-muted py-8 text-center">No recent workouts</p>
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
            <div className="card-glow rounded-2xl p-5">
              <h2 className="font-semibold text-ink mb-4">Quick Actions</h2>
              <div className="space-y-1">
                {quickActions.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-ink hover:bg-surface-700 transition-colors"
                  >
                    <span className="text-base">{item.icon}</span>
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            {isCoach && (
              <div
                className="rounded-2xl p-5 relative overflow-hidden"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(189,255,46,0.14) 0%, rgba(34,211,238,0.06) 100%)',
                  border: '1px solid rgba(189,255,46,0.25)',
                  boxShadow: '0 0 28px -8px rgba(189,255,46,0.35)',
                }}
              >
                <p className="font-semibold text-sm mb-1 text-ink">Manage Your Athletes</p>
                <p className="text-ink-muted text-xs mb-3">
                  Add athletes, assign programs and track their progress.
                </p>
                <a
                  href="/dashboard/athletes"
                  className="btn-lime inline-block text-xs font-semibold px-4 py-2 rounded-full"
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
