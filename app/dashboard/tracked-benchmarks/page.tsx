'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/Badge';
import {
  Table,
  Thead,
  Tbody,
  Th,
  Td,
  Tr,
} from '@/components/ui/Table';
import { trackedBenchmarksApi } from '@/lib/api';
import {
  Activity,
  Plus,
  Trash2,
  Trophy,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type ScoreType = 'weight' | 'time' | 'reps' | 'rounds';
type WeightMetric = 'max_weight' | 'total_volume';

interface TrackedBenchmark {
  id: string;
  name: string;
  description?: string;
  score_type: ScoreType;
  weight_metric?: WeightMetric;
  lower_is_better: boolean;
  key_exercise_name?: string;
  is_active: boolean;
  created_at: string;
}

interface LeaderboardEntry {
  rank: number;
  athlete: { name: string; avatar_url?: string };
  userId: string;
  bestScore: string;
  isRx: boolean;
  achievedAt: string;
}

const SCORE_TYPE_LABELS: Record<ScoreType, string> = {
  weight: 'Weight',
  time: 'Time',
  reps: 'Reps',
  rounds: 'Rounds',
};

const SCORE_TYPE_VARIANTS: Record<ScoreType, 'info' | 'warning' | 'success' | 'default'> = {
  weight: 'info',
  time: 'warning',
  reps: 'success',
  rounds: 'default',
};

// ─── Create Form ──────────────────────────────────────────────────────────────

function CreateBenchmarkForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    description: '',
    scoreType: 'weight' as ScoreType,
    weightMetric: 'max_weight' as WeightMetric,
    keyExerciseName: '',
    lowerIsBetter: false,
  });

  const { mutate: create, isPending } = useMutation({
    mutationFn: (dto: Record<string, unknown>) =>
      trackedBenchmarksApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracked-benchmarks'] });
      onClose();
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      name: form.name,
      description: form.description || undefined,
      scoreType: form.scoreType,
      lowerIsBetter:
        form.scoreType === 'time' ? true : form.lowerIsBetter,
    };
    if (form.scoreType === 'weight') {
      payload.weightMetric = form.weightMetric;
      payload.keyExerciseName = form.keyExerciseName;
    }
    if (form.scoreType === 'reps') {
      payload.keyExerciseName = form.keyExerciseName;
    }
    create(payload);
  }

  const needsExercise =
    form.scoreType === 'weight' || form.scoreType === 'reps';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-semibold text-ink mb-1">
          Benchmark Name *
        </label>
        <input
          required
          className="w-full px-3 py-2 rounded-lg border border-surface-border bg-surface-700 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50"
          placeholder="e.g. Back Squat Max, 400m Sprint..."
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-ink mb-1">
          Description
        </label>
        <textarea
          className="w-full px-3 py-2 rounded-lg border border-surface-border bg-surface-700 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50 resize-none"
          placeholder="What should athletes do to complete this benchmark?"
          rows={2}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
      </div>

      {/* Score type */}
      <div>
        <label className="block text-sm font-semibold text-ink mb-1">
          Score Type *
        </label>
        <div className="grid grid-cols-4 gap-2">
          {(['weight', 'time', 'reps', 'rounds'] as ScoreType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  scoreType: t,
                  lowerIsBetter: t === 'time',
                }))
              }
              className={cn(
                'py-2 rounded-lg text-sm font-semibold border transition-colors',
                form.scoreType === t
                  ? 'bg-primary-400/20 border-primary-400/50 text-primary-300'
                  : 'bg-surface-600 border-surface-border text-ink-muted hover:bg-surface-500',
              )}
            >
              {SCORE_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-ink-subtle">
          {form.scoreType === 'time' &&
            'Score = total workout duration. Lower is better.'}
          {form.scoreType === 'weight' &&
            'Score = max weight or total volume for a specific exercise.'}
          {form.scoreType === 'reps' &&
            'Score = total reps for a specific exercise.'}
          {form.scoreType === 'rounds' &&
            'Athletes enter their round count manually (e.g. AMRAP).'}
        </p>
      </div>

      {/* Weight metric (only for weight) */}
      {form.scoreType === 'weight' && (
        <div>
          <label className="block text-sm font-semibold text-ink mb-1">
            Weight Metric *
          </label>
          <div className="flex gap-2">
            {(['max_weight', 'total_volume'] as WeightMetric[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setForm((f) => ({ ...f, weightMetric: m }))}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors',
                  form.weightMetric === m
                    ? 'bg-primary-400/20 border-primary-400/50 text-primary-300'
                    : 'bg-surface-600 border-surface-border text-ink-muted hover:bg-surface-500',
                )}
              >
                {m === 'max_weight' ? 'Max Weight (1RM)' : 'Total Volume (kg × reps)'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Key exercise */}
      {needsExercise && (
        <div>
          <label className="block text-sm font-semibold text-ink mb-1">
            Key Exercise Name *
          </label>
          <input
            required={needsExercise}
            className="w-full px-3 py-2 rounded-lg border border-surface-border bg-surface-700 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50"
            placeholder="e.g. Back Squat (must match exercise name in workout)"
            value={form.keyExerciseName}
            onChange={(e) =>
              setForm((f) => ({ ...f, keyExerciseName: e.target.value }))
            }
          />
          <p className="mt-1 text-xs text-ink-subtle">
            The exercise name must partially match the name used inside the
            athlete's workout log.
          </p>
        </div>
      )}

      {/* Lower is better (non-time) */}
      {form.scoreType !== 'time' && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 rounded accent-primary-400"
            checked={form.lowerIsBetter}
            onChange={(e) =>
              setForm((f) => ({ ...f, lowerIsBetter: e.target.checked }))
            }
          />
          <span className="text-sm text-ink">Lower score is better</span>
        </label>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-ink-muted hover:bg-surface-700 border border-surface-border transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary-400 text-surface-900 hover:bg-primary-300 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Creating…' : 'Create Benchmark'}
        </button>
      </div>
    </form>
  );
}

// ─── Leaderboard panel ────────────────────────────────────────────────────────

function LeaderboardPanel({ benchmarkId }: { benchmarkId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['tracked-benchmarks', benchmarkId, 'leaderboard'],
    queryFn: () => trackedBenchmarksApi.leaderboard(benchmarkId),
    staleTime: 60 * 1000,
  });

  if (isLoading)
    return (
      <div className="py-6 flex justify-center">
        <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (isError || !data)
    return (
      <p className="text-sm text-ink-subtle py-4 text-center">
        Could not load leaderboard.
      </p>
    );

  const entries: LeaderboardEntry[] = data.leaderboard ?? [];

  if (entries.length === 0)
    return (
      <p className="text-sm text-ink-subtle py-4 text-center">
        No results logged yet. Athletes need to link a completed workout to this
        benchmark.
      </p>
    );

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <Table>
      <Thead>
        <Tr>
          <Th>Rank</Th>
          <Th>Athlete</Th>
          <Th>Best Score</Th>
          <Th>Rx</Th>
          <Th>Date</Th>
        </Tr>
      </Thead>
      <Tbody>
        {entries.map((entry) => (
          <Tr key={entry.userId}>
            <Td>
              <span className="font-bold text-base">
                {medals[entry.rank - 1] ?? `#${entry.rank}`}
              </span>
            </Td>
            <Td>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary-400/20 flex items-center justify-center text-xs font-bold text-primary-300">
                  {entry.athlete?.name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <span className="text-sm font-medium text-ink">
                  {entry.athlete?.name ?? 'Unknown'}
                </span>
              </div>
            </Td>
            <Td>
              <span className="font-bold text-primary-300">{entry.bestScore}</span>
            </Td>
            <Td>
              <Badge variant={entry.isRx ? 'success' : 'default'}>
                {entry.isRx ? 'Rx' : 'Scaled'}
              </Badge>
            </Td>
            <Td>
              <span className="text-ink-muted text-sm">
                {new Date(entry.achievedAt).toLocaleDateString()}
              </span>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}

// ─── Benchmark row ────────────────────────────────────────────────────────────

function BenchmarkRow({
  benchmark,
  onDelete,
}: {
  benchmark: TrackedBenchmark;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <Tr>
        <Td>
          <div>
            <p className="font-semibold text-ink">{benchmark.name}</p>
            {benchmark.description && (
              <p className="text-xs text-ink-subtle mt-0.5 max-w-xs truncate">
                {benchmark.description}
              </p>
            )}
          </div>
        </Td>
        <Td>
          <Badge variant={SCORE_TYPE_VARIANTS[benchmark.score_type]}>
            {SCORE_TYPE_LABELS[benchmark.score_type]}
          </Badge>
        </Td>
        <Td>
          {benchmark.key_exercise_name ? (
            <span className="text-sm text-ink">{benchmark.key_exercise_name}</span>
          ) : (
            <span className="text-ink-subtle text-sm">—</span>
          )}
        </Td>
        <Td>
          <div className="flex items-center gap-1 text-sm text-ink-muted">
            {benchmark.lower_is_better ? (
              <>
                <TrendingDown size={14} className="text-sky-400" />
                Lower wins
              </>
            ) : (
              <>
                <TrendingUp size={14} className="text-green-400" />
                Higher wins
              </>
            )}
          </div>
        </Td>
        <Td>
          <Badge variant={benchmark.is_active ? 'success' : 'default'}>
            {benchmark.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </Td>
        <Td>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="p-1.5 rounded-lg text-ink-muted hover:bg-surface-600 transition-colors"
              title="View leaderboard"
            >
              <Trophy size={15} />
            </button>
            <button
              onClick={() => onDelete(benchmark.id)}
              className="p-1.5 rounded-lg text-ink-muted hover:bg-red-500/15 hover:text-red-400 transition-colors"
              title="Deactivate"
            >
              <Trash2 size={15} />
            </button>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="p-1.5 rounded-lg text-ink-muted hover:bg-surface-600 transition-colors"
            >
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>
        </Td>
      </Tr>

      {/* Expanded leaderboard */}
      {expanded && (
        <Tr>
          <Td colSpan={6}>
            <div className="py-3 px-1">
              <p className="text-xs font-semibold text-ink-subtle uppercase tracking-wider mb-3">
                Athlete Leaderboard — {benchmark.name}
              </p>
              <LeaderboardPanel benchmarkId={benchmark.id} />
            </div>
          </Td>
        </Tr>
      )}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrackedBenchmarksPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: benchmarks, isLoading, isError } = useQuery({
    queryKey: ['tracked-benchmarks'],
    queryFn: () => trackedBenchmarksApi.list(),
    staleTime: 60 * 1000,
  });

  const { mutate: deactivate } = useMutation({
    mutationFn: (id: string) => trackedBenchmarksApi.delete(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['tracked-benchmarks'] }),
  });

  const active = (benchmarks ?? []).filter((b: TrackedBenchmark) => b.is_active);
  const inactive = (benchmarks ?? []).filter((b: TrackedBenchmark) => !b.is_active);

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Tracked Benchmarks"
        subtitle="Create coach-defined benchmarks and monitor athlete progress over time"
      />

      <main className="flex-1 p-6 overflow-y-auto space-y-6">
        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: 'Active Benchmarks',
              value: active.length,
              icon: Activity,
              color: 'text-primary-300',
            },
            {
              label: 'Score Types in Use',
              value: new Set(active.map((b: TrackedBenchmark) => b.score_type)).size,
              icon: Minus,
              color: 'text-sky-400',
            },
            {
              label: 'Total Created',
              value: (benchmarks ?? []).length,
              icon: Trophy,
              color: 'text-amber-400',
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="bg-surface-800 border border-surface-border rounded-xl px-5 py-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon size={16} className={color} />
                <span className="text-xs text-ink-subtle font-semibold uppercase tracking-wide">
                  {label}
                </span>
              </div>
              <p className="text-3xl font-bold text-ink">{value}</p>
            </div>
          ))}
        </div>

        {/* Create form panel */}
        {showCreate && (
          <div className="bg-surface-800 border border-surface-border rounded-xl p-5">
            <p className="text-sm font-bold text-ink mb-4">New Tracked Benchmark</p>
            <CreateBenchmarkForm onClose={() => setShowCreate(false)} />
          </div>
        )}

        {/* Active benchmarks table */}
        <div className="bg-surface-800 border border-surface-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
            <p className="font-semibold text-ink text-sm">Active Benchmarks</p>
            <button
              onClick={() => setShowCreate((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-primary-400 text-surface-900 hover:bg-primary-300 transition-colors"
            >
              <Plus size={15} />
              New Benchmark
            </button>
          </div>

          {isLoading ? (
            <div className="py-12 flex justify-center">
              <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : isError ? (
            <p className="py-8 text-center text-sm text-ink-subtle">
              Failed to load benchmarks.
            </p>
          ) : active.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 text-center">
              <Activity size={40} className="text-ink-subtle/30" />
              <p className="text-ink-muted font-semibold">No tracked benchmarks yet</p>
              <p className="text-sm text-ink-subtle max-w-sm">
                Create a benchmark to start tracking athlete progress. Athletes will
                see it in their mobile app and can log results from completed workouts.
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-primary-400 text-surface-900 hover:bg-primary-300 transition-colors"
              >
                <Plus size={15} />
                Create your first benchmark
              </button>
            </div>
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th>Benchmark</Th>
                  <Th>Score Type</Th>
                  <Th>Key Exercise</Th>
                  <Th>Direction</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {active.map((b: TrackedBenchmark) => (
                  <BenchmarkRow
                    key={b.id}
                    benchmark={b}
                    onDelete={deactivate}
                  />
                ))}
              </Tbody>
            </Table>
          )}
        </div>

        {/* Inactive/archived */}
        {inactive.length > 0 && (
          <div className="bg-surface-800 border border-surface-border rounded-xl overflow-hidden opacity-60">
            <div className="px-5 py-3 border-b border-surface-border">
              <p className="text-sm font-semibold text-ink-muted">
                Archived Benchmarks ({inactive.length})
              </p>
            </div>
            <Table>
              <Thead>
                <Tr>
                  <Th>Benchmark</Th>
                  <Th>Score Type</Th>
                  <Th>Key Exercise</Th>
                  <Th>Direction</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {inactive.map((b: TrackedBenchmark) => (
                  <BenchmarkRow
                    key={b.id}
                    benchmark={b}
                    onDelete={deactivate}
                  />
                ))}
              </Tbody>
            </Table>
          </div>
        )}
      </main>
    </div>
  );
}
