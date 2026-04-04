'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity, TrendingUp, Clock, Flame, Trophy, Users, Dumbbell, BarChart2,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { statsApi } from '@/lib/api';

type Period = '7d' | '30d' | '3m' | '1y';

const PERIODS: { key: Period; label: string }[] = [
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '3m', label: '3 Months' },
  { key: '1y', label: '1 Year' },
];

const CAT_COLORS = [
  'bg-primary-500', 'bg-violet-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-rose-500', 'bg-cyan-500',
];

function FrequencyGrid({ grid }: { grid: { date: string; count: number }[] }) {
  if (!grid?.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {grid.map((day) => {
        const intensity = Math.min(day.count / 3, 1);
        const bg = day.count === 0
          ? 'bg-slate-100'
          : intensity < 0.4 ? 'bg-primary-200'
          : intensity < 0.7 ? 'bg-primary-400'
          : 'bg-primary-600';
        return (
          <div
            key={day.date}
            title={`${day.date}: ${day.count} workout${day.count !== 1 ? 's' : ''}`}
            className={`w-4 h-4 rounded-sm ${bg} cursor-pointer transition-opacity hover:opacity-80`}
          />
        );
      })}
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('30d');

  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['stats', period],
    queryFn: () => statsApi.get(period),
    staleTime: 5 * 60 * 1000,
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard', period],
    queryFn: () => statsApi.leaderboard(period),
    staleTime: 5 * 60 * 1000,
  });

  const rankColors: Record<number, string> = { 1: 'text-yellow-500', 2: 'text-slate-400', 3: 'text-amber-600' };

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Analytics" subtitle="Platform-wide statistics and athlete insights" />

      <main className="flex-1 p-6 overflow-y-auto">

        {/* Period Selector */}
        <div className="flex gap-2 mb-6">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                period === p.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
            <p className="ml-3 text-slate-500">Loading analytics...</p>
          </div>
        )}

        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 font-semibold">Failed to load analytics</p>
            <p className="text-red-400 text-sm mt-1">Make sure the backend is running and you&apos;re logged in.</p>
          </div>
        )}

        {stats && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Workouts"
                value={String(stats.workoutCount ?? 0)}
                icon={Activity}
                color="blue"
                change={stats.changes?.workouts ?? undefined}
                changeType={stats.changes?.workouts?.startsWith('+') ? 'up' : stats.changes?.workouts?.startsWith('-') ? 'down' : 'neutral'}
              />
              <StatCard
                label="Total Volume"
                value={stats.totalVolume > 999
                  ? `${(stats.totalVolume / 1000).toFixed(1)}k kg`
                  : `${stats.totalVolume ?? 0} kg`}
                icon={TrendingUp}
                color="green"
                change={stats.changes?.volume ?? undefined}
                changeType={stats.changes?.volume?.startsWith('+') ? 'up' : 'neutral'}
              />
              <StatCard
                label="Avg Duration"
                value={`${stats.avgDurationMinutes ?? 0} min`}
                icon={Clock}
                color="purple"
                change={stats.changes?.duration ?? undefined}
                changeType="neutral"
              />
              <StatCard
                label="Current Streak"
                value={`${stats.streak ?? 0} days`}
                icon={Flame}
                color="orange"
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
              {/* Workout Frequency Heatmap */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart2 size={18} className="text-primary-600" />
                  <h3 className="font-semibold text-slate-800">Workout Frequency</h3>
                </div>
                <FrequencyGrid grid={stats.frequencyGrid ?? []} />
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs text-slate-400">Less</span>
                  {['bg-slate-100', 'bg-primary-200', 'bg-primary-400', 'bg-primary-600'].map((c) => (
                    <div key={c} className={`w-3 h-3 rounded-sm ${c}`} />
                  ))}
                  <span className="text-xs text-slate-400">More</span>
                </div>
              </div>

              {/* Muscle Group Distribution */}
              {stats.muscleGroups?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Dumbbell size={18} className="text-violet-600" />
                    <h3 className="font-semibold text-slate-800">Muscle Groups Trained</h3>
                  </div>
                  <div className="space-y-3">
                    {stats.muscleGroups.map((group: any, idx: number) => (
                      <div key={group.name} className="flex items-center gap-3">
                        <span className="text-sm text-slate-600 w-24 shrink-0">{group.name}</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${CAT_COLORS[idx % CAT_COLORS.length]}`}
                            style={{ width: `${group.pct}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-slate-500 w-10 text-right">
                          {group.pct}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Personal Records */}
              {stats.personalRecords?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy size={18} className="text-amber-500" />
                    <h3 className="font-semibold text-slate-800">Personal Records</h3>
                  </div>
                  <div className="space-y-1">
                    {stats.personalRecords.map((pr: any) => (
                      <div
                        key={pr.exerciseId}
                        className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0"
                      >
                        <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                          <span className="text-base">🏆</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{pr.name}</p>
                          <p className="text-xs text-slate-400">{pr.date}</p>
                        </div>
                        <span className="text-sm font-bold text-slate-700">
                          {pr.weight} <span className="font-normal text-slate-400">kg</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Leaderboard */}
              {leaderboard?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Users size={18} className="text-emerald-600" />
                    <h3 className="font-semibold text-slate-800">Workout Leaderboard</h3>
                    <Badge variant="info" className="ml-auto">{period}</Badge>
                  </div>
                  <div className="space-y-2">
                    {leaderboard.slice(0, 10).map((entry: any) => (
                      <div
                        key={entry.userId}
                        className={`flex items-center gap-3 py-2 px-3 rounded-xl ${
                          entry.isMe ? 'bg-primary-50 border border-primary-200' : 'hover:bg-slate-50'
                        }`}
                      >
                        <span className={`text-lg font-black w-6 text-center ${rankColors[entry.rank] ?? 'text-slate-400'}`}>
                          {entry.rank <= 3 ? ['🥇','🥈','🥉'][entry.rank - 1] : entry.rank}
                        </span>
                        <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs shrink-0">
                          {entry.name?.[0] ?? '?'}
                        </div>
                        <span className={`flex-1 text-sm font-semibold ${entry.isMe ? 'text-primary-700' : 'text-slate-800'}`}>
                          {entry.name}{entry.isMe ? ' (You)' : ''}
                        </span>
                        <span className="text-sm font-bold text-slate-600">
                          {entry.count} <span className="font-normal text-slate-400">WODs</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {stats.workoutCount === 0 && (
              <div className="text-center py-20 text-slate-400">
                <p className="text-4xl mb-3">📊</p>
                <p className="text-lg font-semibold text-slate-500">No workout data for this period</p>
                <p className="text-sm mt-1">Athletes need to log workouts to see stats here.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
