'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Trash2, Clock, Dumbbell,
  ChevronLeft, ChevronRight, CheckCircle2, Circle, Trophy,
  ChevronDown, ChevronUp, Timer, ClipboardEdit,
  Play, Pause, RotateCcw, X, MessageCircle, Send,
  Video, Upload, Loader2,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/Badge';
import { Table, Thead, Tbody, Th, Td, Tr } from '@/components/ui/Table';
import { workoutsApi, assignedWorkoutsApi } from '@/lib/api';

/* ── PR celebration overlay ──────────────────────────────────────── */
function PrCelebration({ workoutTitle, onClose }: { workoutTitle: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
      <div
        className="pointer-events-auto rounded-2xl px-8 py-6 text-center shadow-2xl max-w-xs mx-4 animate-bounce-once"
        style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a0a 100%)',
          border: '1px solid rgba(189,255,46,0.5)',
          boxShadow: '0 0 60px -10px rgba(189,255,46,0.6)',
        }}
      >
        <p className="text-4xl mb-2">🏆</p>
        <p className="font-black text-lg text-white">New PR!</p>
        <p className="text-sm text-white/70 mt-1">{workoutTitle}</p>
        <button
          onClick={onClose}
          className="mt-4 text-xs text-white/40 hover:text-white/60 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
import { formatDate, formatDuration } from '@/lib/utils';
import { useUserRole } from '@/hooks/useUserRole';

/* ================================================================ */
/*  HELPERS                                                          */
/* ================================================================ */

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function toMonthKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/* ================================================================ */
/*  ATHLETE CALENDAR VIEW                                            */
/* ================================================================ */

/* ── Timer label helpers ── */
function timerShort(t: any): string {
  if (!t) return '';
  switch (t.mode) {
    case 'amrap':     return `AMRAP ${t.timeCap ?? 20}min`;
    case 'for_time':  return `For Time${t.timeCap ? ` ${t.timeCap}min` : ''}`;
    case 'emom': {
      const iv = t.emomInterval ?? 1;
      return iv > 1 ? `E${iv}MOM ${t.emomMinutes ?? 20}min` : `EMOM ${t.emomMinutes ?? 20}min`;
    }
    case 'tabata':    return `Tabata ${t.tabataWork ?? 20}s/${t.tabataRest ?? 10}s×${t.tabataRounds ?? 8}`;
    case 'stopwatch': return 'Stopwatch';
    default: return 'Timer';
  }
}
function timerFull(t: any): string {
  if (!t) return '';
  switch (t.mode) {
    case 'amrap':     return `AMRAP · ${t.timeCap ?? 20} minutes`;
    case 'for_time':  return `For Time${t.timeCap ? ` · ${t.timeCap} min cap` : ''}`;
    case 'emom': {
      const iv = t.emomInterval ?? 1;
      const total = t.emomMinutes ?? 20;
      const rounds = Math.floor(total / iv);
      return iv > 1 ? `Every ${iv} min · ${total} min total (${rounds} rounds)` : `Every 1 min · ${total} min total (${rounds} rounds)`;
    }
    case 'tabata': {
      const w = t.tabataWork ?? 20, r = t.tabataRest ?? 10, rds = t.tabataRounds ?? 8;
      const sec = (w + r) * rds;
      const min = Math.floor(sec / 60), rem = sec % 60;
      return `${w}s work / ${r}s rest × ${rds} rounds (${min > 0 ? `${min}m${rem > 0 ? ` ${rem}s` : ''}` : `${sec}s`} total)`;
    }
    case 'stopwatch': return 'Stopwatch';
    default: return 'Timer';
  }
}

/* ── Web Audio beep (no files needed) ─────────────────────────── */
function playBeep(freq = 880, duration = 0.12, volume = 0.4) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
    osc.onended = () => ctx.close();
  } catch { /* browser blocked audio */ }
}
// Short tick for 3-2-1, longer higher beep for GO
const beepTick = () => playBeep(660, 0.12, 0.4);
const beepGo   = () => playBeep(1047, 0.5, 0.6);  // C6 — bright "GO!" tone

/* ── Timer Modal ─────────────────────────────────────────────────── */
function TimerModal({ timer, blockName, description, onClose }: {
  timer: any;
  blockName: string;
  description?: string;
  onClose: () => void;
}) {
  const mode: string = timer.mode;

  const totalRounds =
    mode === 'emom'    ? Math.floor((timer.emomMinutes ?? 20) / (timer.emomInterval ?? 1))
    : mode === 'tabata' ? (timer.tabataRounds ?? 8)
    : 1;

  const initTick = (ph: 'work' | 'rest' = 'work') => {
    switch (mode) {
      case 'amrap':     return (timer.timeCap ?? 20) * 60;
      case 'for_time':  return 0;
      case 'emom':      return (timer.emomInterval ?? 1) * 60;
      case 'tabata':    return ph === 'work' ? (timer.tabataWork ?? 20) : (timer.tabataRest ?? 10);
      case 'stopwatch': return 0;
      default:          return 0;
    }
  };

  const isCountup = mode === 'stopwatch' || mode === 'for_time';

  // ── lifecycle: idle → prestart (10s) → running → done
  const [preCount, setPreCount] = useState<number | null>(null); // null = not in pre-start
  const [tick, setTick]         = useState(() => initTick());
  const [round, setRound]       = useState(1);
  const [phase, setPhase]       = useState<'work' | 'rest'>('work');
  const [running, setRunning]   = useState(false);
  const [done, setDone]         = useState(false);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const preRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Pre-start countdown (10 → 1 → GO)
  useEffect(() => {
    if (preCount === null) return;
    if (preCount === 0) {
      beepGo();
      setPreCount(null);
      setRunning(true);
      return;
    }
    if (preCount <= 3) beepTick();
    preRef.current = setTimeout(() => setPreCount(c => (c ?? 1) - 1), 1000);
    return () => { if (preRef.current) clearTimeout(preRef.current); };
  }, [preCount]);

  // ── Main timer interval
  useEffect(() => {
    if (!running) { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setTick((prev: number) => isCountup ? prev + 1 : prev <= 1 ? -1 : prev - 1);
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running, isCountup]);

  // ── Sentinel: countdown hit 0
  useEffect(() => {
    if (tick !== -1) return;
    if (timerRef.current) clearInterval(timerRef.current);
    if (mode === 'amrap') {
      beepGo(); setDone(true); setRunning(false); setTick(0);
    } else if (mode === 'emom') {
      if (round >= totalRounds) { beepGo(); setDone(true); setRunning(false); setTick(0); }
      else { beepTick(); setRound(r => r + 1); setTick((timer.emomInterval ?? 1) * 60); }
    } else if (mode === 'tabata') {
      if (phase === 'work') {
        beepTick(); setPhase('rest'); setTick(timer.tabataRest ?? 10);
      } else {
        if (round >= totalRounds) { beepGo(); setDone(true); setRunning(false); setTick(0); }
        else { beepTick(); setRound(r => r + 1); setPhase('work'); setTick(timer.tabataWork ?? 20); }
      }
    }
  }, [tick]); // eslint-disable-line

  const reset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (preRef.current)   clearTimeout(preRef.current);
    setRunning(false); setDone(false); setPreCount(null);
    setRound(1); setPhase('work'); setTick(initTick('work'));
  };

  const handleStartPause = () => {
    if (done) return;
    if (preCount !== null) { // cancel pre-start
      if (preRef.current) clearTimeout(preRef.current);
      setPreCount(null);
      return;
    }
    if (running) {
      setRunning(false); // pause
    } else {
      setPreCount(10); // kick off pre-start countdown
    }
  };

  const fmt = (s: number) => {
    const v = Math.max(0, s);
    return `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`;
  };

  const modeLabel =
    mode === 'amrap'    ? `AMRAP · ${timer.timeCap ?? 20} min`
    : mode === 'for_time' ? `For Time${timer.timeCap ? ` · ${timer.timeCap}min cap` : ''}`
    : mode === 'emom'     ? `${(timer.emomInterval ?? 1) > 1 ? `E${timer.emomInterval}MOM` : 'EMOM'} · ${timer.emomMinutes ?? 20}min`
    : mode === 'tabata'   ? 'Tabata'
    : 'Stopwatch';

  const bg =
    done                              ? 'from-emerald-900 to-emerald-800'
    : preCount !== null               ? 'from-slate-800 to-slate-900'
    : mode === 'tabata' && phase === 'rest' ? 'from-blue-900 to-blue-800'
    : mode === 'tabata'               ? 'from-red-900 to-red-800'
    : 'from-slate-900 to-slate-800';

  const pct =
    mode === 'amrap'                       ? (tick / ((timer.timeCap ?? 20) * 60)) * 100
    : mode === 'emom'                      ? (tick / ((timer.emomInterval ?? 1) * 60)) * 100
    : mode === 'tabata' && phase === 'work' ? (tick / (timer.tabataWork ?? 20)) * 100
    : mode === 'tabata'                    ? (tick / (timer.tabataRest ?? 10)) * 100
    : null;

  const isPrestart = preCount !== null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-gradient-to-b ${bg} rounded-2xl shadow-2xl w-full max-w-sm text-white overflow-hidden transition-colors duration-500`}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-0.5">{modeLabel}</p>
            <p className="font-bold text-white text-sm leading-tight">{blockName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Progress bar (main timer only) */}
        {!isPrestart && pct != null && (
          <div className="px-5 pb-2">
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-white/50 rounded-full transition-all duration-1000"
                style={{ width: `${Math.max(0, pct)}%` }} />
            </div>
          </div>
        )}

        {/* Pre-start countdown overlay */}
        {isPrestart ? (
          <div className="flex flex-col items-center py-12 px-5 gap-3">
            <p className="text-white/50 text-sm font-semibold uppercase tracking-widest">Get Ready</p>
            <p className={`font-mono font-black tabular-nums transition-all ${
              preCount! <= 3 ? 'text-8xl text-yellow-300' : 'text-7xl text-white/80'
            }`}>
              {preCount}
            </p>
            <p className="text-white/30 text-xs">
              {preCount! > 3 ? 'timer starts soon…' : preCount === 1 ? 'last one!' : 'almost…'}
            </p>
          </div>
        ) : (
          /* Main display */
          <div className="flex flex-col items-center py-10 px-5 gap-4">
            {(mode === 'emom' || mode === 'tabata') && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-white/60">
                  Round {round} / {totalRounds}
                </span>
                {mode === 'tabata' && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    phase === 'work' ? 'bg-red-500/30 text-red-200' : 'bg-blue-500/30 text-blue-200'
                  }`}>
                    {phase === 'work' ? '🔥 WORK' : '💨 REST'}
                  </span>
                )}
              </div>
            )}

            <p className={`font-mono font-black tabular-nums tracking-tight transition-all ${
              done ? 'text-5xl text-emerald-300' : 'text-7xl'
            }`}>
              {done ? '🎉 Done!' : fmt(tick)}
            </p>

            {(mode === 'for_time' || mode === 'stopwatch') && !done && (
              <p className="text-white/30 text-xs">
                {mode === 'for_time' && timer.timeCap ? `cap: ${fmt(timer.timeCap * 60)}` : 'counting up'}
              </p>
            )}

            {/* Workout instructions — always visible while timer runs */}
            {description && (
              <div className="w-full mt-2 bg-white/8 border border-white/10 rounded-xl px-4 py-3">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Workout</p>
                <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{description}</p>
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3 px-5 pb-6">
          <button
            onClick={handleStartPause}
            disabled={done}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm bg-white text-slate-900 hover:bg-white/90 disabled:opacity-50 transition-colors"
          >
            {done          ? <>✓ Finished</>
             : isPrestart  ? <><X size={15} /> Cancel</>
             : running     ? <><Pause size={16} /> Pause</>
             :               <><Play  size={16} /> Start</>}
          </button>
          <button onClick={reset}
            className="px-5 py-3.5 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center">
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Workout card — self-contained state for per-block interaction ── */
function WorkoutCard({ w, onSaved }: { w: any; onSaved: () => void }) {
  const blocks: any[] = w.blocks ?? [];
  const hasBlocks = blocks.length > 0;
  // localIsDone is local state so that a React Query refetch (triggered by
  // onSaved → invalidateQueries) never flips the card to read-only while the
  // athlete is still interacting. The card only goes read-only if it was
  // already completed when it first mounted (i.e. from a previous session).
  const [localIsDone] = useState(w.status === 'completed');

  // Per-block state: expanded, checked (done), showLog, result, scalingChoice
  const [blockStates, setBlockStates] = useState<{
    expanded: boolean;
    checked: boolean;
    showLog: boolean;
    result: string;
    scalingChoice: string;
  }[]>(() => blocks.map(() => ({ expanded: false, checked: false, showLog: false, result: '', scalingChoice: '' })));

  const [activeTimer, setActiveTimer] = useState<{ timer: any; blockName: string; description?: string } | null>(null);
  const [notes, setNotes] = useState('');
  const [singleResult, setSingleResult] = useState('');
  const [showSingleLog, setShowSingleLog] = useState(false);
  const [prCelebration, setPrCelebration] = useState(false);
  const [rankInfo, setRankInfo] = useState<{ rank: number; total: number } | null>(null);

  // Auto-save state — replaces the manual submit button
  const [autoSaving, setAutoSaving] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const [autoError, setAutoError] = useState('');

  // Comments state (completed workouts only)
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  // Video upload state (completed workouts only)
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoError, setVideoError] = useState('');
  const [showVideo, setShowVideo] = useState(false);
  // Local flag so we know a video was just uploaded this session
  const [hasVideoLocal, setHasVideoLocal] = useState(!!w.video_url);

  // Fetch signed view URL only when the user wants to watch
  const { data: viewUrlData, isFetching: viewUrlLoading } = useQuery({
    queryKey: ['video-view-url', w.id],
    queryFn: () => assignedWorkoutsApi.getVideoViewUrl(w.id),
    enabled: showVideo && hasVideoLocal,
    staleTime: 50 * 60_000, // URL is valid 60 min, cache 50 min
  });

  const handleVideoFile = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      setVideoError('Please select a video file.');
      return;
    }
    setVideoError('');
    setVideoUploading(true);
    try {
      const { uploadUrl, path } = await assignedWorkoutsApi.getVideoUploadUrl(w.id, file.name);
      // Upload directly from browser to Supabase Storage using the signed URL
      const res = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
      await assignedWorkoutsApi.saveVideoUrl(w.id, path);
      setHasVideoLocal(true);
      setShowVideo(true);
    } catch (e: any) {
      setVideoError(e?.message ?? 'Upload failed. Please try again.');
    } finally {
      setVideoUploading(false);
    }
  };

  // Previous result — fetch silently for pending workouts so athlete knows their baseline
  const { data: prevData } = useQuery({
    queryKey: ['prev-result', w.title],
    queryFn: () => assignedWorkoutsApi.getPreviousResult(w.title),
    enabled: !localIsDone,
    staleTime: 5 * 60_000,
  });
  const prevResult: any = prevData?.data ?? null;

  // Comments
  const { data: commentsData, refetch: refetchComments } = useQuery({
    queryKey: ['workout-comments', w.id],
    queryFn: () => assignedWorkoutsApi.getComments(w.id),
    enabled: showComments && localIsDone,
    staleTime: 30_000,
  });
  const comments: any[] = commentsData?.data ?? [];

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => assignedWorkoutsApi.addComment(w.id, content),
    onSuccess: () => { setCommentText(''); refetchComments(); },
  });

  const update = (i: number, patch: Partial<typeof blockStates[0]>) =>
    setBlockStates(prev => { const n = [...prev]; n[i] = { ...n[i], ...patch }; return n; });

  const checkedCount = blockStates.filter(b => b.checked).length;

  // Auto-save: called immediately whenever a block is checked/unchecked.
  // Accepts the latest state explicitly so we never read stale closure values.
  const autoSave = async (
    latestBlockStates: typeof blockStates,
    latestNotes: string,
    latestSingleResult: string,
  ) => {
    const checkedBlocks = latestBlockStates.filter(b => b.checked);
    // Nothing checked and no single result — nothing to save yet
    if (hasBlocks && checkedBlocks.length === 0) return;
    if (!hasBlocks && !latestSingleResult.trim()) return;

    const dto: any = { notes: latestNotes.trim() || undefined };
    if (hasBlocks) {
      dto.blockResults = latestBlockStates
        .map((bs, i) => ({
          blockIndex: i,
          result: bs.result.trim() || '✓',
          ...(bs.scalingChoice ? { scalingChoice: bs.scalingChoice } : {}),
        }))
        .filter((_, i) => latestBlockStates[i].checked);
    } else {
      dto.result = latestSingleResult.trim();
    }

    try {
      setAutoSaving(true);
      setAutoError('');
      const res = await assignedWorkoutsApi.logResult(w.id, dto);
      if (res?.newPr) setPrCelebration(true);
      if (res?.rank && res?.totalCompleted && res.totalCompleted > 1) {
        setRankInfo({ rank: res.rank, total: res.totalCompleted });
      }
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 2000);
      onSaved(); // refresh calendar dots — safe now because localIsDone is local state
    } catch (e: any) {
      setAutoError(e?.response?.data?.message ?? 'Failed to save');
    } finally {
      setAutoSaving(false);
    }
  };

  return (
    <>
    {activeTimer && (
      <TimerModal
        timer={activeTimer.timer}
        blockName={activeTimer.blockName}
        description={activeTimer.description}
        onClose={() => setActiveTimer(null)}
      />
    )}
    {prCelebration && (
      <PrCelebration workoutTitle={w.title} onClose={() => setPrCelebration(false)} />
    )}
    <div className={`rounded-xl border overflow-hidden ${localIsDone ? 'border-emerald-200' : 'border-slate-200'}`}>
      {/* ── Workout header ── */}
      <div className={`flex items-center gap-3 px-4 py-3 ${localIsDone ? 'bg-emerald-50' : 'bg-white'}`}>
        {/* Checkmark — static when done, clickable "mark all done" toggle when pending */}
        {localIsDone ? (
          <CheckCircle2 size={22} className="text-emerald-500 shrink-0" />
        ) : hasBlocks ? (
          <button
            title={blockStates.every(b => b.checked) ? 'Unmark all done' : 'Mark all done'}
            disabled={autoSaving}
            onClick={() => {
              const allChecked = blockStates.every(b => b.checked);
              const newStates = blockStates.map(bs => ({ ...bs, checked: !allChecked }));
              setBlockStates(newStates);
              autoSave(newStates, notes, singleResult);
            }}
            className={`shrink-0 rounded-full transition-all disabled:opacity-60 ${
              blockStates.every(b => b.checked)
                ? 'text-emerald-500 hover:text-emerald-600'
                : 'text-slate-300 hover:text-emerald-400'
            }`}
          >
            <CheckCircle2 size={22} strokeWidth={blockStates.every(b => b.checked) ? 2.5 : 1.8} />
          </button>
        ) : (
          <Circle size={22} className="text-slate-300 shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900">{w.title}</p>
          {w.description && <p className="text-xs text-slate-500 mt-0.5">{w.description}</p>}
        </div>

        {/* Progress + save indicators (pending workouts with blocks) */}
        {!localIsDone && hasBlocks && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-slate-400 font-medium tabular-nums">
              {checkedCount}/{blocks.length}
            </span>
            {autoSaving && <span className="text-[10px] text-slate-400 animate-pulse">Saving…</span>}
            {autoSaved && !autoSaving && <span className="text-[10px] text-emerald-500 font-semibold">✓</span>}
            {autoError && <span className="text-[10px] text-red-500">!</span>}
          </div>
        )}

        <Badge variant={localIsDone ? 'success' : 'default'}>{localIsDone ? 'Completed' : 'Pending'}</Badge>
      </div>

      {/* ── Previous result banner (pending workouts only) ── */}
      {!localIsDone && prevResult?.athlete_result && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-t border-amber-100">
          <Clock size={12} className="text-amber-600 shrink-0" />
          <p className="text-xs text-amber-800">
            <span className="font-semibold">Last time:</span>{' '}
            {prevResult.athlete_result}
            <span className="text-amber-600 ml-1">
              · {new Date(prevResult.scheduled_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </p>
        </div>
      )}

      {/* ── Blocks ── */}
      {hasBlocks && (
        <div className="divide-y divide-slate-100 border-t border-slate-100">
          {blocks.map((block: any, i: number) => {
            const bs = blockStates[i];
            const hasDetails = !!(block.description || block.timer || block.videoUrl);
            return (
              <div key={i} className={`${bs.checked ? 'bg-emerald-50/60' : 'bg-white'}`}>
                {/* Block row */}
                <div className="flex items-center gap-2 px-4 py-3">
                  {/* Index badge */}
                  <span className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${
                    bs.checked ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {bs.checked ? '✓' : i + 1}
                  </span>

                  {/* Name + badges */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${bs.checked ? 'text-emerald-800 line-through decoration-emerald-400' : 'text-slate-800'}`}>
                      {block.name}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {block.timer && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                          <Timer size={8} />{timerShort(block.timer)}
                        </span>
                      )}
                      {block.scoreType && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500 capitalize">
                          {block.scoreType}
                        </span>
                      )}
                      {block.isTracked && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary-100 text-primary-700">
                          Tracked
                        </span>
                      )}
                      {bs.scalingChoice && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          bs.scalingChoice === 'rxPlus' ? 'bg-purple-100 text-purple-700'
                          : bs.scalingChoice === 'rx'   ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                        }`}>
                          {bs.scalingChoice === 'rxPlus' ? 'RX+' : bs.scalingChoice === 'rx' ? 'RX' : 'Scaled'}
                        </span>
                      )}
                      {bs.result && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                          {bs.result}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {!localIsDone && (
                    <div className="flex items-center gap-1 shrink-0">
                      {block.timer && (
                        <button
                          onClick={() => setActiveTimer({ timer: block.timer, blockName: block.name, description: block.description })}
                          title="Start timer"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors"
                        >
                          <Play size={11} />
                          Timer
                        </button>
                      )}
                      <button
                        onClick={() => update(i, { showLog: !bs.showLog })}
                        title="Log result"
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          bs.showLog
                            ? 'bg-primary-100 text-primary-700'
                            : 'text-slate-400 hover:text-primary-600 hover:bg-primary-50'
                        }`}
                      >
                        <ClipboardEdit size={13} />
                        Log
                      </button>
                      <button
                        onClick={() => {
                          const newStates = blockStates.map((s, j) =>
                            j === i ? { ...s, checked: !s.checked } : s
                          );
                          setBlockStates(newStates);
                          autoSave(newStates, notes, singleResult);
                        }}
                        title={bs.checked ? 'Unmark as done' : 'Mark as done'}
                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${
                          bs.checked
                            ? 'bg-emerald-500 text-white shadow-sm hover:bg-emerald-600'
                            : 'border-2 border-slate-200 text-slate-300 hover:border-emerald-400 hover:text-emerald-400'
                        }`}
                      >
                        <CheckCircle2 size={17} strokeWidth={bs.checked ? 2.5 : 1.8} />
                      </button>
                      {hasDetails && (
                        <button
                          onClick={() => update(i, { expanded: !bs.expanded })}
                          className="p-1 text-slate-300 hover:text-slate-500 transition-colors"
                        >
                          {bs.expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Completed view — show logged result + scaling choice */}
                  {localIsDone && w.block_results && (() => {
                    const br = (w.block_results as any[]).find((br: any) => br.blockIndex === i);
                    if (!br) return null;
                    const scalingColors: Record<string, string> = {
                      rxPlus: 'bg-purple-100 text-purple-700',
                      rx: 'bg-emerald-100 text-emerald-700',
                      scaled: 'bg-amber-100 text-amber-700',
                    };
                    const scalingLabels: Record<string, string> = { rxPlus: 'RX+', rx: 'RX', scaled: 'Scaled' };
                    return (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {br.scalingChoice && scalingLabels[br.scalingChoice] && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${scalingColors[br.scalingChoice] ?? ''}`}>
                            {scalingLabels[br.scalingChoice]}
                          </span>
                        )}
                        {br.result && <span className="text-xs text-emerald-600 font-medium">{br.result}</span>}
                      </div>
                    );
                  })()}
                </div>

                {/* Log result input */}
                {!localIsDone && bs.showLog && (
                  <div className="px-4 pb-3 space-y-2">
                    {/* Scaling choice tabs — shown only when the block has scaling options */}
                    {block.scaling && (block.scaling.rxPlus || block.scaling.rx || block.scaling.scaled) && (
                      <div className="flex gap-1.5 flex-wrap">
                        {([
                          { key: 'rxPlus', label: '⚡ RX+', active: 'bg-purple-600 text-white', inactive: 'bg-purple-50 text-purple-700 border-purple-200', desc: block.scaling.rxPlus },
                          { key: 'rx',     label: '✅ RX',  active: 'bg-emerald-600 text-white', inactive: 'bg-emerald-50 text-emerald-700 border-emerald-200', desc: block.scaling.rx },
                          { key: 'scaled', label: '🔧 Scaled', active: 'bg-amber-500 text-white', inactive: 'bg-amber-50 text-amber-700 border-amber-200', desc: block.scaling.scaled },
                        ] as const).filter(opt => !!opt.desc).map(opt => (
                          <div key={opt.key} className="flex flex-col gap-0.5 min-w-0">
                            <button
                              type="button"
                              onClick={() => update(i, { scalingChoice: bs.scalingChoice === opt.key ? '' : opt.key })}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                                bs.scalingChoice === opt.key ? opt.active + ' border-transparent' : opt.inactive + ' border'
                              }`}
                            >
                              {opt.label}
                            </button>
                            {opt.desc && (
                              <p className="text-[10px] text-slate-400 px-0.5 truncate max-w-[120px]" title={opt.desc}>
                                {opt.desc}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <input
                      autoFocus
                      value={bs.result}
                      onChange={(e) => update(i, { result: e.target.value })}
                      placeholder={
                        block.scoreType === 'time'   ? 'e.g. 4:32'
                        : block.scoreType === 'weight' ? 'e.g. 100 kg'
                        : block.scoreType === 'reps'   ? 'e.g. 45 reps'
                        : block.scoreType === 'rounds' ? 'e.g. 5 rounds + 12 reps'
                        : 'e.g. 12:30, 15 reps, 100 kg…'
                      }
                      className="w-full px-3 py-2 text-sm border border-primary-300 bg-primary-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                )}

                {/* Expanded details */}
                {bs.expanded && hasDetails && (
                  <div className="mx-4 mb-3 rounded-lg border border-slate-200 overflow-hidden">
                    {block.timer && (
                      <div className="flex items-start gap-2 bg-amber-50 px-3 py-2 border-b border-amber-100">
                        <Timer size={13} className="text-amber-700 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">Timer</p>
                          <p className="text-sm font-semibold text-amber-900">{timerFull(block.timer)}</p>
                        </div>
                      </div>
                    )}
                    {block.description && (
                      <div className="bg-white px-3 py-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Instructions</p>
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{block.description}</p>
                      </div>
                    )}
                    {block.videoUrl && (
                      <div className="bg-white px-3 pb-2">
                        <a href={block.videoUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline font-medium">
                          📹 Watch demo
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── No blocks — single result input (auto-saves on blur) ── */}
      {!hasBlocks && !localIsDone && (
        <div className="border-t border-slate-100 px-4 py-3 bg-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Your result</p>
            <div className="flex items-center gap-2">
              {autoSaving && <span className="text-[10px] text-slate-400 animate-pulse">Saving…</span>}
              {autoSaved && !autoSaving && <span className="text-[10px] text-emerald-500 font-semibold">✓ Saved</span>}
              <button onClick={() => setShowSingleLog(v => !v)}
                className="text-xs text-primary-600 hover:text-primary-800 font-semibold">
                {showSingleLog ? 'Hide' : 'Log result'}
              </button>
            </div>
          </div>
          {showSingleLog && (
            <input
              autoFocus
              value={singleResult}
              onChange={(e) => setSingleResult(e.target.value)}
              onBlur={() => autoSave(blockStates, notes, singleResult)}
              placeholder="e.g. 12:30 Rx, 150 reps…"
              className="w-full px-3 py-2 text-sm border border-primary-300 bg-primary-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          )}
          {autoError && <p className="text-xs text-red-500 mt-1">{autoError}</p>}
        </div>
      )}

      {/* ── Notes footer — auto-saves on blur, no submit button needed ── */}
      {!localIsDone && (
        <div className="border-t border-slate-100 px-4 py-3 bg-slate-50">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => autoSave(blockStates, notes, singleResult)}
            placeholder="Notes (optional) — how did it feel? Any mods?"
            rows={1}
            className="w-full px-3 py-2 text-sm border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>
      )}

      {/* ── Completed result summary ── */}
      {localIsDone && w.athlete_result && (
        <div className="border-t border-emerald-200 px-4 py-3 bg-emerald-50">
          <div className="flex items-center gap-2">
            <Trophy size={14} className="text-emerald-600 shrink-0" />
            <p className="text-sm font-semibold text-emerald-700">{w.athlete_result}</p>
            {rankInfo && (
              <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                #{rankInfo.rank} of {rankInfo.total}
              </span>
            )}
          </div>
          {w.athlete_notes && (
            <p className="text-xs text-slate-500 mt-1 italic">{w.athlete_notes}</p>
          )}
        </div>
      )}

      {/* ── Video upload section (completed workouts) ── */}
      {localIsDone && (
        <div className="border-t border-slate-100 px-4 py-3 bg-white">
          {/* Hidden file input */}
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleVideoFile(file);
              e.target.value = '';
            }}
          />

          <div className="flex items-center gap-2">
            <Video size={13} className="text-slate-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-500 flex-1">Workout Video</span>

            {hasVideoLocal ? (
              <button
                onClick={() => setShowVideo(v => !v)}
                className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-800 transition-colors"
              >
                {viewUrlLoading
                  ? <Loader2 size={12} className="animate-spin" />
                  : <Play size={12} />}
                {showVideo ? 'Hide video' : 'Watch video'}
              </button>
            ) : (
              <button
                onClick={() => videoInputRef.current?.click()}
                disabled={videoUploading}
                className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-primary-600 transition-colors disabled:opacity-50"
              >
                {videoUploading
                  ? <><Loader2 size={12} className="animate-spin" /> Uploading…</>
                  : <><Upload size={12} /> Attach video</>}
              </button>
            )}

            {/* Replace video after upload */}
            {hasVideoLocal && !showVideo && (
              <button
                onClick={() => videoInputRef.current?.click()}
                disabled={videoUploading}
                title="Replace video"
                className="text-[10px] text-slate-300 hover:text-slate-500 transition-colors disabled:opacity-50"
              >
                {videoUploading ? <Loader2 size={10} className="animate-spin inline" /> : 'replace'}
              </button>
            )}
          </div>

          {videoError && (
            <p className="text-xs text-red-600 mt-1">{videoError}</p>
          )}

          {/* Inline video player */}
          {showVideo && viewUrlData?.viewUrl && (
            <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 bg-black">
              <video
                src={viewUrlData.viewUrl}
                controls
                className="w-full max-h-56 object-contain"
              />
            </div>
          )}
        </div>
      )}

      {/* ── Comments section (completed workouts) ── */}
      {localIsDone && (
        <div className="border-t border-slate-100">
          <button
            onClick={() => setShowComments(v => !v)}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <MessageCircle size={13} />
            {showComments
              ? 'Hide comments'
              : comments.length > 0
              ? `${comments.length} comment${comments.length !== 1 ? 's' : ''}`
              : 'Add a comment'}
            <ChevronDown size={12} className={`ml-auto transition-transform ${showComments ? 'rotate-180' : ''}`} />
          </button>

          {showComments && (
            <div className="px-4 pb-4 space-y-3 bg-slate-50/50">
              {/* Comment list */}
              {comments.length > 0 && (
                <div className="space-y-2 pt-1">
                  {comments.map((c: any) => (
                    <div key={c.id} className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {(c.author?.name ?? '?')[0]}
                      </div>
                      <div className="flex-1 min-w-0 bg-white rounded-lg px-3 py-2 border border-slate-100">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-semibold text-slate-700">{c.author?.name ?? 'Unknown'}</span>
                          {c.author?.role === 'coach' && (
                            <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-primary-100 text-primary-700 uppercase tracking-wider">
                              Coach
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 ml-auto">
                            {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add comment input */}
              <div className="flex gap-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && commentText.trim()) {
                      e.preventDefault();
                      addCommentMutation.mutate(commentText.trim());
                    }
                  }}
                  placeholder="Leave a comment…"
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={() => commentText.trim() && addCommentMutation.mutate(commentText.trim())}
                  disabled={!commentText.trim() || addCommentMutation.isPending}
                  className="p-2 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white transition-colors"
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}

function AthleteCalendarView() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string>(
    toDateStr(today.getFullYear(), today.getMonth(), today.getDate()),
  );

  const monthKey = toMonthKey(viewYear, viewMonth);
  const qc = useQueryClient();

  // Fetch all workouts for the current month (for dots)
  const { data: monthData, isLoading: monthLoading } = useQuery({
    queryKey: ['assigned-month', monthKey],
    queryFn: () => assignedWorkoutsApi.getMyMonth(monthKey),
  });

  const monthWorkouts: any[] = monthData?.data ?? [];

  // Map date → workouts for fast lookup
  const workoutsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const w of monthWorkouts) {
      const d = w.scheduled_date;
      if (!map[d]) map[d] = [];
      map[d].push(w);
    }
    return map;
  }, [monthWorkouts]);

  // Workouts for the selected day
  const selectedWorkouts = workoutsByDate[selectedDate] ?? [];

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDow = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [
      ...Array(firstDow).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    // Pad to full weeks
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewYear, viewMonth]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* ── Calendar panel ── */}
      <div className="xl:w-96 bg-white rounded-xl border border-slate-200 shadow-sm shrink-0">
        {/* Month/Year nav */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-2">
            <select
              value={viewMonth}
              onChange={(e) => setViewMonth(Number(e.target.value))}
              className="text-sm font-semibold text-slate-900 bg-transparent border-0 focus:outline-none cursor-pointer"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
            <select
              value={viewYear}
              onChange={(e) => setViewYear(Number(e.target.value))}
              className="text-sm font-semibold text-slate-900 bg-transparent border-0 focus:outline-none cursor-pointer"
            >
              {Array.from({ length: 6 }, (_, i) => today.getFullYear() - 1 + i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 px-4 pt-3">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-slate-400 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 px-4 pb-4 gap-y-1">
          {calendarDays.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />;
            const dateStr = toDateStr(viewYear, viewMonth, day);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const hasWorkouts = !!workoutsByDate[dateStr]?.length;
            const allDone = hasWorkouts && workoutsByDate[dateStr].every(w => w.status === 'completed');

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`
                  relative flex flex-col items-center justify-center h-10 w-full rounded-lg text-sm font-medium transition-colors
                  ${isSelected
                    ? 'bg-primary-600 text-white'
                    : isToday
                    ? 'bg-primary-50 text-primary-700 ring-2 ring-primary-300'
                    : 'text-slate-700 hover:bg-slate-100'}
                `}
              >
                {day}
                {hasWorkouts && (
                  <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                    isSelected ? 'bg-white' : allDone ? 'bg-emerald-500' : 'bg-primary-500'
                  }`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary-500 inline-block" />
            Pending
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Done
          </div>
        </div>
      </div>

      {/* ── Day detail panel ── */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
            })}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {selectedWorkouts.length === 0
              ? 'No workouts assigned'
              : `${selectedWorkouts.length} workout${selectedWorkouts.length !== 1 ? 's' : ''} assigned`}
          </p>
        </div>

        <div className="p-5">
          {monthLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : selectedWorkouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
                <Dumbbell size={24} className="text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">Rest day</p>
              <p className="text-sm text-slate-400">No workouts scheduled for this day.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedWorkouts.map((w: any) => (
                <WorkoutCard
                  key={w.id}
                  w={w}
                  onSaved={() => qc.invalidateQueries({ queryKey: ['assigned-month', monthKey] })}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================ */
/*  COACH TABLE VIEW                                                 */
/* ================================================================ */

function CoachWorkoutsView() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('all');

  const now = new Date();
  const startDate =
    filter === 'week'
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).toISOString().split('T')[0]
      : filter === 'month'
      ? new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      : undefined;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-workouts', filter],
    queryFn: () => workoutsApi.feed({ limit: 100, ...(startDate ? { startDate } : {}) }),
  });

  const deleteMutation = useMutation({
    mutationFn: workoutsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-workouts'] }),
  });

  const workouts = (data?.data ?? []).filter((w: any) =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.user?.name?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workouts or users…"
            className="pl-9 pr-4 py-2 w-full text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1">
          {(['all', 'week', 'month'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-colors ${
                filter === f ? 'bg-primary-600 text-white' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f === 'all' ? 'All time' : `This ${f}`}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <Thead>
            <tr>
              <Th>Workout</Th>
              <Th>User</Th>
              <Th>Date</Th>
              <Th>Duration</Th>
              <Th>Exercises</Th>
              <Th>Tags</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              <Tr><Td className="py-12 text-center text-slate-400" colSpan={7 as any}>Loading…</Td></Tr>
            ) : workouts.length === 0 ? (
              <Tr><Td className="py-12 text-center text-slate-400" colSpan={7 as any}>No workouts found</Td></Tr>
            ) : (
              workouts.map((w: any) => (
                <Tr key={w.id}>
                  <Td><p className="font-medium text-slate-900">{w.name}</p></Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                        {w.user?.name?.[0] ?? '?'}
                      </div>
                      <span className="text-slate-600">{w.user?.name ?? 'Unknown'}</span>
                    </div>
                  </Td>
                  <Td>
                    <span className="text-slate-500 text-xs">
                      {w.completed_at ? formatDate(w.completed_at) : formatDate(w.started_at)}
                    </span>
                  </Td>
                  <Td>
                    {w.duration ? (
                      <div className="flex items-center gap-1 text-slate-500 text-xs">
                        <Clock size={12} />{formatDuration(w.duration)}
                      </div>
                    ) : <span className="text-slate-300">—</span>}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1 text-slate-500 text-xs">
                      <Dumbbell size={12} />
                      {typeof w.exercises === 'object' && !Array.isArray(w.exercises)
                        ? w.exercises?.count ?? '—'
                        : w.exercises?.length ?? '—'}
                    </div>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {(w.tags ?? []).slice(0, 2).map((tag: string) => (
                        <Badge key={tag} variant="default">{tag}</Badge>
                      ))}
                    </div>
                  </Td>
                  <Td className="text-right">
                    <button
                      onClick={() => {
                        if (confirm(`Delete workout "${w.name}"?`)) deleteMutation.mutate(w.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
        <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
          {workouts.length} workout{workouts.length !== 1 ? 's' : ''}
        </div>
      </div>
    </>
  );
}

/* ================================================================ */
/*  PAGE                                                             */
/* ================================================================ */

export default function WorkoutsPage() {
  const { role } = useUserRole();
  const isCoach = role === 'coach';

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title={isCoach ? 'Workouts' : 'My Plan'}
        subtitle={isCoach ? 'All public workout logs' : 'Your assigned workout calendar'}
      />
      <main className="flex-1 p-6 overflow-y-auto">
        {isCoach ? <CoachWorkoutsView /> : <AthleteCalendarView />}
      </main>
    </div>
  );
}
