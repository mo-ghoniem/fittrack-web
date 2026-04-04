'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Trash2, Clock, Dumbbell,
  ChevronLeft, ChevronRight, CheckCircle2, Circle, Trophy,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/Badge';
import { Table, Thead, Tbody, Th, Td, Tr } from '@/components/ui/Table';
import { workoutsApi, assignedWorkoutsApi } from '@/lib/api';
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

function AthleteCalendarView() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string>(
    toDateStr(today.getFullYear(), today.getMonth(), today.getDate()),
  );

  const monthKey = toMonthKey(viewYear, viewMonth);

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
              {selectedWorkouts.map((w: any) => {
                const isDone = w.status === 'completed';
                return (
                  <div
                    key={w.id}
                    className={`rounded-xl border p-4 ${
                      isDone
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {isDone
                        ? <CheckCircle2 size={20} className="text-emerald-500 mt-0.5 shrink-0" />
                        : <Circle size={20} className="text-slate-300 mt-0.5 shrink-0" />
                      }
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-900">{w.title}</p>
                          <Badge variant={isDone ? 'success' : 'default'}>
                            {isDone ? 'Completed' : 'Pending'}
                          </Badge>
                        </div>

                        {w.description && (
                          <p className="text-sm text-slate-500 mt-1">{w.description}</p>
                        )}

                        {w.blocks && w.blocks.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {w.blocks.map((block: any, i: number) => (
                              <div key={i} className="bg-white border border-slate-200 rounded-lg px-3 py-2">
                                <p className="text-sm font-medium text-slate-800">{block.name}</p>
                                {block.description && (
                                  <p className="text-xs text-slate-500 mt-0.5">{block.description}</p>
                                )}
                                {block.videoUrl && (
                                  <a
                                    href={block.videoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary-600 hover:underline mt-1 inline-block"
                                  >
                                    📹 Watch video
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {isDone && w.athlete_result && (
                          <div className="mt-3 flex items-center gap-2 bg-emerald-100 rounded-lg px-3 py-2">
                            <Trophy size={14} className="text-emerald-600" />
                            <p className="text-sm font-semibold text-emerald-700">
                              Result: {w.athlete_result}
                            </p>
                          </div>
                        )}

                        {isDone && w.athlete_notes && (
                          <p className="text-xs text-slate-500 mt-2 italic">
                            Notes: {w.athlete_notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
