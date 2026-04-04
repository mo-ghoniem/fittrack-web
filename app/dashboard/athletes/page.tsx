'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserPlus, Trash2, Loader2, Check, X, Mail, Users,
  Link2, Copy, MessageCircle, RefreshCw, CheckCheck,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { CoachGuard } from '@/components/layout/CoachGuard';
import { Badge } from '@/components/ui/Badge';
import { coachingApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

function AthleteAvatar({ name }: { name: string }) {
  const colors = [
    'bg-primary-100 text-primary-700',
    'bg-emerald-100 text-emerald-700',
    'bg-violet-100 text-violet-700',
    'bg-orange-100 text-orange-700',
    'bg-rose-100 text-rose-700',
  ];
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${color}`}>
      {initials || '?'}
    </div>
  );
}

/* ── Share button row ─────────────────────────────────── */
function ShareButtons({ link, coachName }: { link: string; coachName?: string }) {
  const message = `Join ${coachName ? `${coachName}'s` : 'my'} coaching team on FitTrack! Click to join: ${link}`;

  const openWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const openEmail = () => {
    const subject = encodeURIComponent('Join my FitTrack coaching team');
    const body = encodeURIComponent(message);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const openSMS = () => {
    window.open(`sms:?body=${encodeURIComponent(message)}`, '_blank');
  };

  const openMessenger = () => {
    window.open(`fb-messenger://share/?link=${encodeURIComponent(link)}`, '_blank');
  };

  return (
    <div className="grid grid-cols-2 gap-2 mt-1">
      <button
        onClick={openWhatsApp}
        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium bg-[#25D366] text-white hover:opacity-90 transition-opacity"
      >
        {/* WhatsApp icon */}
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        WhatsApp
      </button>

      <button
        onClick={openEmail}
        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium bg-slate-700 text-white hover:bg-slate-800 transition-colors"
      >
        <Mail size={15} />
        Email
      </button>

      <button
        onClick={openMessenger}
        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium bg-[#0084FF] text-white hover:opacity-90 transition-opacity"
      >
        <MessageCircle size={15} />
        Messenger
      </button>

      <button
        onClick={openSMS}
        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
      >
        <MessageCircle size={15} />
        SMS
      </button>
    </div>
  );
}

/* ── Invite Link Modal ────────────────────────────────── */
function InviteLinkModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data: currentInv, isLoading: checkingInv } = useQuery({
    queryKey: ['active-invitation'],
    queryFn: coachingApi.getActiveInvitation,
  });

  const generateMutation = useMutation({
    mutationFn: coachingApi.generateInvitation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['active-invitation'] }),
  });

  const link = currentInv?.link ?? generateMutation.data?.link ?? null;

  const copyLink = () => {
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <Link2 size={18} className="text-primary-600" />
            Invite Athletes
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Share this link — any athlete who opens it will be added to your team.
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* Link box */}
          {checkingInv ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={22} className="animate-spin text-primary-500" />
            </div>
          ) : link ? (
            <>
              {/* Link display */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <p className="flex-1 text-sm text-slate-700 font-mono truncate">{link}</p>
                <button
                  onClick={copyLink}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    copied
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {/* Expiry notice */}
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                Link expires in 7 days and can only be used once.
              </p>

              {/* Share buttons */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Share via
                </p>
                <ShareButtons link={link} />
              </div>

              {/* Generate new link */}
              <button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                <RefreshCw size={12} className={generateMutation.isPending ? 'animate-spin' : ''} />
                Generate a new link
              </button>
            </>
          ) : (
            /* No active invitation yet */
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center">
                <Link2 size={24} className="text-primary-500" />
              </div>
              <div>
                <p className="font-medium text-slate-800">No active invite link</p>
                <p className="text-sm text-slate-500 mt-1">
                  Generate a link to share with your athletes.
                </p>
              </div>
              <button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                className="px-6 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {generateMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                Generate Invite Link
              </button>
            </div>
          )}
        </div>

        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────── */
export default function AthletesPage() {
  const qc = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addError, setAddError] = useState('');

  /* ── Data queries ── */
  const { data: athletesData, isLoading } = useQuery({
    queryKey: ['my-athletes'],
    queryFn: coachingApi.getMyAthletes,
  });

  const { data: pendingData } = useQuery({
    queryKey: ['coaching-pending'],
    queryFn: coachingApi.getPending,
  });

  const athletes = athletesData?.data ?? [];
  const pendingReceived = (pendingData?.data ?? []).filter(
    (r: any) => r.type === 'received',
  );

  /* ── Mutations ── */
  const addMutation = useMutation({
    mutationFn: (email: string) => coachingApi.addAthlete(email),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-athletes'] });
      setShowAddModal(false);
      setAddEmail('');
      setAddError('');
    },
    onError: (err: any) => {
      setAddError(err?.response?.data?.message ?? 'Could not add athlete');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (relationshipId: string) => coachingApi.removeAthlete(relationshipId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-athletes'] }),
  });

  const acceptMutation = useMutation({
    mutationFn: (requestId: string) => coachingApi.acceptRequest(requestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-athletes'] });
      qc.invalidateQueries({ queryKey: ['coaching-pending'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId: string) => coachingApi.rejectRequest(requestId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coaching-pending'] }),
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addEmail.trim()) {
      setAddError('Please enter an email address');
      return;
    }
    setAddError('');
    addMutation.mutate(addEmail.trim());
  };

  return (
    <CoachGuard>
      <div className="flex flex-col min-h-full">
        <Header
          title="My Athletes"
          subtitle={`${athletes.length} active athlete${athletes.length !== 1 ? 's' : ''}`}
        />

        <main className="flex-1 p-6 overflow-y-auto space-y-6">

          {/* Pending requests (received) */}
          {pendingReceived.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <h2 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                <Mail size={16} />
                Pending Requests ({pendingReceived.length})
              </h2>
              <div className="space-y-2">
                {pendingReceived.map((req: any) => (
                  <div
                    key={req.relationshipId}
                    className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 border border-amber-100"
                  >
                    <AthleteAvatar name={req.profile?.name ?? req.otherUserId} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {req.profile?.name ?? 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-500">
                        Requested {formatDate(req.requestedAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptMutation.mutate(req.relationshipId)}
                        disabled={acceptMutation.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-60"
                      >
                        <Check size={13} /> Accept
                      </button>
                      <button
                        onClick={() => rejectMutation.mutate(req.relationshipId)}
                        disabled={rejectMutation.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-60"
                      >
                        <X size={13} /> Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Athletes list */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-900">Active Athletes</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Athletes currently under your coaching
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <Link2 size={15} />
                  Invite Link
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <UserPlus size={15} />
                  Add by Email
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="py-16 flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-primary-500" />
              </div>
            ) : athletes.length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-4 text-center px-6">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
                  <Users size={24} className="text-slate-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-700">No athletes yet</p>
                  <p className="text-sm text-slate-400 max-w-xs mt-1">
                    Invite athletes via a shareable link or add them directly by email.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="px-5 py-2 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors flex items-center gap-2"
                  >
                    <Link2 size={14} /> Share Invite Link
                  </button>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-5 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Add by Email
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {athletes.map((athlete: any) => (
                  <div
                    key={athlete.relationshipId}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
                  >
                    <AthleteAvatar name={athlete.profile?.name ?? athlete.athleteId} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        {athlete.profile?.name ?? 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-500">
                        Coaching since {formatDate(athlete.coachingSince)}
                      </p>
                    </div>
                    <Badge variant="success">Active</Badge>
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${athlete.profile?.name ?? 'this athlete'} from your roster?`)) {
                          removeMutation.mutate(athlete.relationshipId);
                        }
                      }}
                      disabled={removeMutation.isPending}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                      title="Remove athlete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Invite link modal */}
      {showInviteModal && <InviteLinkModal onClose={() => setShowInviteModal(false)} />}

      {/* Add by email modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Add Athlete by Email</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Enter the athlete's email address to add them directly.
              </p>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              {addError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {addError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Athlete email *
                </label>
                <input
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="athlete@example.com"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  The athlete must already have a FitTrack account.
                </p>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setAddEmail(''); setAddError(''); }}
                  className="flex-1 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending}
                  className="flex-1 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {addMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                  Add Athlete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </CoachGuard>
  );
}
