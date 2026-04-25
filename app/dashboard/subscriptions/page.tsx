'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard, Users, TrendingUp, DollarSign, CheckCircle,
  XCircle, Clock, Plus, Loader2, AlertCircle,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { CoachGuard } from '@/components/layout/CoachGuard';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { subscriptionsApi } from '@/lib/api';

type BillingCycle = 'monthly' | 'quarterly' | 'yearly';

const BILLING_LABELS: Record<BillingCycle, string> = {
  monthly: '/mo',
  quarterly: '/3 mo',
  yearly: '/yr',
};

const STATUS_COLORS: Record<string, 'success' | 'error' | 'warning' | 'info'> = {
  active: 'success',
  expired: 'error',
  cancelled: 'warning',
  pending: 'info',
};

const PAYMENT_LABELS: Record<string, string> = {
  fawry: '🏪 Fawry',
  vodafone_cash: '📱 Vodafone Cash',
  instapay: '💳 InstaPay',
  card: '💳 Card',
};

/* ── Create Plan Modal ─────────────────────────────────── */
function CreatePlanModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [maxAthletes, setMaxAthletes] = useState('');
  const [features, setFeatures] = useState('');
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: () =>
      subscriptionsApi.createPlan({
        name,
        priceEgp: Number(price),
        billingCycle: cycle,
        maxAthletes: maxAthletes ? Number(maxAthletes) : undefined,
        features: features.split('\n').map((f) => f.trim()).filter(Boolean),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscription-plans'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message ?? 'Failed to create plan');
    },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Create Subscription Plan</h2>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Plan Name *</label>
            <input
              value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g. Starter, Pro, Elite"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Price (EGP) *</label>
              <input
                type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="299"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Billing Cycle</label>
              <select
                value={cycle}
                onChange={(e) => setCycle(e.target.value as BillingCycle)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Max Athletes</label>
            <input
              type="number" value={maxAthletes} onChange={(e) => setMaxAthletes(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Leave empty for unlimited"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Features <span className="text-slate-400 font-normal">(one per line)</span>
            </label>
            <textarea
              value={features} onChange={(e) => setFeatures(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Unlimited workout logging&#10;Progress photo tracking&#10;Direct athlete messaging&#10;Analytics dashboard"
            />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !name || !price}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
            Create Plan
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────── */
export default function SubscriptionsPage() {
  const [showCreate, setShowCreate] = useState(false);

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: subscriptionsApi.getPlans,
  });

  const { data: allSubs = [], isLoading: subsLoading } = useQuery({
    queryKey: ['all-subscriptions'],
    queryFn: subscriptionsApi.getAll,
  });

  const activeSubs = allSubs.filter((s: any) => s.status === 'active');
  const totalRevenue = allSubs.reduce((acc: number, s: any) => acc + (s.amount_paid_egp ?? 0), 0);
  const monthlyRevenue = allSubs
    .filter((s: any) => s.status === 'active' && s.plan?.billing_cycle === 'monthly')
    .reduce((acc: number, s: any) => acc + (s.amount_paid_egp ?? 0), 0);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <CoachGuard>
    <div className="flex flex-col min-h-full">
      <Header
        title="Subscriptions"
        subtitle="Manage coaching plans and revenue"
      />

      <main className="flex-1 p-6 overflow-y-auto space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Active Subscriptions"
            value={String(activeSubs.length)}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            label="Total Revenue"
            value={`${totalRevenue.toLocaleString()} EGP`}
            icon={DollarSign}
            color="blue"
          />
          <StatCard
            label="Monthly Revenue"
            value={`${monthlyRevenue.toLocaleString()} EGP`}
            icon={TrendingUp}
            color="purple"
          />
          <StatCard
            label="Plans Available"
            value={String(plans.length)}
            icon={CreditCard}
            color="orange"
          />
        </div>

        {/* Plans */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-900">Subscription Plans</h2>
              <p className="text-xs text-slate-500 mt-0.5">Plans available to coaches on FitTrack</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 shrink-0 whitespace-nowrap"
            >
              <Plus size={15} />
              New Plan
            </button>
          </div>

          {plansLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 size={24} className="animate-spin text-primary-500" />
            </div>
          ) : plans.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 text-center px-6">
              <CreditCard size={32} className="text-slate-300" />
              <p className="font-medium text-slate-600">No plans yet</p>
              <p className="text-sm text-slate-400">Create your first subscription plan</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
              {plans.map((plan: any) => (
                <div
                  key={plan.id}
                  className="border border-slate-200 rounded-xl p-5 hover:border-primary-200 hover:bg-primary-50/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-slate-900">{plan.name}</h3>
                    <Badge variant="info">{plan.billing_cycle}</Badge>
                  </div>
                  <p className="text-2xl font-black text-primary-600 mb-1">
                    {plan.price_egp.toLocaleString()}
                    <span className="text-sm font-normal text-slate-400"> EGP{BILLING_LABELS[plan.billing_cycle as BillingCycle]}</span>
                  </p>
                  {plan.max_athletes && (
                    <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                      <Users size={12} />
                      Up to {plan.max_athletes} athletes
                    </p>
                  )}
                  {plan.features?.length > 0 && (
                    <ul className="space-y-1 mt-3">
                      {plan.features.map((f: string, i: number) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                          <CheckCircle size={12} className="text-emerald-500 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Subscriptions Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">All Subscriptions</h2>
            <p className="text-xs text-slate-500 mt-0.5">Subscription history across all coaches</p>
          </div>

          {subsLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 size={24} className="animate-spin text-primary-500" />
            </div>
          ) : allSubs.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 text-center px-6">
              <AlertCircle size={32} className="text-slate-300" />
              <p className="font-medium text-slate-600">No subscriptions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Coach</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Plan</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Payment</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Expires</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {allSubs.map((sub: any) => (
                    <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-slate-900">{sub.coach?.name ?? 'Unknown'}</p>
                        <p className="text-xs text-slate-400">{sub.coach?.email}</p>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-700">{sub.plan?.name ?? '-'}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-slate-900">
                        {sub.amount_paid_egp?.toLocaleString()} EGP
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">
                        {PAYMENT_LABELS[sub.payment_method] ?? sub.payment_method}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">
                        {sub.expires_at ? formatDate(sub.expires_at) : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={STATUS_COLORS[sub.status] ?? 'info'}>
                          {sub.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {showCreate && <CreatePlanModal onClose={() => setShowCreate(false)} />}
    </div>
    </CoachGuard>
  );
}
