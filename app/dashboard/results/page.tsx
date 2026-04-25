'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Trophy,
  CheckCircle2,
  Clock,
  Dumbbell,
  Users,
  Video,
  X,
  Loader2,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/Badge';
import { assignedWorkoutsApi } from '@/lib/api';

/* ── helpers ─────────────────────────────────────────────────────── */

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

/** Try to parse a result string as a number for ranking. Returns null if unparseable. */
function parseScore(result: string | null): number | null {
  if (!result) return null;
  // Time: M:SS
  const t = result.match(/^(\d+):(\d{2})/);
  if (t) return parseInt(t[1]) * 60 + parseInt(t[2]);
  // Plain number
  const n = result.match(/^(\d+(?:\.\d+)?)/);
  if (n) return parseFloat(n[1]);
  return null;
}

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  'bg-primary-400/20 text-primary-300',
  'bg-accent-400/20 text-accent-300',
  'bg-purple-400/20 text-purple-300',
  'bg-amber-400/20 text-amber-300',
  'bg-rose-400/20 text-rose-300',
];

function avatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

/* ── Video modal ─────────────────────────────────────────────────── */

function VideoModal({ workoutId, athleteName, onClose }: {
  workoutId: string;
  athleteName: string;
  onClose: () => void;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['video-view-url', workoutId],
    queryFn: () => assignedWorkoutsApi.getVideoViewUrl(workoutId),
    staleTime: 50 * 60_000,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-surface-800 rounded-2xl shadow-2xl w-full max-w-lg border border-surface-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <Video size={15} className="text-primary-400" />
            <p className="font-semibold text-ink text-sm">{athleteName}'s Video</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-700 text-ink-muted transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin text-primary-400" />
            </div>
          ) : isError || !data?.viewUrl ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
              <p className="text-ink-muted text-sm">Could not load video.</p>
              <p className="text-ink-subtle text-xs">The signed URL may have expired or the video is unavailable.</p>
            </div>
          ) : (
            <video
              src={data.viewUrl}
              controls
              autoPlay
              className="w-full rounded-xl bg-black max-h-80 object-contain"
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Row component ───────────────────────────────────────────────── */

function ResultRow({
  rank,
  workout,
  showRank,
}: {
  rank: number | null;
  workout: any;
  showRank: boolean;
}) {
  const athlete = workout.athlete as any;
  const name    = athlete?.name ?? 'Unknown Athlete';
  const isDone  = workout.status === 'completed';
  const blocks: any[] = workout.blocks ?? [];
  const [showVideoModal, setShowVideoModal] = useState(false);

  return (
    <>
      {showVideoModal && (
        <VideoModal
          workoutId={workout.id}
          athleteName={name}
          onClose={() => setShowVideoModal(false)}
        />
      )}
      <div className={`flex items-center gap-4 px-5 py-3.5 border-b border-surface-border last:border-0 ${
        isDone ? '' : 'opacity-60'
      }`}>
        {/* Rank */}
        {showRank && (
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
            rank === 1 ? 'bg-yellow-400/20 text-yellow-300' :
            rank === 2 ? 'bg-slate-400/20 text-slate-300' :
            rank === 3 ? 'bg-amber-600/20 text-amber-400' :
            'bg-surface-700 text-ink-muted'
          }`}>
            {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
          </div>
        )}

        {/* Avatar */}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarColor(name)}`}>
          {athlete?.avatar_url
            ? <img src={athlete.avatar_url} className="w-9 h-9 rounded-full object-cover" alt={name} />
            : initials(name)
          }
        </div>

        {/* Name + workout title */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink text-sm truncate">{name}</p>
          <p className="text-xs text-ink-muted truncate">{workout.title}</p>
          {blocks.length > 0 && (
            <p className="text-[10px] text-ink-subtle mt-0.5">
              {blocks.length} block{blocks.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Score */}
        <div className="text-right shrink-0">
          {isDone ? (
            <>
              <div className="flex items-center gap-1 justify-end">
                <Trophy size={12} className="text-primary-400" />
                <span className="text-sm font-bold text-ink">{workout.athlete_result}</span>
              </div>
              {workout.athlete_notes && (
                <p className="text-[10px] text-ink-muted mt-0.5 italic max-w-[160px] text-right truncate">
                  {workout.athlete_notes}
                </p>
              )}
            </>
          ) : (
            <Badge variant="default">Pending</Badge>
          )}
        </div>

        {/* Video icon (only when video exists) */}
        {isDone && workout.video_url && (
          <button
            onClick={() => setShowVideoModal(true)}
            title="Watch athlete's video"
            className="p-1.5 rounded-lg hover:bg-primary-500/20 text-primary-400 hover:text-primary-300 transition-colors shrink-0"
          >
            <Video size={16} />
          </button>
        )}

        {/* Status badge */}
        <div className="shrink-0">
          {isDone
            ? <CheckCircle2 size={18} className="text-emerald-400" />
            : <Clock size={18} className="text-ink-subtle" />
          }
        </div>
      </div>
    </>
  );
}

/* ── Workout group ───────────────────────────────────────────────── */

function WorkoutGroup({ title, rows }: { title: string; rows: any[] }) {
  const completed = rows.filter((r) => r.status === 'completed');

  // Sort completed rows by score: detect if time-based (lower = better) or number (higher = better)
  const sorted = useMemo(() => {
    const done    = completed.slice();
    const pending = rows.filter((r) => r.status !== 'completed');

    if (done.length > 1) {
      const firstScore = parseScore(done[0]?.athlete_result);
      if (firstScore !== null) {
        // Detect time by presence of colon
        const isTime = /^\d+:\d{2}/.test(done[0]?.athlete_result ?? '');
        done.sort((a, b) => {
          const sa = parseScore(a.athlete_result) ?? (isTime ? Infinity : -Infinity);
          const sb = parseScore(b.athlete_result) ?? (isTime ? Infinity : -Infinity);
          return isTime ? sa - sb : sb - sa;
        });
      }
    }

    return [...done, ...pending];
  }, [rows]);

  return (
    <div className="card-glow rounded-2xl overflow-hidden mb-5">
      {/* Group header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-border bg-surface-800/50">
        <div className="flex items-center gap-2">
          <Dumbbell size={15} className="text-primary-400" />
          <h3 className="font-semibold text-ink text-sm">{title}</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <span className="text-emerald-400 font-semibold">{completed.length}</span>
          <span>/</span>
          <span>{rows.length}</span>
          <span>done</span>
        </div>
      </div>

      {/* Rows */}
      <div>
        {sorted.map((w: any, idx: number) => (
          <ResultRow
            key={w.id}
            workout={w}
            showRank={completed.length > 1}
            rank={w.status === 'completed' ? idx + 1 : null}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */

export default function ResultsBoardPage() {
  const today = new Date();
  const [date, setDate] = useState(toDateStr(today));

  const { data, isLoading } = useQuery({
    queryKey: ['coach-results', date],
    queryFn: () => assignedWorkoutsApi.getCoachResults(date),
    staleTime: 30_000,
  });

  const allWorkouts: any[] = data?.data ?? [];

  // Group by workout title
  const groups = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const w of allWorkouts) {
      const key = w.title ?? 'Untitled';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(w);
    }
    return map;
  }, [allWorkouts]);

  const totalDone    = allWorkouts.filter((w) => w.status === 'completed').length;
  const totalPending = allWorkouts.filter((w) => w.status === 'pending').length;

  const prevDay = () => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    setDate(toDateStr(d));
  };
  const nextDay = () => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    setDate(toDateStr(d));
  };

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Results Board"
        subtitle="See how your athletes performed today"
      />

      <main className="flex-1 p-6 overflow-y-auto">
        {/* Date nav */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={prevDay}
            className="p-2 rounded-lg bg-surface-700 hover:bg-surface-600 text-ink-muted transition-colors"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex-1 text-center">
            <p className="font-semibold text-ink">{fmtDate(date)}</p>
            {date === toDateStr(today) && (
              <p className="text-xs text-primary-400 font-semibold">Today</p>
            )}
          </div>

          <button
            onClick={nextDay}
            className="p-2 rounded-lg bg-surface-700 hover:bg-surface-600 text-ink-muted transition-colors"
          >
            <ChevronRight size={18} />
          </button>

          <input
            type="date"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="px-3 py-2 text-sm bg-surface-700 border border-surface-border text-ink rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Summary pills */}
        {allWorkouts.length > 0 && (
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-300">{totalDone} completed</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-700 border border-surface-border">
              <Clock size={13} className="text-ink-muted" />
              <span className="text-xs font-semibold text-ink-muted">{totalPending} pending</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-700 border border-surface-border">
              <Users size={13} className="text-ink-muted" />
              <span className="text-xs font-semibold text-ink-muted">{allWorkouts.length} total</span>
            </div>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-primary-200/30 border-t-primary-400 rounded-full animate-spin" />
          </div>
        ) : allWorkouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-700 flex items-center justify-center">
              <Dumbbell size={28} className="text-ink-subtle" />
            </div>
            <p className="font-semibold text-ink">No workouts assigned on this day</p>
            <p className="text-sm text-ink-muted max-w-sm">
              Assign workouts via Templates or the Athletes page to see results here.
            </p>
          </div>
        ) : (
          <div>
            {Array.from(groups.entries()).map(([title, rows]) => (
              <WorkoutGroup key={title} title={title} rows={rows} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
