'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, User, Scale, Trophy, Loader2, Plus, Trash2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { apiClient } from '@/lib/api';

// ─── API helpers ──────────────────────────────────────────────────────────────

function fetchProfile() {
  return apiClient.get('/users/me').then((r) => r.data);
}

function fetchPRs() {
  return apiClient.get('/users/prs').then((r) => r.data?.data ?? []);
}

function updateProfile(dto: {
  name?: string;
  bio?: string;
  weight_kg?: number | null;
  height_cm?: number | null;
}) {
  return apiClient.patch('/users/me', dto).then((r) => r.data);
}

function upsertPR(payload: { exerciseName: string; value: number; unit: 'kg' | 'lb'; notes?: string }) {
  return apiClient.post('/users/prs', payload).then((r) => r.data);
}

function deletePR(prId: string) {
  return apiClient.delete(`/users/prs/${prId}`).then((r) => r.data);
}

// ─── BMI helper ───────────────────────────────────────────────────────────────

function getBMI(weight_kg: number, height_cm: number) {
  const bmi = weight_kg / Math.pow(height_cm / 100, 2);
  const label =
    bmi < 18.5 ? 'Underweight'
    : bmi < 25  ? 'Normal'
    : bmi < 30  ? 'Overweight'
    : 'Obese';
  const color =
    bmi < 18.5 ? 'text-blue-600'
    : bmi < 25  ? 'text-emerald-600'
    : bmi < 30  ? 'text-amber-600'
    : 'text-red-600';
  return { bmi: bmi.toFixed(1), label, color };
}

// ─── PR Row ───────────────────────────────────────────────────────────────────

function PRRow({ pr, onDelete }: { pr: any; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-4 border-b border-slate-100 last:border-0 group">
      <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
        <Trophy size={13} className="text-primary-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{pr.exercise_name}</p>
        {pr.source === 'auto' && (
          <p className="text-[10px] text-slate-400 italic">auto-detected</p>
        )}
      </div>
      <span className="text-sm font-bold text-primary-600 shrink-0">
        {pr.value} {pr.unit}
      </span>
      {pr.id && (
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}

// ─── Add PR form ─────────────────────────────────────────────────────────────

function AddPRForm({ onSaved }: { onSaved: () => void }) {
  const [exerciseName, setExerciseName] = useState('');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState<'kg' | 'lb'>('kg');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const name = exerciseName.trim();
    const v = parseFloat(value);
    if (!name) { setError('Exercise name is required'); return; }
    if (isNaN(v) || v <= 0) { setError('Enter a valid weight'); return; }
    try {
      setSaving(true);
      setError('');
      await upsertPR({ exerciseName: name, value: v, unit });
      setExerciseName('');
      setValue('');
      onSaved();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 space-y-2">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Add / Update PR</p>
      <div className="flex gap-2">
        <input
          value={exerciseName}
          onChange={(e) => setExerciseName(e.target.value)}
          placeholder="Exercise (e.g. Back Squat)"
          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Weight"
          type="number"
          min={0}
          className="w-24 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-semibold">
          <button
            type="button"
            onClick={() => setUnit('kg')}
            className={`px-3 py-2 transition-colors ${unit === 'kg' ? 'bg-primary-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            kg
          </button>
          <button
            type="button"
            onClick={() => setUnit('lb')}
            className={`px-3 py-2 transition-colors ${unit === 'lb' ? 'bg-primary-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            lb
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg transition-colors"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
          Save
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const qc = useQueryClient();
  const [profileSaved, setProfileSaved] = useState(false);
  const [statsSaved, setStatsSaved] = useState(false);
  const [showAddPR, setShowAddPR] = useState(false);

  // ── Profile state ──
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [populated, setPopulated] = useState(false);

  // ── Body stats state ──
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [statsError, setStatsError] = useState('');

  const profileQuery = useQuery({ queryKey: ['me'], queryFn: fetchProfile });
  const prsQuery = useQuery({ queryKey: ['user-prs'], queryFn: fetchPRs, staleTime: 5 * 60_000 });
  const prs: any[] = prsQuery.data ?? [];

  // Populate form once data loads (only once)
  if (profileQuery.data && !populated) {
    setName(profileQuery.data.name ?? profileQuery.data.user_metadata?.firstName ?? '');
    setBio(profileQuery.data.bio ?? '');
    setWeightKg(profileQuery.data.weight_kg ? String(profileQuery.data.weight_kg) : '');
    setHeightCm(profileQuery.data.height_cm ? String(profileQuery.data.height_cm) : '');
    setPopulated(true);
  }

  const profileMutation = useMutation({
    mutationFn: (dto: { name?: string; bio?: string }) => updateProfile(dto),
    onSuccess: () => {
      setProfileSaved(true);
      qc.invalidateQueries({ queryKey: ['me'] });
      setTimeout(() => setProfileSaved(false), 2500);
    },
  });

  const statsMutation = useMutation({
    mutationFn: (dto: { weight_kg?: number; height_cm?: number }) => updateProfile(dto),
    onSuccess: () => {
      setStatsSaved(true);
      qc.invalidateQueries({ queryKey: ['me'] });
      setTimeout(() => setStatsSaved(false), 2500);
    },
  });

  const deletePRMutation = useMutation({
    mutationFn: (prId: string) => deletePR(prId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user-prs'] }),
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    profileMutation.mutate({ name: name.trim(), bio: bio.trim() });
  };

  const handleStatsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatsError('');
    const w = weightKg.trim() ? parseFloat(weightKg) : null;
    const h = heightCm.trim() ? parseFloat(heightCm) : null;
    if (w !== null && (isNaN(w) || w < 30 || w > 300)) {
      setStatsError('Weight must be between 30 and 300 kg.');
      return;
    }
    if (h !== null && (isNaN(h) || h < 100 || h > 250)) {
      setStatsError('Height must be between 100 and 250 cm.');
      return;
    }
    const dto: Record<string, number | null> = {};
    if (w !== null) dto.weight_kg = w;
    if (h !== null) dto.height_cm = h;
    statsMutation.mutate(dto as any);
  };

  const w = parseFloat(weightKg);
  const h = parseFloat(heightCm);
  const bmiData = !isNaN(w) && !isNaN(h) && w > 0 && h > 0 ? getBMI(w, h) : null;

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Settings" subtitle="Manage your account and fitness profile" />
      <main className="flex-1 p-6 space-y-6 max-w-lg overflow-y-auto">

        {/* ── Profile ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
            <User size={18} className="text-slate-500" />
            <h2 className="font-semibold text-slate-800">Profile</h2>
          </div>

          {profileQuery.isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <form onSubmit={handleProfileSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
              {profileMutation.isError && (
                <p className="text-sm text-red-600">Failed to save changes.</p>
              )}
              <button
                type="submit"
                disabled={profileMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {profileMutation.isPending
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Save size={14} />}
                {profileMutation.isPending ? 'Saving…' : profileSaved ? '✓ Saved!' : 'Save Profile'}
              </button>
            </form>
          )}
        </div>

        {/* ── Body Stats ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
            <Scale size={18} className="text-slate-500" />
            <div>
              <h2 className="font-semibold text-slate-800">Body Stats</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Used to personalise weight recommendations in your workouts
              </p>
            </div>
          </div>

          <form onSubmit={handleStatsSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Body Weight <span className="text-slate-400 font-normal">(kg)</span>
                </label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="e.g. 80"
                  min={30}
                  max={300}
                  step={0.1}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Height <span className="text-slate-400 font-normal">(cm)</span>
                </label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  placeholder="e.g. 178"
                  min={100}
                  max={250}
                  step={0.5}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* BMI display */}
            {bmiData && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-center">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">BMI</p>
                  <p className={`text-2xl font-black ${bmiData.color}`}>{bmiData.bmi}</p>
                  <p className={`text-xs font-semibold ${bmiData.color}`}>{bmiData.label}</p>
                </div>
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden ml-3">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (parseFloat(bmiData.bmi) / 40) * 100)}%`,
                      background: parseFloat(bmiData.bmi) < 18.5 ? '#3b82f6'
                        : parseFloat(bmiData.bmi) < 25 ? '#10b981'
                        : parseFloat(bmiData.bmi) < 30 ? '#f59e0b'
                        : '#ef4444',
                    }}
                  />
                </div>
                <div className="text-right text-xs text-slate-400 shrink-0">
                  <p>Normal: 18.5–24.9</p>
                </div>
              </div>
            )}

            {statsError && <p className="text-sm text-red-600">{statsError}</p>}

            <button
              type="submit"
              disabled={statsMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {statsMutation.isPending
                ? <Loader2 size={14} className="animate-spin" />
                : <Save size={14} />}
              {statsMutation.isPending ? 'Saving…' : statsSaved ? '✓ Saved!' : 'Save Stats'}
            </button>
          </form>
        </div>

        {/* ── Personal Records ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-slate-500" />
              <h2 className="font-semibold text-slate-800">Personal Records (PRs)</h2>
            </div>
            <button
              onClick={() => setShowAddPR(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-600 bg-primary-50 rounded-full hover:bg-primary-100 transition-colors"
            >
              <Plus size={13} />
              Add PR
            </button>
          </div>

          {prsQuery.isLoading ? (
            <div className="p-6 space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : prs.length === 0 && !showAddPR ? (
            <div className="flex flex-col items-center py-10 gap-2 text-center px-6">
              <Trophy size={28} className="text-slate-200" />
              <p className="text-sm font-semibold text-slate-400">No PRs yet</p>
              <p className="text-xs text-slate-400">
                Add your 1RM lifts — they'll be used to calculate weights in your programmed workouts.
              </p>
              <button
                onClick={() => setShowAddPR(true)}
                className="mt-2 px-4 py-2 text-xs font-bold bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors"
              >
                Add first PR
              </button>
            </div>
          ) : (
            <>
              {prs.map((pr: any, i: number) => (
                <PRRow
                  key={`${pr.exercise_name}-${i}`}
                  pr={pr}
                  onDelete={() => {
                    if (pr.id && confirm(`Delete ${pr.exercise_name} PR?`)) {
                      deletePRMutation.mutate(pr.id);
                    }
                  }}
                />
              ))}
            </>
          )}

          {showAddPR && (
            <AddPRForm
              onSaved={() => {
                qc.invalidateQueries({ queryKey: ['user-prs'] });
                setShowAddPR(false);
              }}
            />
          )}
        </div>

      </main>
    </div>
  );
}
