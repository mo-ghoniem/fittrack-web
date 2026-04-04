'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Timer, Dumbbell, ChevronDown, ChevronUp, Calendar, Check } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/Badge';
import { dailyWodApi } from '@/lib/api';

type WodType = 'amrap' | 'emom' | 'for_time' | 'tabata' | 'chipper' | 'strength' | 'other';

const WOD_TYPES: { key: WodType; label: string; color: string; description: string }[] = [
  { key: 'amrap', label: 'AMRAP', color: 'bg-blue-100 text-blue-700', description: 'As Many Rounds As Possible' },
  { key: 'emom', label: 'EMOM', color: 'bg-violet-100 text-violet-700', description: 'Every Minute on the Minute' },
  { key: 'for_time', label: 'For Time', color: 'bg-emerald-100 text-emerald-700', description: 'Complete for fastest time' },
  { key: 'tabata', label: 'Tabata', color: 'bg-red-100 text-red-700', description: '20s work / 10s rest × 8' },
  { key: 'chipper', label: 'Chipper', color: 'bg-orange-100 text-orange-700', description: 'Complete all reps, one movement at a time' },
  { key: 'strength', label: 'Strength', color: 'bg-slate-100 text-slate-700', description: 'Barbell / weightlifting focus' },
  { key: 'other', label: 'Other', color: 'bg-gray-100 text-gray-700', description: 'Custom format' },
];

function formatTimeCap(seconds: number | null | undefined) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m} min` : `${m}:${String(s).padStart(2, '0')}`;
}

function WodTypeChip({ type }: { type: WodType }) {
  const info = WOD_TYPES.find((t) => t.key === type);
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold ${info?.color ?? 'bg-gray-100 text-gray-600'}`}>
      {info?.label ?? type}
    </span>
  );
}

function WodCard({ wod, isExpanded, onToggle }: {
  wod: any; isExpanded: boolean; onToggle: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <button
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
        onClick={onToggle}
      >
        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
          <Timer size={18} className="text-primary-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <WodTypeChip type={wod.wod_type} />
            {wod.time_cap && (
              <span className="text-xs text-slate-400">{formatTimeCap(wod.time_cap)} cap</span>
            )}
          </div>
          <p className="text-sm font-semibold text-slate-800 truncate">{wod.title}</p>
          <p className="text-xs text-slate-400">
            {new Date(wod.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>
        {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-slate-50 pt-3 space-y-3">
          {wod.description && (
            <p className="text-sm text-slate-600 leading-relaxed">{wod.description}</p>
          )}
          {wod.movements?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Movements</p>
              <div className="flex flex-wrap gap-1.5">
                {wod.movements.map((m: string) => (
                  <span key={m} className="bg-slate-100 px-2 py-1 rounded-md text-xs font-medium text-slate-700">{m}</span>
                ))}
              </div>
            </div>
          )}
          {wod.scaling && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Scaling</p>
              <p className="text-sm text-slate-600">{wod.scaling}</p>
            </div>
          )}
          {wod.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
              <p className="text-xs font-bold text-amber-600 mb-1">Coach Notes</p>
              <p className="text-sm text-amber-800">{wod.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const DEFAULT_FORM = {
  date: new Date().toISOString().split('T')[0],
  title: '',
  description: '',
  wodType: 'for_time' as WodType,
  timeCap: '',
  interval: '',
  movements: '',
  scaling: '',
  notes: '',
};

export default function WodProgrammingPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: history, isLoading } = useQuery({
    queryKey: ['wod-history'],
    queryFn: () => dailyWodApi.getHistory(),
  });

  const mutation = useMutation({
    mutationFn: (dto: Record<string, unknown>) => dailyWodApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wod-history'] });
      setForm(DEFAULT_FORM);
      setShowForm(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      date: form.date,
      title: form.title,
      description: form.description,
      wodType: form.wodType,
      timeCap: form.timeCap ? parseInt(form.timeCap) * 60 : undefined,
      interval: form.interval ? parseInt(form.interval) * 60 : undefined,
      movements: form.movements
        .split('\n')
        .map((m) => m.trim())
        .filter(Boolean),
      scaling: form.scaling || undefined,
      notes: form.notes || undefined,
    });
  };

  const todayWods = (history ?? []).filter(
    (w: any) => w.date === new Date().toISOString().split('T')[0],
  );
  const pastWods = (history ?? []).filter(
    (w: any) => w.date !== new Date().toISOString().split('T')[0],
  );

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="WOD Programming"
        subtitle="Program daily workouts for your athletes"
      />

      <main className="flex-1 p-6 overflow-y-auto max-w-4xl mx-auto w-full">

        {/* Create WOD Button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-slate-500">
              Post a WOD and all your athletes will see it automatically.
            </p>
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors"
          >
            <Plus size={18} />
            Post WOD
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 space-y-4"
          >
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Dumbbell size={20} className="text-primary-600" />
              Program a WOD
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">WOD Type</label>
                <select
                  value={form.wodType}
                  onChange={(e) => setForm((f) => ({ ...f, wodType: e.target.value as WodType }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {WOD_TYPES.map((t) => (
                    <option key={t.key} value={t.key}>{t.label} — {t.description}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder={
                  form.wodType === 'amrap' ? 'e.g. AMRAP 20: Cindy'
                  : form.wodType === 'for_time' ? 'e.g. Fran 21-15-9'
                  : 'WOD title'
                }
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Full WOD description: e.g. '21-15-9 reps of: Thrusters (95/65 lb), Pull-ups. For time.'"
                rows={3}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                Movements (one per line)
              </label>
              <textarea
                value={form.movements}
                onChange={(e) => setForm((f) => ({ ...f, movements: e.target.value }))}
                placeholder={'Thrusters\nPull-ups'}
                rows={4}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  Time Cap (minutes)
                </label>
                <input
                  type="number"
                  value={form.timeCap}
                  onChange={(e) => setForm((f) => ({ ...f, timeCap: e.target.value }))}
                  placeholder="e.g. 20"
                  min={1}
                  max={120}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              {form.wodType === 'emom' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                    Interval (minutes)
                  </label>
                  <input
                    type="number"
                    value={form.interval}
                    onChange={(e) => setForm((f) => ({ ...f, interval: e.target.value }))}
                    placeholder="e.g. 1"
                    min={1}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                Scaling Notes
              </label>
              <textarea
                value={form.scaling}
                onChange={(e) => setForm((f) => ({ ...f, scaling: e.target.value }))}
                placeholder="e.g. Scale thrusters to 65/45 lb. Ring rows instead of pull-ups."
                rows={2}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                Coach Notes (private)
              </label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. Focus on push jerk technique in warm-up"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {mutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <>
                    <Check size={16} />
                    Post WOD
                  </>
                )}
              </button>
            </div>

            {mutation.isError && (
              <p className="text-red-500 text-sm text-center">
                Failed to post WOD. Make sure you have at least one active athlete.
              </p>
            )}
          </form>
        )}

        {/* Today's WOD */}
        {todayWods.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={16} className="text-primary-600" />
              <h3 className="font-bold text-slate-800">Today&apos;s WOD</h3>
              <Badge variant="success">Today</Badge>
            </div>
            <div className="space-y-3">
              {todayWods.map((wod: any) => (
                <WodCard
                  key={wod.id}
                  wod={wod}
                  isExpanded={expandedId === wod.id}
                  onToggle={() => setExpandedId(expandedId === wod.id ? null : wod.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* WOD History */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Timer size={16} className="text-slate-500" />
            <h3 className="font-bold text-slate-800">WOD History</h3>
            <span className="text-sm text-slate-400">({pastWods.length} WODs)</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : pastWods.length === 0 && todayWods.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <p className="text-4xl mb-3">🏋️</p>
              <p className="font-semibold text-slate-600">No WODs programmed yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Click &quot;Post WOD&quot; to program your first workout for athletes.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pastWods.map((wod: any) => (
                <WodCard
                  key={wod.id}
                  wod={wod}
                  isExpanded={expandedId === wod.id}
                  onToggle={() => setExpandedId(expandedId === wod.id ? null : wod.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
