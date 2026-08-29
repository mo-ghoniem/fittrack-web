'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Trash2, Loader2, ClipboardList, ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  Users, X, Check, PlusCircle, Send, ArrowLeft, Calendar,
  Edit2, MoreHorizontal, BarChart2, Copy,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { CoachGuard } from '@/components/layout/CoachGuard';
import { Badge } from '@/components/ui/Badge';
import { templatesApi, coachingApi } from '@/lib/api';

/* ═══════════════════════════════════════════════════════════════
   DATE HELPERS
═══════════════════════════════════════════════════════════════ */
const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];
const WEEKDAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const WEEKDAYS_LONG  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function addDays(d: Date, n: number) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}
function diffDays(a: Date, b: Date) {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}
function startOfWeek(d: Date) {
  const r = new Date(d); r.setDate(r.getDate() - r.getDay()); return r;
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}
function formatDisplayDate(d: Date) {
  return d.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });
}
function formatShortDate(d: Date) {
  return d.toLocaleDateString('en-US', { month:'short', day:'numeric' });
}

// Day index relative to program start (1-based)
function dateToDayIndex(date: Date, programStart: Date) {
  return diffDays(date, programStart) + 1;
}
function dayIndexToDate(dayIndex: number, programStart: Date) {
  return addDays(programStart, dayIndex - 1);
}

/* ═══════════════════════════════════════════════════════════════
   EVENT COLORS (cycling palette like Google Calendar)
═══════════════════════════════════════════════════════════════ */
const EVENT_COLORS = [
  'bg-blue-500',    'bg-emerald-500', 'bg-violet-500',
  'bg-orange-500',  'bg-rose-500',    'bg-cyan-500',
  'bg-amber-500',   'bg-indigo-500',
];
function eventColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return EVENT_COLORS[h % EVENT_COLORS.length];
}

/* ═══════════════════════════════════════════════════════════════
   BLOCK EDITOR
═══════════════════════════════════════════════════════════════ */

type TimerMode = 'amrap' | 'emom' | 'tabata' | 'for_time' | 'stopwatch';

interface TimerConfig {
  mode: TimerMode;
  /** Minutes for AMRAP / For Time time cap (default 20) */
  timeCap?: number;
  /** Total minutes for EMOM (default 20) */
  emomMinutes?: number;
  /** Minutes per EMOM round/interval (default 1, e.g. 2 = every 2 min) */
  emomInterval?: number;
  /** Tabata work duration in seconds (default 20) */
  tabataWork?: number;
  /** Tabata rest duration in seconds (default 10) */
  tabataRest?: number;
  /** Number of Tabata rounds (default 8) */
  tabataRounds?: number;
}

interface BlockScaling {
  rx?: string;     // Standard / As Prescribed
  scaled?: string; // Scaled / Modification
  rxPlus?: string; // Elite / RX+
}

interface Block {
  name: string;
  description: string;
  videoUrl: string;
  isTracked?: boolean;
  scoreType?: 'weight' | 'time' | 'reps' | 'rounds';
  timer?: TimerConfig;
  scaling?: BlockScaling;
}

const SCORE_TYPE_OPTIONS: { value: Block['scoreType']; label: string }[] = [
  { value: 'weight', label: 'Weight (kg)' },
  { value: 'time',   label: 'Time (fastest)' },
  { value: 'reps',   label: 'Reps (most)' },
  { value: 'rounds', label: 'Rounds (most)' },
];

const TIMER_MODE_OPTIONS: { value: TimerMode; label: string; icon: string; hint: string }[] = [
  { value: 'amrap',     label: 'AMRAP',      icon: '🔄', hint: 'Countdown from time cap' },
  { value: 'emom',      label: 'EMOM',       icon: '⏱️', hint: 'Every Minute On the Minute' },
  { value: 'tabata',    label: 'Tabata',     icon: '🔥', hint: '20s work / 10s rest × 8' },
  { value: 'for_time',  label: 'For Time',   icon: '⚡', hint: 'Count up with optional cap' },
  { value: 'stopwatch', label: 'Stopwatch',  icon: '🕐', hint: 'Simple stopwatch' },
];

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
        checked ? 'bg-primary-600 border-primary-600' : 'border-slate-300 hover:border-primary-400'
      }`}
    >
      {checked && <Check size={10} className="text-white" />}
    </button>
  );
}

function BlockEditor({ blocks, onChange }: { blocks: Block[]; onChange:(b:Block[])=>void }) {
  function update(i: number, patch: Partial<Block>) {
    const b = [...blocks];
    b[i] = { ...b[i], ...patch };
    onChange(b);
  }

  function updateTimer(i: number, patch: Partial<TimerConfig>) {
    const existing = blocks[i].timer ?? { mode: 'amrap', timeCap: 20 };
    update(i, { timer: { ...existing, ...patch } });
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        const hasTimer = !!block.timer;
        const timerMode = block.timer?.mode ?? 'amrap';
        const modeInfo = TIMER_MODE_OPTIONS.find(m => m.value === timerMode)!;

        return (
          <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            {/* Block header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Block {i+1}</span>
                {block.isTracked && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary-100 text-primary-700 border border-primary-200">
                    <BarChart2 size={9}/> Tracked
                  </span>
                )}
                {hasTimer && (() => {
                  let detail = '';
                  if (timerMode === 'amrap' || timerMode === 'for_time') {
                    detail = ` · ${block.timer?.timeCap ?? 20} min`;
                  } else if (timerMode === 'emom') {
                    const interval = block.timer?.emomInterval ?? 1;
                    const total    = block.timer?.emomMinutes  ?? 20;
                    detail = interval > 1
                      ? ` · E${interval}MOM · ${total} min`
                      : ` · ${total} min`;
                  } else if (timerMode === 'tabata') {
                    const w = block.timer?.tabataWork   ?? 20;
                    const r = block.timer?.tabataRest   ?? 10;
                    const n = block.timer?.tabataRounds ?? 8;
                    detail = ` · ${w}s/${r}s × ${n}`;
                  }
                  return (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      {modeInfo.icon} {modeInfo.label}{detail}
                    </span>
                  );
                })()}
              </div>
              <button type="button" onClick={() => onChange(blocks.filter((_,idx)=>idx!==i))}
                className="text-slate-400 hover:text-red-500 transition-colors">
                <X size={13}/>
              </button>
            </div>

            {/* Block fields */}
            <input
              value={block.name}
              onChange={e => update(i, { name: e.target.value })}
              placeholder="e.g. 21-15-9 Thrusters + Pull-ups"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <textarea
              value={block.description}
              onChange={e => update(i, { description: e.target.value })}
              placeholder="Description / instructions… Use @75% for percentage-based weights"
              rows={4}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
            />
            <input
              value={block.videoUrl}
              onChange={e => update(i, { videoUrl: e.target.value })}
              placeholder="Video URL (optional)"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />

            {/* ── Track for analytics ─────────────────────────────── */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <Checkbox
                checked={!!block.isTracked}
                onChange={() => update(i, { isTracked: !block.isTracked, scoreType: !block.isTracked ? 'weight' : undefined })}
              />
              <span className="text-xs text-slate-600 font-medium select-none">Track for analytics</span>
              {block.isTracked && (
                <select
                  value={block.scoreType ?? 'weight'}
                  onChange={e => update(i, { scoreType: e.target.value as Block['scoreType'] })}
                  className="ml-auto text-xs border border-primary-200 bg-primary-50 text-primary-700 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500 font-medium"
                >
                  {SCORE_TYPE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              )}
            </div>

            {/* ── Include Timer ────────────────────────────────────── */}
            <div className="border-t border-slate-100 pt-2 space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={hasTimer}
                  onChange={() => update(i, {
                    timer: hasTimer ? undefined : { mode: 'amrap' as TimerMode, timeCap: 20 },
                  })}
                />
                <span className="text-xs text-slate-600 font-medium select-none">Include timer</span>
              </div>

              {hasTimer && (
                <div className="ml-6 space-y-2.5 animate-fadeIn">
                  {/* Timer mode selector */}
                  <div className="grid grid-cols-5 gap-1">
                    {TIMER_MODE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        title={opt.hint}
                        onClick={() => updateTimer(i, { mode: opt.value })}
                        className={`flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-lg border text-[10px] font-semibold transition-colors ${
                          timerMode === opt.value
                            ? 'border-amber-400 bg-amber-50 text-amber-700'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
                        }`}
                      >
                        <span className="text-base leading-none">{opt.icon}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Hint text */}
                  <p className="text-[11px] text-slate-400 italic">{modeInfo.hint}</p>

                  {/* Mode-specific config */}
                  {(timerMode === 'amrap' || timerMode === 'for_time') && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-600 font-medium shrink-0">Time cap</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={1} max={120}
                          value={block.timer?.timeCap ?? 20}
                          onChange={e => updateTimer(i, { timeCap: Math.max(1, parseInt(e.target.value) || 20) })}
                          className="w-16 px-2 py-1 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 text-center font-semibold"
                        />
                        <span className="text-xs text-slate-500">min</span>
                      </div>
                    </div>
                  )}

                  {timerMode === 'emom' && (() => {
                    const interval  = block.timer?.emomInterval ?? 1;
                    const total     = block.timer?.emomMinutes  ?? 20;
                    const rounds    = Math.floor(total / interval);
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <label className="text-xs text-slate-600 font-medium shrink-0">Every</label>
                            <input
                              type="number" min={1} max={10}
                              value={interval}
                              onChange={e => updateTimer(i, { emomInterval: Math.max(1, parseInt(e.target.value) || 1) })}
                              className="w-14 px-2 py-1 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 text-center font-semibold"
                            />
                            <span className="text-xs text-slate-500">min</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <label className="text-xs text-slate-600 font-medium shrink-0">Total</label>
                            <input
                              type="number" min={1} max={120}
                              value={total}
                              onChange={e => updateTimer(i, { emomMinutes: Math.max(1, parseInt(e.target.value) || 20) })}
                              className="w-14 px-2 py-1 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 text-center font-semibold"
                            />
                            <span className="text-xs text-slate-500">min</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          = {rounds} round{rounds !== 1 ? 's' : ''} · {interval} min each
                        </p>
                      </div>
                    );
                  })()}

                  {timerMode === 'tabata' && (() => {
                    const work   = block.timer?.tabataWork   ?? 20;
                    const rest   = block.timer?.tabataRest   ?? 10;
                    const rounds = block.timer?.tabataRounds ?? 8;
                    const totalSec = rounds * (work + rest);
                    const totalMin = Math.floor(totalSec / 60);
                    const totalRemSec = totalSec % 60;
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <label className="text-xs text-emerald-700 font-medium shrink-0">Work</label>
                            <input
                              type="number" min={5} max={300}
                              value={work}
                              onChange={e => updateTimer(i, { tabataWork: Math.max(5, parseInt(e.target.value) || 20) })}
                              className="w-14 px-2 py-1 text-sm border border-emerald-200 bg-emerald-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 text-center font-semibold text-emerald-800"
                            />
                            <span className="text-xs text-slate-500">s</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <label className="text-xs text-blue-700 font-medium shrink-0">Rest</label>
                            <input
                              type="number" min={5} max={300}
                              value={rest}
                              onChange={e => updateTimer(i, { tabataRest: Math.max(5, parseInt(e.target.value) || 10) })}
                              className="w-14 px-2 py-1 text-sm border border-blue-200 bg-blue-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-center font-semibold text-blue-800"
                            />
                            <span className="text-xs text-slate-500">s</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <label className="text-xs text-slate-600 font-medium shrink-0">Rounds</label>
                            <input
                              type="number" min={1} max={100}
                              value={rounds}
                              onChange={e => updateTimer(i, { tabataRounds: Math.max(1, parseInt(e.target.value) || 8) })}
                              className="w-14 px-2 py-1 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 text-center font-semibold"
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Total: {totalMin > 0 ? `${totalMin}m ` : ''}{totalRemSec > 0 ? `${totalRemSec}s` : ''}
                          {' '}· {work}s work / {rest}s rest × {rounds}
                        </p>
                      </div>
                    );
                  })()}

                  {timerMode === 'stopwatch' && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                      <span className="text-sm">🕐</span>
                      <span>Simple count-up stopwatch — no time limit</span>
                    </div>
                  )}
                </div>
              )}

              {/* ── Scaling variants (RX / Scaled / RX+) ── */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Scaling options</span>
                  <span className="text-[10px] text-slate-400">Describe each level — athletes pick when logging</span>
                </div>
                <div className="p-3 space-y-2">
                  {([
                    { key: 'rxPlus', label: 'RX+', color: 'border-purple-200 bg-purple-50 focus:ring-purple-400', badge: 'bg-purple-100 text-purple-700', emoji: '⚡' },
                    { key: 'rx',     label: 'RX',  color: 'border-emerald-200 bg-emerald-50 focus:ring-emerald-400', badge: 'bg-emerald-100 text-emerald-700', emoji: '✅' },
                    { key: 'scaled', label: 'Scaled', color: 'border-amber-200 bg-amber-50 focus:ring-amber-400', badge: 'bg-amber-100 text-amber-700', emoji: '🔧' },
                  ] as const).map(({ key, label, color, badge, emoji }) => (
                    <div key={key} className="flex items-start gap-2">
                      <span className={`mt-1.5 shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${badge}`}>
                        {emoji} {label}
                      </span>
                      <input
                        type="text"
                        value={(block.scaling as any)?.[key] ?? ''}
                        onChange={e => update(i, { scaling: { ...block.scaling, [key]: e.target.value } })}
                        placeholder={
                          key === 'rxPlus' ? 'e.g. 100 kg / strict pull-ups'
                          : key === 'rx'   ? 'e.g. 70 kg / kipping pull-ups'
                          :                  'e.g. 40 kg / ring rows'
                        }
                        className={`flex-1 px-2.5 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 ${color}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => onChange([...blocks, { name: '', description: '', videoUrl: '' }])}
        className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
      >
        <PlusCircle size={14}/> Add block
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   WORKOUT DIALOG  (add / edit a workout on a date)
═══════════════════════════════════════════════════════════════ */
function WorkoutDialog({
  date, dayIndex, existingWorkout, templateId, onClose,
}: {
  date: Date; dayIndex: number; existingWorkout?: any;
  templateId: string; onClose: ()=>void;
}) {
  const qc = useQueryClient();
  const isEdit = !!existingWorkout;
  const [title, setTitle]       = useState(existingWorkout?.title ?? '');
  const [desc,  setDesc]        = useState(existingWorkout?.description ?? '');
  const [blocks,setBlocks]      = useState<Block[]>(existingWorkout?.blocks ?? []);
  const [error, setError]       = useState('');

  const saveMutation = useMutation({
    mutationFn: () => {
      const resolvedTitle = title.trim() || `Day ${dayIndex}`;
      return isEdit
        ? templatesApi.updateWorkout(templateId, existingWorkout.id, { title: resolvedTitle, description: desc || undefined, blocks })
        : templatesApi.addWorkout(templateId, { dayIndex, title: resolvedTitle, description: desc || undefined, blocks });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['template', templateId] });
      onClose();
    },
    onError: (err:any) => setError(err?.response?.data?.message ?? 'Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => templatesApi.removeWorkout(templateId, existingWorkout.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['template', templateId] }); onClose(); },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-primary-600 uppercase tracking-wide">
              Day {dayIndex}
            </p>
            <h2 className="font-semibold text-slate-900">{formatDisplayDate(date)}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"><X size={16}/></button>
        </div>

        <form onSubmit={e=>{e.preventDefault();setError('');saveMutation.mutate();}}
          className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

          {isEdit && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Workout title</label>
                <input value={title} onChange={e=>setTitle(e.target.value)} placeholder={`Day ${dayIndex}`}
                  autoFocus
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
                <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Optional description…" rows={2}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"/>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Workout Blocks</label>
            <BlockEditor blocks={blocks} onChange={setBlocks}/>
          </div>

          <div className="flex gap-3 pt-1">
            {isEdit && (
              <button type="button" onClick={()=>{ if(confirm('Delete this workout?')) deleteMutation.mutate(); }}
                disabled={deleteMutation.isPending}
                className="px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50">
                Delete
              </button>
            )}
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saveMutation.isPending}
              className="flex-1 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {saveMutation.isPending && <Loader2 size={14} className="animate-spin"/>}
              {isEdit ? 'Save changes' : 'Add workout'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ASSIGN MODAL
═══════════════════════════════════════════════════════════════ */
function AssignModal({ template, onClose }: { template:any; onClose:()=>void }) {
  const qc = useQueryClient();
  const [startDate,      setStartDate]      = useState(new Date().toISOString().split('T')[0]);
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [error, setError] = useState('');

  const { data: athletesData, isLoading } = useQuery({ queryKey:['my-athletes'], queryFn: coachingApi.getMyAthletes });
  const athletes = athletesData?.data ?? [];

  const assignMutation = useMutation({
    mutationFn: () => templatesApi.assign(template.id, { athleteIds:selectedAthletes, startDate }),
    onSuccess: () => { qc.invalidateQueries({queryKey:['templates']}); onClose(); },
    onError: (err:any) => setError(err?.response?.data?.message ?? 'Failed to assign'),
  });

  const toggle = (id:string) => setSelectedAthletes(p => p.includes(id) ? p.filter(x=>x!==id) : [...p,id]);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <Send size={16} className="text-primary-600"/> Assign "{template.name}"
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {(template.template_workouts?.length??0)} workout days
          </p>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Start date *</label>
            <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Select athletes *</label>
            {isLoading ? <div className="py-6 flex justify-center"><Loader2 size={20} className="animate-spin text-primary-500"/></div>
              : athletes.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">No athletes yet</p>
              : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {athletes.map((a:any) => {
                    const name = a.profile?.name ?? a.athleteId;
                    const sel  = selectedAthletes.includes(a.athleteId);
                    return (
                      <button key={a.athleteId} type="button" onClick={()=>toggle(a.athleteId)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${sel?'border-primary-300 bg-primary-50':'border-slate-200 hover:bg-slate-50'}`}>
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${sel?'bg-primary-600 border-primary-600':'border-slate-300'}`}>
                          {sel && <Check size={11} className="text-white"/>}
                        </div>
                        <span className="text-sm font-medium text-slate-800">{name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
          <button onClick={()=>{ if(!selectedAthletes.length){setError('Select at least one athlete');return;} setError(''); assignMutation.mutate(); }}
            disabled={assignMutation.isPending}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {assignMutation.isPending && <Loader2 size={14} className="animate-spin"/>}
            Assign{selectedAthletes.length>0?` to ${selectedAthletes.length}`:''}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PROGRAM VIEW  (week-grid, inline block management)
═══════════════════════════════════════════════════════════════ */
function ProgramView({
  templateId, workouts,
}: {
  templateId: string;
  workouts: any[];
}) {
  const qc = useQueryClient();
  const [weekStart, setWeekStart] = useState(1);
  const [addingToDay, setAddingToDay] = useState<number | null>(null);
  const [newBlockName, setNewBlockName] = useState('');
  const [newBlockDesc, setNewBlockDesc] = useState('');
  const [saving, setSaving] = useState<number | null>(null);

  const workoutByDay = useMemo(() => {
    const map: Record<number, any> = {};
    for (const w of workouts) {
      if (!map[w.day_index]) map[w.day_index] = w;
    }
    return map;
  }, [workouts]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['template', templateId] });

  async function saveBlocks(dayIndex: number, newBlocks: Block[]) {
    setSaving(dayIndex);
    try {
      const w = workoutByDay[dayIndex];
      if (w) {
        await templatesApi.updateWorkout(templateId, w.id, { blocks: newBlocks });
      } else if (newBlocks.length > 0) {
        await templatesApi.addWorkout(templateId, { dayIndex, title: `Day ${dayIndex}`, blocks: newBlocks });
      }
      await invalidate();
    } finally {
      setSaving(null);
    }
  }

  async function handleAddBlock(dayIndex: number) {
    const block: Block = { name: newBlockName.trim() || 'Block', description: newBlockDesc, videoUrl: '' };
    const existing = workoutByDay[dayIndex]?.blocks ?? [];
    await saveBlocks(dayIndex, [...existing, block]);
    setAddingToDay(null);
    setNewBlockName('');
    setNewBlockDesc('');
  }

  async function handleDelete(dayIndex: number, bi: number) {
    const blocks = (workoutByDay[dayIndex]?.blocks ?? []).filter((_: any, i: number) => i !== bi);
    await saveBlocks(dayIndex, blocks);
  }

  async function handleDuplicate(dayIndex: number, bi: number) {
    const existing = workoutByDay[dayIndex]?.blocks ?? [];
    const copy = { ...existing[bi] };
    const newBlocks = [...existing.slice(0, bi + 1), copy, ...existing.slice(bi + 1)];
    await saveBlocks(dayIndex, newBlocks);
  }

  async function handleMoveInDay(dayIndex: number, bi: number, dir: 'up' | 'down') {
    const blocks = [...(workoutByDay[dayIndex]?.blocks ?? [])];
    const target = dir === 'up' ? bi - 1 : bi + 1;
    if (target < 0 || target >= blocks.length) return;
    [blocks[bi], blocks[target]] = [blocks[target], blocks[bi]];
    await saveBlocks(dayIndex, blocks);
  }

  async function handleMoveDay(fromDay: number, bi: number, toDay: number) {
    if (toDay < 1) return;
    const fromBlocks = [...(workoutByDay[fromDay]?.blocks ?? [])];
    const block = fromBlocks[bi];
    const newFrom = fromBlocks.filter((_: any, i: number) => i !== bi);
    const newTo = [...(workoutByDay[toDay]?.blocks ?? []), block];
    setSaving(fromDay);
    try {
      const wFrom = workoutByDay[fromDay];
      if (wFrom) await templatesApi.updateWorkout(templateId, wFrom.id, { blocks: newFrom });
      const wTo = workoutByDay[toDay];
      if (wTo) {
        await templatesApi.updateWorkout(templateId, wTo.id, { blocks: newTo });
      } else {
        await templatesApi.addWorkout(templateId, { dayIndex: toDay, title: `Day ${toDay}`, blocks: newTo });
      }
      await invalidate();
    } finally {
      setSaving(null);
    }
  }

  const days = Array.from({ length: 7 }, (_, i) => weekStart + i);
  const weekNum = Math.ceil(weekStart / 7);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Week navigation */}
      <div className="flex items-center gap-3 px-6 py-2.5 bg-slate-50 border-b border-slate-100">
        <button onClick={() => setWeekStart(s => Math.max(1, s - 7))} disabled={weekStart <= 1}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-30 transition-colors">
          <ChevronLeft size={15}/>
        </button>
        <span className="text-sm font-semibold text-slate-700">
          Week {weekNum} · Days {weekStart}–{weekStart + 6}
        </span>
        <button onClick={() => setWeekStart(s => s + 7)}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-white transition-colors">
          <ChevronRight size={15}/>
        </button>
        <span className="ml-auto text-xs text-slate-400">Click a block to edit · hover for actions</span>
      </div>

      {/* Day columns */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-7 min-w-[840px] h-full divide-x divide-slate-100">
          {days.map(dayIndex => {
            const workout = workoutByDay[dayIndex];
            const blocks: Block[] = workout?.blocks ?? [];
            const isAddingHere = addingToDay === dayIndex;
            const isSavingHere = saving === dayIndex;

            return (
              <div key={dayIndex} className="flex flex-col min-h-[400px]">
                {/* Day header */}
                <div className="px-2 py-2 bg-white border-b border-slate-100 text-center sticky top-0 z-10">
                  <p className={`text-xs font-bold uppercase tracking-wide ${blocks.length > 0 ? 'text-primary-600' : 'text-slate-400'}`}>
                    Day {dayIndex}
                  </p>
                  {blocks.length > 0 && (
                    <p className="text-[10px] text-slate-400 mt-0.5">{blocks.length} block{blocks.length !== 1 ? 's' : ''}</p>
                  )}
                  {isSavingHere && <span className="text-[10px] text-amber-500 animate-pulse">Saving…</span>}
                </div>

                {/* Blocks */}
                <div className="flex-1 p-2 space-y-2 bg-slate-50/30">
                  {blocks.map((block, bi) => (
                    <div key={bi} className="bg-white border border-slate-200 rounded-lg p-2 group shadow-sm hover:border-primary-200 hover:shadow transition-all">
                      <p className="text-xs font-semibold text-slate-800 leading-tight truncate">
                        {block.name || <span className="italic text-slate-400">Unnamed</span>}
                      </p>
                      {block.description && (
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-tight">{block.description}</p>
                      )}
                      {/* Action bar — visible on hover */}
                      <div className="flex items-center gap-0.5 mt-1.5 pt-1.5 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button title="Move up" onClick={() => handleMoveInDay(dayIndex, bi, 'up')} disabled={bi === 0}
                          className="p-0.5 rounded text-slate-300 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-20 transition-colors">
                          <ChevronUp size={12}/>
                        </button>
                        <button title="Move down" onClick={() => handleMoveInDay(dayIndex, bi, 'down')} disabled={bi === blocks.length - 1}
                          className="p-0.5 rounded text-slate-300 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-20 transition-colors">
                          <ChevronDown size={12}/>
                        </button>
                        <button title={`Move to Day ${dayIndex - 1}`} onClick={() => handleMoveDay(dayIndex, bi, dayIndex - 1)} disabled={dayIndex <= 1}
                          className="p-0.5 rounded text-slate-300 hover:text-blue-500 hover:bg-blue-50 disabled:opacity-20 transition-colors">
                          <ChevronLeft size={12}/>
                        </button>
                        <button title={`Move to Day ${dayIndex + 1}`} onClick={() => handleMoveDay(dayIndex, bi, dayIndex + 1)}
                          className="p-0.5 rounded text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                          <ChevronRight size={12}/>
                        </button>
                        <button title="Duplicate" onClick={() => handleDuplicate(dayIndex, bi)}
                          className="p-0.5 rounded text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                          <Copy size={12}/>
                        </button>
                        <button title="Delete" onClick={() => { if (confirm('Delete this block?')) handleDelete(dayIndex, bi); }}
                          className="p-0.5 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <X size={12}/>
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add block form */}
                  {isAddingHere ? (
                    <div className="border border-primary-200 bg-primary-50 rounded-lg p-2 space-y-1.5">
                      <input
                        autoFocus
                        value={newBlockName}
                        onChange={e => setNewBlockName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleAddBlock(dayIndex); if (e.key === 'Escape') { setAddingToDay(null); setNewBlockName(''); setNewBlockDesc(''); } }}
                        placeholder="Block name…"
                        className="w-full px-2 py-1.5 text-xs border border-primary-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
                      />
                      <textarea
                        value={newBlockDesc}
                        onChange={e => setNewBlockDesc(e.target.value)}
                        placeholder="Description (optional)…"
                        rows={2}
                        className="w-full px-2 py-1.5 text-xs border border-primary-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white resize-none"
                      />
                      <div className="flex gap-1">
                        <button onClick={() => { setAddingToDay(null); setNewBlockName(''); setNewBlockDesc(''); }}
                          className="flex-1 py-1 text-[11px] font-medium text-slate-500 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors">
                          Cancel
                        </button>
                        <button onClick={() => handleAddBlock(dayIndex)}
                          className="flex-1 py-1 text-[11px] font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors">
                          Add
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setAddingToDay(dayIndex); setNewBlockName(''); setNewBlockDesc(''); }}
                      className="w-full flex items-center justify-center gap-1 py-2 text-[11px] font-medium text-primary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg border border-dashed border-primary-200 hover:border-primary-300 transition-colors"
                    >
                      <Plus size={11}/> Add Block
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CALENDAR — MONTH VIEW
═══════════════════════════════════════════════════════════════ */
function MonthView({
  currentDate, programStart, workoutsByDate, today,
  onClickDate, onClickWorkout,
}: {
  currentDate: Date; programStart: Date; workoutsByDate: Record<string,any[]>; today: string;
  onClickDate:(d:Date)=>void; onClickWorkout:(w:any,d:Date)=>void;
}) {
  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();

  const cells: (number|null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({length:daysInMonth},(_,i)=>i+1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="flex-1 flex flex-col">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-slate-200">
        {WEEKDAYS_SHORT.map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr" style={{gridAutoRows:'minmax(100px,1fr)'}}>
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} className="border-r border-b border-slate-100 bg-slate-50/50"/>;
          const date    = new Date(year, month, day);
          const dateStr = toDateStr(date);
          const isToday = dateStr === today;
          const dayIdx  = dateToDayIndex(date, programStart);
          const workouts= workoutsByDate[dateStr] ?? [];
          const isPast  = dayIdx < 1;

          return (
            <div key={dateStr}
              onClick={() => onClickDate(date)}
              className={`border-r border-b border-slate-100 p-1.5 cursor-pointer group transition-colors
                ${isPast ? 'bg-slate-50/60' : 'hover:bg-blue-50/40'}`}>
              {/* Date number */}
              <div className="flex items-center justify-between mb-1">
                <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium
                  ${isToday ? 'bg-primary-600 text-white' : isPast ? 'text-slate-300' : 'text-slate-700 group-hover:bg-primary-100 group-hover:text-primary-700'}`}>
                  {day}
                </span>
                {dayIdx >= 1 && (
                  <span className="text-[10px] text-slate-300 font-medium">Day {dayIdx}</span>
                )}
              </div>

              {/* Workout chips */}
              <div className="space-y-0.5">
                {workouts.slice(0, 2).map((w:any) => (
                  <button key={w.id}
                    onClick={e => { e.stopPropagation(); onClickWorkout(w, date); }}
                    className={`w-full text-left px-2 py-0.5 rounded text-white text-xs font-medium truncate ${eventColor(w.id)} hover:opacity-90 transition-opacity`}>
                    {w.title}
                  </button>
                ))}
                {workouts.length > 2 && (
                  <button onClick={e=>{e.stopPropagation();onClickWorkout(workouts[2],date);}}
                    className="text-xs text-slate-400 hover:text-slate-600 pl-1">
                    +{workouts.length-2} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CALENDAR — WEEK VIEW
═══════════════════════════════════════════════════════════════ */
function WeekView({
  currentDate, programStart, workoutsByDate, today,
  onClickDate, onClickWorkout,
}: {
  currentDate: Date; programStart: Date; workoutsByDate: Record<string,any[]>; today: string;
  onClickDate:(d:Date)=>void; onClickWorkout:(w:any,d:Date)=>void;
}) {
  const weekStart = startOfWeek(currentDate);
  const days = Array.from({length:7}, (_,i) => addDays(weekStart, i));

  return (
    <div className="flex-1 flex flex-col">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-slate-200">
        {days.map(d => {
          const dateStr = toDateStr(d);
          const isToday = dateStr === today;
          const dayIdx  = dateToDayIndex(d, programStart);
          return (
            <div key={dateStr} className="py-3 text-center border-r border-slate-100 last:border-r-0">
              <p className={`text-xs font-semibold uppercase tracking-wide ${isToday?'text-primary-600':'text-slate-400'}`}>
                {WEEKDAYS_SHORT[d.getDay()]}
              </p>
              <div className={`w-9 h-9 mx-auto mt-1 rounded-full flex items-center justify-center text-sm font-bold
                ${isToday ? 'bg-primary-600 text-white' : 'text-slate-700'}`}>
                {d.getDate()}
              </div>
              {dayIdx >= 1 && (
                <p className="text-[10px] text-slate-300 mt-0.5">Day {dayIdx}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Workout cells */}
      <div className="flex-1 grid grid-cols-7 min-h-0" style={{minHeight:400}}>
        {days.map(d => {
          const dateStr = toDateStr(d);
          const dayIdx  = dateToDayIndex(d, programStart);
          const workouts= workoutsByDate[dateStr] ?? [];
          const isPast  = dayIdx < 1;

          return (
            <div key={dateStr}
              onClick={() => onClickDate(d)}
              className={`border-r border-b border-slate-100 p-2 cursor-pointer group transition-colors
                ${isPast ? 'bg-slate-50/60' : 'hover:bg-blue-50/30'}`}>
              <div className="space-y-1.5">
                {workouts.map((w:any) => (
                  <button key={w.id}
                    onClick={e=>{e.stopPropagation();onClickWorkout(w,d);}}
                    className={`w-full text-left px-3 py-2 rounded-lg text-white text-xs font-medium ${eventColor(w.id)} hover:opacity-90 shadow-sm transition-opacity`}>
                    <p className="font-semibold truncate">{w.title}</p>
                    {w.description && <p className="opacity-80 text-[11px] mt-0.5 truncate">{w.description}</p>}
                    {w.blocks?.length>0 && (
                      <p className="opacity-70 text-[11px] mt-0.5">{w.blocks.length} block{w.blocks.length!==1?'s':''}</p>
                    )}
                  </button>
                ))}
                {workouts.length===0 && !isPast && (
                  <div className="flex items-center justify-center h-16 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-1 text-xs text-primary-400 font-medium">
                      <Plus size={13}/> Add
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CALENDAR — DAY VIEW
═══════════════════════════════════════════════════════════════ */
function DayView({
  currentDate, programStart, workoutsByDate,
  onClickDate, onClickWorkout,
}: {
  currentDate: Date; programStart: Date; workoutsByDate: Record<string,any[]>;
  onClickDate:(d:Date)=>void; onClickWorkout:(w:any,d:Date)=>void;
}) {
  const dateStr = toDateStr(currentDate);
  const dayIdx  = dateToDayIndex(currentDate, programStart);
  const workouts= workoutsByDate[dateStr] ?? [];

  return (
    <div className="flex-1 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{formatDisplayDate(currentDate)}</h2>
          {dayIdx >= 1 && <p className="text-sm text-slate-500 mt-0.5">Program day {dayIdx}</p>}
        </div>
        <button onClick={()=>onClickDate(currentDate)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors">
          <Plus size={15}/> Add workout
        </button>
      </div>

      {workouts.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-2xl py-20 flex flex-col items-center gap-3 cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition-colors"
          onClick={()=>onClickDate(currentDate)}>
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
            <Plus size={22} className="text-slate-300"/>
          </div>
          <p className="text-slate-400 font-medium">No workout scheduled</p>
          <p className="text-sm text-slate-300">Click to add one</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workouts.map((w:any) => (
            <div key={w.id}
              onClick={()=>onClickWorkout(w, currentDate)}
              className={`rounded-2xl p-5 cursor-pointer hover:opacity-95 transition-opacity ${eventColor(w.id)}`}>
              <p className="text-lg font-bold text-white">{w.title}</p>
              {w.description && <p className="text-white/80 text-sm mt-1">{w.description}</p>}
              {w.blocks?.length>0 && (
                <div className="mt-3 space-y-2">
                  {w.blocks.map((b:any,i:number) => (
                    <div key={i} className="bg-white/20 rounded-xl px-4 py-2">
                      <p className="text-white font-semibold text-sm">{b.name}</p>
                      {b.description && <p className="text-white/70 text-xs mt-0.5">{b.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TEMPLATE EDITOR  (calendar view for a single template)
═══════════════════════════════════════════════════════════════ */
type CalView = 'month' | 'week' | 'day' | 'program';

function TemplateEditor({ template, onBack }: { template:any; onBack:()=>void }) {
  const qc = useQueryClient();
  const today    = toDateStr(new Date());

  // Program start = day 1 reference
  const [programStart, setProgramStart] = useState(() => {
    const d = new Date(); d.setHours(0,0,0,0); return d;
  });

  // Calendar navigation
  const [view, setView]               = useState<CalView>('program');
  const [currentDate, setCurrentDate] = useState(() => { const d=new Date(); d.setHours(0,0,0,0); return d; });

  // Dialog state
  const [dialogDate,     setDialogDate]     = useState<Date|null>(null);
  const [editingWorkout, setEditingWorkout] = useState<any>(null);
  const [showAssign,     setShowAssign]     = useState(false);

  // Fetch full template with workouts
  const { data: fullData, isLoading } = useQuery({
    queryKey: ['template', template.id],
    queryFn: () => templatesApi.getById(template.id),
  });
  const workouts: any[] = fullData?.data?.template_workouts ?? [];

  // Build date → workouts map based on programStart + day_index
  const workoutsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const w of workouts) {
      const d = dayIndexToDate(w.day_index, programStart);
      if (d.getFullYear() < 2000) continue; // skip invalid
      const key = toDateStr(d);
      if (!map[key]) map[key] = [];
      map[key].push(w);
    }
    return map;
  }, [workouts, programStart]);

  // Nav label
  const navLabel = useMemo(() => {
    if (view === 'month') return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    if (view === 'week')  {
      const ws = startOfWeek(currentDate);
      const we = addDays(ws, 6);
      if (ws.getMonth() === we.getMonth())
        return `${MONTHS[ws.getMonth()]} ${ws.getDate()}–${we.getDate()}, ${ws.getFullYear()}`;
      return `${formatShortDate(ws)} – ${formatShortDate(we)}, ${ws.getFullYear()}`;
    }
    return formatDisplayDate(currentDate);
  }, [view, currentDate]);

  const navigatePrev = () => {
    if (view==='month') { const d=new Date(currentDate); d.setMonth(d.getMonth()-1); setCurrentDate(d); }
    if (view==='week')  { setCurrentDate(addDays(currentDate,-7)); }
    if (view==='day')   { setCurrentDate(addDays(currentDate,-1)); }
  };
  const navigateNext = () => {
    if (view==='month') { const d=new Date(currentDate); d.setMonth(d.getMonth()+1); setCurrentDate(d); }
    if (view==='week')  { setCurrentDate(addDays(currentDate,7)); }
    if (view==='day')   { setCurrentDate(addDays(currentDate,1)); }
  };
  const navigateToday = () => { const d=new Date(); d.setHours(0,0,0,0); setCurrentDate(d); };

  const handleClickDate = (d:Date) => {
    setEditingWorkout(null);
    setDialogDate(d);
  };
  const handleClickWorkout = (w:any, d:Date) => {
    setEditingWorkout(w);
    setDialogDate(d);
  };

  const fullTemplate = fullData?.data ?? template;

  return (
    <div className="flex flex-col min-h-full">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-4">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft size={16}/> Templates
        </button>
        <div className="h-5 w-px bg-slate-200"/>
        <h1 className="font-bold text-slate-900 text-lg truncate flex-1">{template.name}</h1>

        <div className="flex items-center gap-2">
          <Badge variant="default">
            {workouts.length} day{workouts.length!==1?'s':''}
          </Badge>
          <button onClick={()=>setShowAssign(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors">
            <Users size={14}/> Assign to athletes
          </button>
        </div>
      </div>

      {/* Calendar toolbar */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center gap-3 flex-wrap">
        {/* Program start date */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar size={14} className="text-slate-400"/>
          <span className="text-slate-500 font-medium">Day 1:</span>
          <input type="date" value={toDateStr(programStart)}
            onChange={e => {
              const d = new Date(e.target.value+'T00:00:00');
              if (!isNaN(d.getTime())) { setProgramStart(d); setCurrentDate(d); }
            }}
            className="text-sm font-semibold text-slate-800 border-0 bg-transparent focus:outline-none cursor-pointer"/>
        </div>

        <div className="flex-1"/>

        {/* Today button */}
        <button onClick={navigateToday}
          className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          Today
        </button>

        {/* Prev / Next */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <button onClick={navigatePrev} className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-50 transition-colors">
            <ChevronLeft size={16}/>
          </button>
          <span className="px-3 text-sm font-semibold text-slate-800 min-w-[160px] text-center">{navLabel}</span>
          <button onClick={navigateNext} className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-50 transition-colors">
            <ChevronRight size={16}/>
          </button>
        </div>

        {/* View switcher */}
        <div className="flex bg-slate-100 rounded-lg p-1 gap-0.5">
          {([
            { key: 'program', label: 'Program' },
            { key: 'month',   label: 'Month'   },
            { key: 'week',    label: 'Week'     },
            { key: 'day',     label: 'Day'      },
          ] as { key: CalView; label: string }[]).map(({ key, label }) => (
            <button key={key} onClick={() => setView(key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${view === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar body */}
      <div className="flex-1 bg-white flex flex-col overflow-hidden min-h-0" style={{minHeight:500}}>
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={28} className="animate-spin text-primary-500"/>
          </div>
        ) : view === 'program' ? (
          <ProgramView templateId={template.id} workouts={workouts}/>
        ) : view === 'month' ? (
          <MonthView
            currentDate={currentDate} programStart={programStart}
            workoutsByDate={workoutsByDate} today={today}
            onClickDate={handleClickDate} onClickWorkout={handleClickWorkout}/>
        ) : view === 'week' ? (
          <WeekView
            currentDate={currentDate} programStart={programStart}
            workoutsByDate={workoutsByDate} today={today}
            onClickDate={handleClickDate} onClickWorkout={handleClickWorkout}/>
        ) : (
          <DayView
            currentDate={currentDate} programStart={programStart}
            workoutsByDate={workoutsByDate}
            onClickDate={handleClickDate} onClickWorkout={handleClickWorkout}/>
        )}
      </div>

      {/* Workout dialog */}
      {dialogDate && (
        <WorkoutDialog
          date={dialogDate}
          dayIndex={dateToDayIndex(dialogDate, programStart)}
          existingWorkout={editingWorkout ?? undefined}
          templateId={template.id}
          onClose={()=>{ setDialogDate(null); setEditingWorkout(null); }}/>
      )}

      {/* Assign modal */}
      {showAssign && (
        <AssignModal template={fullTemplate} onClose={()=>setShowAssign(false)}/>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TEMPLATES LIST
═══════════════════════════════════════════════════════════════ */
function TemplatesList({ onSelect }: { onSelect:(t:any)=>void }) {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [name,  setName]  = useState('');
  const [desc,  setDesc]  = useState('');
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({ queryKey:['templates'], queryFn: templatesApi.list });
  const templates = data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: () => templatesApi.create({ name:name.trim(), description:desc.trim()||undefined }),
    onSuccess: (res) => {
      qc.invalidateQueries({queryKey:['templates']});
      setShowCreate(false); setName(''); setDesc(''); setError('');
      // Auto-open the new template in editor
      if (res?.data) onSelect(res.data);
    },
    onError: (err:any) => setError(err?.response?.data?.message ?? 'Failed to create'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id:string) => templatesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({queryKey:['templates']}),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id:string) => templatesApi.duplicate(id),
    onSuccess: (res) => {
      qc.invalidateQueries({queryKey:['templates']});
      if (res?.data) onSelect(res.data);
    },
  });

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Workout Templates" subtitle="Build programs and assign them to your athletes"/>
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-slate-500">{templates.length} template{templates.length!==1?'s':''}</p>
          <button onClick={()=>setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors">
            <Plus size={15}/> New Template
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin text-primary-500"/>
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
              <ClipboardList size={28} className="text-slate-300"/>
            </div>
            <div>
              <p className="font-semibold text-slate-700 text-lg">No templates yet</p>
              <p className="text-sm text-slate-400 mt-1 max-w-sm">
                Create a multi-day workout program and assign it to your athletes with a calendar-style builder.
              </p>
            </div>
            <button onClick={()=>setShowCreate(true)}
              className="mt-2 px-6 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors">
              Create your first template
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {templates.map((t:any) => {
              const workoutCount = t.template_workouts?.length ?? 0;
              return (
                <div key={t.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-primary-200 transition-all cursor-pointer group"
                  onClick={()=>onSelect(t)}>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                        <ClipboardList size={20} className="text-primary-600"/>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={e=>{e.stopPropagation();duplicateMutation.mutate(t.id);}}
                          title="Duplicate template"
                          disabled={duplicateMutation.isPending}
                          className="p-1.5 text-slate-300 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors">
                          <Copy size={14}/>
                        </button>
                        <button
                          onClick={e=>{e.stopPropagation();if(confirm(`Delete "${t.name}"?`))deleteMutation.mutate(t.id);}}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-900 mt-3 text-base">{t.name}</h3>
                    {t.description && (
                      <p className="text-sm text-slate-400 mt-1 line-clamp-2">{t.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-4">
                      <Badge variant="default">
                        {workoutCount} day{workoutCount!==1?'s':''}
                      </Badge>
                      <span className="text-xs text-primary-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity ml-auto flex items-center gap-1">
                        Open in calendar <ChevronRight size={13}/>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">New Template</h2>
              <p className="text-sm text-slate-500 mt-0.5">Give your program a name. You'll add workout days in the calendar.</p>
            </div>
            <form onSubmit={e=>{e.preventDefault();if(!name.trim()){setError('Name is required');return;}setError('');createMutation.mutate();}}
              className="p-6 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Template name *</label>
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. 4-Week Strength Program"
                  autoFocus className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Optional…" rows={2}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"/>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={()=>{setShowCreate(false);setName('');setDesc('');setError('');}}
                  className="flex-1 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={createMutation.isPending}
                  className="flex-1 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {createMutation.isPending && <Loader2 size={14} className="animate-spin"/>}
                  Create & Open
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE ROOT
═══════════════════════════════════════════════════════════════ */
export default function TemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  return (
    <CoachGuard>
      {selectedTemplate ? (
        <TemplateEditor template={selectedTemplate} onBack={()=>setSelectedTemplate(null)}/>
      ) : (
        <TemplatesList onSelect={setSelectedTemplate}/>
      )}
    </CoachGuard>
  );
}
