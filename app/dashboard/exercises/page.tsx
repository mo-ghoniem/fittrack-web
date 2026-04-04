'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Trash2, Edit, Dumbbell, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/Badge';
import { Table, Thead, Tbody, Th, Td, Tr } from '@/components/ui/Table';
import { CoachGuard } from '@/components/layout/CoachGuard';
import { exercisesApi } from '@/lib/api';
import { cn } from '@/lib/utils';

const CATEGORIES = ['strength', 'cardio', 'flexibility', 'balance', 'plyometrics'];
const MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'core', 'quads', 'hamstrings', 'glutes', 'calves'];

interface CreateExerciseForm {
  name: string;
  description: string;
  category: string;
  muscleGroups: string[];
  equipment: string[];
  isPublic: boolean;
}

const DEFAULT_FORM: CreateExerciseForm = {
  name: '',
  description: '',
  category: '',
  muscleGroups: [],
  equipment: [],
  isPublic: true,
};

function ToggleChip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'px-3 py-1 rounded-full text-xs font-semibold border transition-colors capitalize',
        selected
          ? 'bg-primary-600 border-primary-600 text-white'
          : 'bg-white border-slate-200 text-slate-600 hover:border-primary-400',
      )}
    >
      {label}
    </button>
  );
}

export default function ExercisesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CreateExerciseForm>(DEFAULT_FORM);
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['exercises', search, categoryFilter],
    queryFn: () =>
      exercisesApi.list({
        search: search || undefined,
        category: categoryFilter || undefined,
        limit: 50,
      }),
  });

  const exercises = data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (dto: CreateExerciseForm) =>
      exercisesApi.create({
        ...dto,
        muscleGroups: dto.muscleGroups,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exercises'] });
      setShowModal(false);
      setForm(DEFAULT_FORM);
      setFormError('');
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message ?? 'Failed to create exercise');
    },
  });

  const seedMutation = useMutation({
    mutationFn: exercisesApi.seed,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercises'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: exercisesApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercises'] }),
  });

  const toggleMuscle = (m: string) =>
    setForm((f) => ({
      ...f,
      muscleGroups: f.muscleGroups.includes(m)
        ? f.muscleGroups.filter((x) => x !== m)
        : [...f.muscleGroups, m],
    }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError('Name is required.');
      return;
    }
    setFormError('');
    createMutation.mutate(form);
  };

  const categoryColor: Record<string, 'info' | 'success' | 'warning'> = {
    strength: 'info',
    cardio: 'success',
    flexibility: 'warning',
  };

  return (
    <CoachGuard>
    <div className="flex flex-col min-h-full">
      <Header title="Exercise Library" subtitle="Manage exercises available to all users" />

      <main className="flex-1 p-6 overflow-y-auto">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search exercises…"
              className="pl-9 pr-4 py-2 w-full text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="py-2 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">
                {c}
              </option>
            ))}
          </select>

          <div className="flex gap-2 sm:ml-auto">
            <button
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-60"
            >
              {seedMutation.isPending ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Dumbbell size={15} />
              )}
              Seed Defaults
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus size={15} />
              Add Exercise
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <Table>
            <Thead>
              <tr>
                <Th>Name</Th>
                <Th>Category</Th>
                <Th>Muscle Groups</Th>
                <Th>Equipment</Th>
                <Th>Visibility</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </Thead>
            <Tbody>
              {isLoading ? (
                <Tr>
                  <Td className="py-12 text-center text-slate-400" colSpan={6 as any}>
                    Loading…
                  </Td>
                </Tr>
              ) : exercises.length === 0 ? (
                <Tr>
                  <Td className="py-12 text-center text-slate-400" colSpan={6 as any}>
                    No exercises found. Try seeding defaults or adding one.
                  </Td>
                </Tr>
              ) : (
                exercises.map((ex: any) => (
                  <Tr key={ex.id}>
                    <Td>
                      <p className="font-medium text-slate-900">{ex.name}</p>
                      {ex.description && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                          {ex.description}
                        </p>
                      )}
                    </Td>
                    <Td>
                      <Badge variant={categoryColor[ex.category] ?? 'default'}>
                        {ex.category}
                      </Badge>
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        {(ex.muscle_groups ?? []).slice(0, 3).map((m: string) => (
                          <Badge key={m} variant="default">
                            {m}
                          </Badge>
                        ))}
                        {ex.muscle_groups?.length > 3 && (
                          <Badge variant="default">+{ex.muscle_groups.length - 3}</Badge>
                        )}
                      </div>
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        {(ex.equipment ?? []).slice(0, 2).map((e: string) => (
                          <Badge key={e} variant="default">
                            {e}
                          </Badge>
                        ))}
                      </div>
                    </Td>
                    <Td>
                      <Badge variant={ex.is_public ? 'success' : 'warning'}>
                        {ex.is_public ? 'Public' : 'Private'}
                      </Badge>
                    </Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${ex.name}"?`)) {
                              deleteMutation.mutate(ex.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
          {data && (
            <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
              {data.total} exercise{data.total !== 1 ? 's' : ''} total
            </div>
          )}
        </div>
      </main>

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Add Exercise</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Exercise name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Barbell Bench Press"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional description…"
                  rows={2}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">— none —</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="capitalize">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Muscle Groups
                </label>
                <div className="flex flex-wrap gap-2">
                  {MUSCLE_GROUPS.map((m) => (
                    <ToggleChip
                      key={m}
                      label={m}
                      selected={form.muscleGroups.includes(m)}
                      onToggle={() => toggleMuscle(m)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Equipment
                </label>
                <div className="flex flex-wrap gap-2">
                  {['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'kettlebell'].map(
                    (eq) => (
                      <ToggleChip
                        key={eq}
                        label={eq}
                        selected={form.equipment.includes(eq)}
                        onToggle={() =>
                          setForm((f) => ({
                            ...f,
                            equipment: f.equipment.includes(eq)
                              ? f.equipment.filter((x) => x !== eq)
                              : [...f.equipment, eq],
                          }))
                        }
                      />
                    ),
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={form.isPublic}
                  onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="isPublic" className="text-sm text-slate-700">
                  Make public (visible to all users)
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setForm(DEFAULT_FORM);
                    setFormError('');
                  }}
                  className="flex-1 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                  Add Exercise
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </CoachGuard>
  );
}
