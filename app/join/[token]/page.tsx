'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { coachingApi } from '@/lib/api';
import Link from 'next/link';

type Status = 'loading' | 'joining' | 'success' | 'already' | 'error' | 'auth_required';

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;

    async function attemptJoin() {
      // Check if the user is logged in
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Save token to sessionStorage so we can join after login
        sessionStorage.setItem('pendingJoinToken', token);
        setStatus('auth_required');
        return;
      }

      setStatus('joining');

      try {
        const result = await coachingApi.joinViaToken(token);
        if (result?.message?.includes('already')) {
          setStatus('already');
        } else {
          setStatus('success');
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(err?.response?.data?.message ?? 'This invitation link is invalid or has expired.');
      }
    }

    attemptJoin();
  }, [token, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-2xl shadow-lg mb-4">
            <span className="text-2xl">🏋️</span>
          </div>
          <h1 className="text-3xl font-bold text-white">FitTrack</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">

          {/* Loading */}
          {(status === 'loading' || status === 'joining') && (
            <>
              <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
                <div className="w-7 h-7 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800">
                {status === 'loading' ? 'Checking invitation…' : 'Joining team…'}
              </h2>
              <p className="text-slate-500 text-sm mt-2">Just a moment</p>
            </>
          )}

          {/* Success */}
          {status === 'success' && (
            <>
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎉</span>
              </div>
              <h2 className="text-xl font-semibold text-slate-800">You're in!</h2>
              <p className="text-slate-500 text-sm mt-2 mb-6">
                You've successfully joined the coach's team. Your workouts will start appearing in your calendar.
              </p>
              <Link
                href="/dashboard"
                className="inline-block w-full py-3 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors"
              >
                Go to My Dashboard
              </Link>
            </>
          )}

          {/* Already a member */}
          {status === 'already' && (
            <>
              <div className="w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="text-xl font-semibold text-slate-800">Already on the team</h2>
              <p className="text-slate-500 text-sm mt-2 mb-6">
                You're already an active member of this coach's team.
              </p>
              <Link
                href="/dashboard"
                className="inline-block w-full py-3 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors"
              >
                Go to My Dashboard
              </Link>
            </>
          )}

          {/* Not logged in */}
          {status === 'auth_required' && (
            <>
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">👋</span>
              </div>
              <h2 className="text-xl font-semibold text-slate-800">Sign in to join</h2>
              <p className="text-slate-500 text-sm mt-2 mb-6">
                You need a FitTrack account to accept this invitation. The invite link will be remembered after you sign in.
              </p>
              <div className="space-y-3">
                <Link
                  href={`/login?redirect=/join/${token}`}
                  className="block w-full py-3 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href={`/register?redirect=/join/${token}`}
                  className="block w-full py-3 text-sm font-semibold text-primary-700 bg-primary-50 border border-primary-200 rounded-xl hover:bg-primary-100 transition-colors"
                >
                  Create an account
                </Link>
              </div>
            </>
          )}

          {/* Error */}
          {status === 'error' && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">❌</span>
              </div>
              <h2 className="text-xl font-semibold text-slate-800">Link not valid</h2>
              <p className="text-slate-500 text-sm mt-2 mb-6">
                {message || 'This invitation link is invalid or has expired. Ask your coach for a new one.'}
              </p>
              <Link
                href="/dashboard"
                className="inline-block w-full py-3 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Go to Dashboard
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
