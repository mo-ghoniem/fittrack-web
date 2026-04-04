'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, CheckCheck, Loader2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { notificationsApi } from '@/lib/api';

/* ─── Types ──────────────────────────────────────────────────────── */
interface Notification {
  id:         string;
  type:       string;
  title:      string;
  message:    string;
  data:       Record<string, unknown>;
  read:       boolean;
  created_at: string;
}

/* ─── Icon by notification type ──────────────────────────────────── */
const TYPE_ICON: Record<string, string> = {
  workout_assigned:    '💪',
  comment_added:       '💬',
  workout_missed:      '⚠️',
  subscription_ending: '🔔',
  athlete_logged:      '✅',
  athlete_missed:      '⚠️',
  cycle_ended:         '📋',
};

const TYPE_COLOR: Record<string, string> = {
  workout_assigned:    'bg-blue-50   border-blue-100',
  comment_added:       'bg-violet-50 border-violet-100',
  workout_missed:      'bg-amber-50  border-amber-100',
  subscription_ending: 'bg-orange-50 border-orange-100',
  athlete_logged:      'bg-emerald-50 border-emerald-100',
  athlete_missed:      'bg-amber-50  border-amber-100',
  cycle_ended:         'bg-rose-50   border-rose-100',
};

/* ─── Relative time helper ───────────────────────────────────────── */
function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/* ═══════════════════════════════════════════════════════════════════
   NotificationBell
═══════════════════════════════════════════════════════════════════ */
export function NotificationBell() {
  const [open,         setOpen]         = useState(false);
  const [notifs,       setNotifs]       = useState<Notification[]>([]);
  const [unread,       setUnread]       = useState(0);
  const [loading,      setLoading]      = useState(false);
  const [markingAll,   setMarkingAll]   = useState(false);
  const [userId,       setUserId]       = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  /* ── Get current user ───────────────────────────────── */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  /* ── Fetch notifications from API ───────────────────── */
  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationsApi.list({ limit: 30 });
      setNotifs(res.data ?? []);
      setUnread(res.unreadCount ?? 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Initial load ───────────────────────────────────── */
  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  /* ── Supabase Realtime — live badge + list updates ──── */
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifs((prev) => [newNotif, ...prev]);
          setUnread((c) => c + 1);
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  /* ── Close panel on outside click ───────────────────── */
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Mark single as read ─────────────────────────────── */
  const markOne = async (id: string) => {
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setUnread((c) => Math.max(0, c - 1));
    await notificationsApi.markRead(id).catch(() => {});
  };

  /* ── Mark all as read ───────────────────────────────── */
  const markAll = async () => {
    setMarkingAll(true);
    try {
      await notificationsApi.markAllRead();
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } finally {
      setMarkingAll(false);
    }
  };

  /* ── Open → refresh list ─────────────────────────────── */
  const handleOpen = () => {
    setOpen((o) => !o);
    if (!open) fetchNotifs();
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} strokeWidth={1.8} />

        {/* Unread badge */}
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center
            bg-red-500 text-white text-[10px] font-bold rounded-full leading-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-slate-200
          shadow-xl z-50 overflow-hidden flex flex-col max-h-[480px]">

          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-900 text-sm">Notifications</p>
              {unread > 0 && (
                <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                  {unread}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={markAll}
                  disabled={markingAll}
                  className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium
                    px-2 py-1 rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-50"
                  title="Mark all as read"
                >
                  {markingAll
                    ? <Loader2 size={12} className="animate-spin"/>
                    : <CheckCheck size={13}/>
                  }
                  All read
                </button>
              )}
              <button onClick={() => setOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
                <X size={14}/>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1">
            {loading && notifs.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-2">
                <Loader2 size={20} className="animate-spin text-primary-400"/>
                <p className="text-sm text-slate-400">Loading…</p>
              </div>
            ) : notifs.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-2">
                <Bell size={28} className="text-slate-200"/>
                <p className="text-sm text-slate-400">No notifications yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-50">
                {notifs.map((n) => (
                  <li
                    key={n.id}
                    onClick={() => { if (!n.read) markOne(n.id); }}
                    className={`relative px-4 py-3 cursor-pointer transition-colors
                      ${n.read ? 'bg-white hover:bg-slate-50' : 'bg-blue-50/40 hover:bg-blue-50/70'}`}
                  >
                    <div className="flex gap-3">
                      {/* Emoji icon */}
                      <div className={`w-9 h-9 flex items-center justify-center rounded-xl border text-lg shrink-0
                        ${TYPE_COLOR[n.type] ?? 'bg-slate-50 border-slate-100'}`}>
                        {TYPE_ICON[n.type] ?? '🔔'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-semibold leading-snug
                            ${n.read ? 'text-slate-700' : 'text-slate-900'}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">
                            {timeAgo(n.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                          {n.message}
                        </p>
                      </div>

                      {/* Unread dot */}
                      {!n.read && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary-500 rounded-full shrink-0"/>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifs.length > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-100 shrink-0">
              <button
                onClick={fetchNotifs}
                disabled={loading}
                className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center gap-1"
              >
                {loading ? <Loader2 size={11} className="animate-spin"/> : null}
                Refresh
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
