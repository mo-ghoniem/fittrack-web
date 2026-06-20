'use client';

import { useQuery } from '@tanstack/react-query';
<<<<<<< HEAD
import { Activity, TrendingUp, Users, Dumbbell, Timer, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/ui/StatCard';
=======
import { Activity, TrendingUp, Users, Dumbbell, ChevronRight, Zap, Trophy, Clock } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/ui/StatCard';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
>>>>>>> d952a10dfe09291a556c79a7edfcded67d527a73
import { workoutsApi, assignedWorkoutsApi } from '@/lib/api';
import { formatRelative } from '@/lib/utils';
import { useUserRole } from '@/hooks/useUserRole';

function ActivityRow({ name, workout, time }: { name: string; workout: string; time: string }) {
  return (
<<<<<<< HEAD
    <div className="flex items-center gap-3 py-3">
      <div className="w-8 h-8 rounded-full bg-primary-400/15 ring-1 ring-primary-400/30 flex items-center justify-center text-primary-300 font-semibold text-sm shrink-0">
        {name[0]}
      </div>
=======
    <div className="flex items-center gap-3 py-3 group">
      <Avatar name={name} size={34} />
>>>>>>> d952a10dfe09291a556c79a7edfcded67d527a73
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink truncate">{name}</p>
        <p className="text-xs text-ink-muted truncate">{workout}</p>
      </div>
      <span className="text-xs text-ink-subtle shrink-0">{time}</span>
    </div>
  );
}

<<<<<<< HEAD
/* ── Today's Workout hero card (athletes only) ─────────────────── */
=======
>>>>>>> d952a10dfe09291a556c79a7edfcded67d527a73
function TodayWorkoutCard() {
  const { data, isLoading } = useQuery({
    queryKey: ['today-workouts'],
    queryFn: () => assignedWorkoutsApi.getToday(),
    staleTime: 60_000,
  });

<<<<<<< HEAD
  const workouts: any[] = data?.data ?? [];
=======
  const workouts: any[] = (data?.data as any)?.data ?? data?.data ?? [];
>>>>>>> d952a10dfe09291a556c79a7edfcded67d527a73
  const pending   = workouts.filter((w) => w.status === 'pending');
  const completed = workouts.filter((w) => w.status === 'completed');
  const total     = workouts.length;

  if (isLoading) {
<<<<<<< HEAD
    return (
      <div className="rounded-2xl p-5 border border-surface-border bg-surface-800 animate-pulse h-28" />
    );
  }

=======
    return <div className="rounded-2xl h-28 shimmer" />;
  }

  const allDone = total > 0 && completed.length === total;

>>>>>>> d952a10dfe09291a556c79a7edfcded67d527a73
  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(189,255,46,0.13) 0%, rgba(34,211,238,0.05) 100%)',
        border: '1px solid rgba(189,255,46,0.22)',
<<<<<<< HEAD
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
=======
        boxShadow: '0 0 40px -10px rgba(189,255,46,0.3)',
      }}
    >
      {/* Ambient corner glow */}
      <div aria-hidden className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(189,255,46,0.4) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />

      <div className="flex items-start justify-between gap-3 relative">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-primary-400 uppercase tracking-widest mb-1.5">
            Today&apos;s Workout
          </p>
          {total === 0 ? (
            <>
              <p className="font-bold text-ink text-base">Rest day 🛌</p>
              <p className="text-xs text-ink-muted mt-0.5">No workouts scheduled today. Recover well!</p>
            </>
          ) : (
            <>
              <p className="font-bold text-ink text-base">
                {allDone
                  ? `All done! ${total} workout${total !== 1 ? 's' : ''} completed ✅`
                  : `${pending.length} workout${pending.length !== 1 ? 's' : ''} remaining`}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
>>>>>>> d952a10dfe09291a556c79a7edfcded67d527a73
                {workouts.slice(0, 3).map((w: any) => (
                  <span
                    key={w.id}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      w.status === 'completed'
<<<<<<< HEAD
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
=======
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-black/20 text-primary-300'
                    }`}
                  >
                    <Dumbbell size={9} />
                    {w.title}
                  </span>
                ))}
                {total > 3 && <span className="text-[11px] text-ink-muted self-center">+{total - 3} more</span>}
>>>>>>> d952a10dfe09291a556c79a7edfcded67d527a73
              </div>
            </>
          )}
        </div>
        <Link
          href="/dashboard/workouts"
<<<<<<< HEAD
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
=======
          className="btn-lime shrink-0 inline-flex items-center gap-1 text-xs font-bold px-4 py-2.5 rounded-xl"
        >
          {total === 0 ? 'Plan' : allDone ? 'Review' : 'Start'}
          <ChevronRight size={13} strokeWidth={2.5} />
        </Link>
      </div>

      {total > 0 && (
        <div className="mt-4">
          <ProgressBar value={completed.length} max={total} variant="lime" size="sm" showPercent />
>>>>>>> d952a10dfe09291a556c79a7edfcded67d527a73
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

  const coachActions = [
    { label: 'My Athletes', href: '/dashboard/athletes', icon: '🏃', desc: 'Manage your roster' },
    { label: 'All Workouts', href: '/dashboard/workouts', icon: '📋', desc: 'View all programs' },
    { label: 'Exercise Library', href: '/dashboard/exercises', icon: '🏋️', desc: 'Browse exercises' },
    { label: 'Analytics', href: '/dashboard/analytics', icon: '📊', desc: 'Performance data' },
  ];

  const athleteActions = [
    { label: 'My Workouts', href: '/dashboard/workouts', icon: '📋', desc: 'See your schedule' },
    { label: 'Analytics', href: '/dashboard/analytics', icon: '📊', desc: 'Track your progress' },
  ];

  const quickActions = isCoach ? coachActions : athleteActions;

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Overview"
        subtitle={isCoach ? 'Coach Dashboard' : 'Athlete Dashboard'}
      />

<<<<<<< HEAD
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Today's workout hero — athletes only */}
        {!isCoach && (
          <div className="mb-6">
            <TodayWorkoutCard />
          </div>
        )}

        {/* Stat cards — role-aware */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
=======
      <main className="flex-1 p-6 overflow-y-auto space-y-6">
        {/* Today's workout hero — athletes only */}
        {!isCoach && <TodayWorkoutCard />}

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
>>>>>>> d952a10dfe09291a556c79a7edfcded67d527a73
          <StatCard
            label="Workouts This Month"
            value={feed?.total ?? '—'}
            icon={Activity}
            color="lime"
          />
          <StatCard
            label="Active Streak"
            value="—"
            icon={TrendingUp}
            color="orange"
          />
          {isCoach ? (
            <StatCard
              label="My Athletes"
              value="—"
              icon={Users}
              color="cyan"
            />
          ) : (
            <StatCard
              label="Total PRs"
              value="—"
              icon={Trophy}
              color="violet"
            />
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Recent activity */}
<<<<<<< HEAD
          <div className="xl:col-span-2 card-glow rounded-2xl">
            <div className="px-5 py-4 border-b border-surface-border">
              <h2 className="font-semibold text-ink">Recent Workouts</h2>
              <p className="text-xs text-ink-muted mt-0.5">Latest public activity</p>
            </div>
            <div className="px-5 divide-y divide-surface-border">
              {recentWorkouts.length === 0 ? (
                <p className="text-sm text-ink-muted py-8 text-center">No recent workouts</p>
=======
          <div
            className="xl:col-span-2 rounded-2xl overflow-hidden"
            style={{
              background: '#101114',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 10px 30px -18px rgba(0,0,0,0.8)',
            }}
          >
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <h2 className="font-bold text-ink">Recent Activity</h2>
                <p className="text-xs text-ink-muted mt-0.5">Latest workout completions</p>
              </div>
              <Link
                href="/dashboard/workouts"
                className="text-xs font-semibold text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1"
              >
                View all <ChevronRight size={13} />
              </Link>
            </div>
            <div className="px-5 divide-y divide-surface-border/60">
              {(recentWorkouts as any[]).length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="No recent activity"
                  description="Workouts completed by you and your athletes will appear here."
                />
>>>>>>> d952a10dfe09291a556c79a7edfcded67d527a73
              ) : (
                (recentWorkouts as any[]).map((w: any) => (
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

          {/* Quick actions + promo */}
          <div className="space-y-4">
<<<<<<< HEAD
            <div className="card-glow rounded-2xl p-5">
              <h2 className="font-semibold text-ink mb-4">Quick Actions</h2>
=======
            <div
              className="rounded-2xl p-5"
              style={{
                background: '#101114',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 10px 30px -18px rgba(0,0,0,0.8)',
              }}
            >
              <h2 className="font-bold text-ink mb-4">Quick Actions</h2>
>>>>>>> d952a10dfe09291a556c79a7edfcded67d527a73
              <div className="space-y-1">
                {quickActions.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
<<<<<<< HEAD
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-ink hover:bg-surface-700 transition-colors"
=======
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-ink hover:bg-surface-700 transition-all duration-150 group"
>>>>>>> d952a10dfe09291a556c79a7edfcded67d527a73
                  >
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 transition-transform group-hover:scale-110"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-ink text-sm">{item.label}</p>
                      <p className="text-[11px] text-ink-muted">{item.desc}</p>
                    </div>
                    <ChevronRight size={14} className="ml-auto text-ink-subtle opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </div>

            {isCoach && (
              <div
                className="rounded-2xl p-5 relative overflow-hidden"
                style={{
<<<<<<< HEAD
                  background:
                    'linear-gradient(135deg, rgba(189,255,46,0.14) 0%, rgba(34,211,238,0.06) 100%)',
=======
                  background: 'linear-gradient(135deg, rgba(189,255,46,0.14) 0%, rgba(34,211,238,0.06) 100%)',
>>>>>>> d952a10dfe09291a556c79a7edfcded67d527a73
                  border: '1px solid rgba(189,255,46,0.25)',
                  boxShadow: '0 0 28px -8px rgba(189,255,46,0.35)',
                }}
              >
<<<<<<< HEAD
                <p className="font-semibold text-sm mb-1 text-ink">Manage Your Athletes</p>
                <p className="text-ink-muted text-xs mb-3">
                  Add athletes, assign programs and track their progress.
=======
                <div aria-hidden className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-30" style={{ background: 'radial-gradient(circle, rgba(189,255,46,0.5) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={14} className="text-primary-400" />
                  <p className="font-bold text-sm text-ink">Manage Athletes</p>
                </div>
                <p className="text-ink-muted text-xs mb-3 leading-relaxed">
                  Add athletes, assign programs and track their progress from one place.
>>>>>>> d952a10dfe09291a556c79a7edfcded67d527a73
                </p>
                <Link
                  href="/dashboard/athletes"
<<<<<<< HEAD
                  className="btn-lime inline-block text-xs font-semibold px-4 py-2 rounded-full"
=======
                  className="btn-lime inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl"
>>>>>>> d952a10dfe09291a556c79a7edfcded67d527a73
                >
                  Go to Athletes <ChevronRight size={12} strokeWidth={2.5} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
