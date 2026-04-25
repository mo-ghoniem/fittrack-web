'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, CheckCircle2, Clock, Flame, BarChart3, Calendar, Dumbbell,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { CoachGuard } from '@/components/layout/CoachGuard';
import { apiClient } from '@/lib/api';
import { formatDate } from '@/lib/utils';

// ── API helpers ────────────────────────────────────────────────────────────

function fetchAthleteStats(athleteId: string, period: string) {
  return apiClient.get(`/stats/athlete/${athleteId}?period=${period}`).then((r) => r.data);
}

function fetchAthleteAssignments(athleteId: string) {
  return apiClient
    .get(`/assigned-workouts/athlete/${athleteId}`)
    .then((r) => r.data?.data ?? r.data ?? []);
}

function fetchAthleteProfile(athleteId: string) {
  return apiClient
    .get('/coaching/my-athletes')
    .then((r) => {
      const athletes: any[] = r.data?.data ?? r.data ?? [];
      return athletes.find((a: any) => a.athleteId === athleteId) ?? null;
    });
}

// ── Stat Card ────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

// ── Assignment Row ────────────────────────────────────────────────────────

function AssignmentRow({ assignment }: { assignment: any }) {
  const isCompleted = assignment.status === 'completed' || assignment.is_completed;
  return (
    <div className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
      }`}>
        {isCompleted ? <CheckCircle2 size={16} /> : <Clock size={16} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">
          {assignment.title}
        </p>
        <p className="text-xs text-slate-500">
          {formatDate(assignment.scheduled_date ?? assignment.assigned_date)}
        </p>
      </div>
      {isCompleted && (assignment.athlete_result ?? assignment.result_score) && (
        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md shrink-0">
          {assignment.athlete_result ?? assignment.result_score}
        </span>
      )}
      <span className={`text-xs font-medium px-2 py-1 rounded-md shrink-0 ${
        isCompleted
          ? 'text-emerald-700 bg-emerald-50'
          : 'text-slate-600 bg-slate-100'
      }`}>
        {isCompleted ? 'Done' : 'Pending'}
      </span>
    </div>
  );
}

// ── Page Tabs ────────────────────────────────────────────────────────────

type Tab = 'overview' | 'assignments';

// ── Main Page ────────────────────────────────────────────────────────────

function AthleteDetailContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const athleteId = params.id;
  const [period, setPeriod] = useState<'7d' | '30d' | '3m' | '1y'>('30d');
  const [tab, setTab] = useState<Tab>('overview');

  const profileQuery = useQuery({
    queryKey: ['athlete-profile', athleteId],
    queryFn: () => fetchAthleteProfile(athleteId),
  });

  const statsQuery = useQuery({
    queryKey: ['athlete-stats', athleteId, period],
    queryFn: () => fetchAthleteStats(athleteId, period),
    enabled: tab === 'overview',
  });

  const assignmentsQuery = useQuery({
    queryKey: ['athlete-assignments', athleteId],
    queryFn: () => fetchAthleteAssignments(athleteId),
    enabled: tab === 'assignments',
  });

  const athlete = profileQuery.data;
  const athleteName = athlete?.profile?.name ?? 'Athlete';
  const stats = statsQuery.data;
  const assignments: any[] = assignmentsQuery.data ?? [];

  const completedCount = assignments.filter(
    (a) => a.status === 'completed' || a.is_completed,
  ).length;
  const completionRate = assignments.length > 0
    ? Math.round((completedCount / assignments.length) * 100)
    : 0;

  const PERIODS: { label: string; value: typeof period }[] = [
    { label: '7D', value: '7d' },
    { label: '30D', value: '30d' },
    { label: '3M', value: '3m' },
    { label: '1Y', value: '1y' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header title="Athlete Details" />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Back + Athlete Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Athletes
          </button>

          {profileQuery.isLoading ? (
            <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-lg font-bold">
                {athleteName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{athleteName}</h1>
                {athlete?.coachingSince && (
                  <p className="text-sm text-slate-500">
                    Coaching since {formatDate(athlete.coachingSince)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-6 w-fit">
          {(['overview', 'assignments'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                tab === t
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {/* Period selector */}
            <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1 w-fit">
              {PERIODS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setPeriod(value)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                    period === value
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {statsQuery.isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-20 bg-slate-200 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  label="Workouts"
                  value={stats.workoutCount ?? 0}
                  icon={Dumbbell}
                  color="bg-primary-50 text-primary-600"
                />
                <StatCard
                  label="Streak"
                  value={`${stats.streak ?? 0}d`}
                  icon={Flame}
                  color="bg-orange-50 text-orange-500"
                />
                <StatCard
                  label="Avg Duration"
                  value={`${stats.avgDurationMinutes ?? 0}m`}
                  icon={Clock}
                  color="bg-blue-50 text-blue-500"
                />
                <StatCard
                  label="Total Volume"
                  value={`${(stats.totalVolume ?? 0).toLocaleString()} kg`}
                  icon={BarChart3}
                  color="bg-violet-50 text-violet-500"
                />
              </div>
            ) : (
              <p className="text-sm text-slate-500">No stats available for this period.</p>
            )}

            {/* Muscle groups */}
            {stats?.muscleGroups?.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-100 p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Muscle Groups</h3>
                <div className="space-y-2.5">
                  {stats.muscleGroups.map((mg: any) => (
                    <div key={mg.name} className="flex items-center gap-3">
                      <span className="text-sm text-slate-600 w-28 shrink-0">{mg.name}</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full"
                          style={{ width: `${mg.pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 w-8 text-right">{mg.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Assignments Tab */}
        {tab === 'assignments' && (
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-700">Assigned Workouts</h3>
              </div>
              {assignments.length > 0 && (
                <span className="text-xs font-medium text-slate-500">
                  {completedCount}/{assignments.length} completed ({completionRate}%)
                </span>
              )}
            </div>

            {assignmentsQuery.isLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
                ))}
              </div>
            ) : assignments.length === 0 ? (
              <div className="p-10 text-center">
                <Calendar size={32} className="text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No workouts assigned yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {[...assignments]
                  .sort((a, b) => {
                    const dateA = a.scheduled_date ?? a.assigned_date ?? '';
                    const dateB = b.scheduled_date ?? b.assigned_date ?? '';
                    return dateB.localeCompare(dateA);
                  })
                  .map((a: any) => (
                    <AssignmentRow key={a.id} assignment={a} />
                  ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

export default function AthleteDetailPage() {
  return (
    <CoachGuard>
      <AthleteDetailContent />
    </CoachGuard>
  );
}
