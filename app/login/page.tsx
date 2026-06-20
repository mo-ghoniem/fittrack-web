'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Zap, ArrowRight } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => setChecking(false), 3000);
    supabase.auth.getSession().then(({ data }) => {
      clearTimeout(timeout);
      if (data.session) {
        router.replace(redirect ?? '/dashboard');
      } else {
        setChecking(false);
      }
    }).catch(() => {
      clearTimeout(timeout);
      setChecking(false);
    });
  }, [router, redirect]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push(redirect ?? '/dashboard');
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div
          className="w-10 h-10 rounded-full animate-spin"
          style={{ border: '2px solid rgba(189,255,46,0.2)', borderTopColor: '#bdff2e' }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base text-ink flex relative overflow-hidden">
      {/* Ambient blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(189,255,46,0.15) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.15) 0%, transparent 70%)' }}
        />
        {/* Dot grid */}
        <div className="absolute inset-0 dot-grid opacity-40" />
      </div>

      {/* Left panel â€” decorative, desktop only */}
      <div className="hidden lg:flex w-[480px] shrink-0 flex-col justify-between p-12 relative">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-lime-gradient"
              style={{ boxShadow: '0 0 24px -4px rgba(189,255,46,0.7)' }}
            >
              <Zap size={20} style={{ color: '#0a0b0e' }} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-extrabold tracking-tight">FitTrack</span>
          </div>

          <h2 className="text-4xl font-extrabold leading-tight mb-4 tracking-tight">
            Train smarter.<br />
            <span
              style={{
                background: 'linear-gradient(135deg, #d8ff5c, #22d3ee)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Track better.
            </span>
          </h2>
          <p className="text-ink-muted text-base leading-relaxed max-w-xs">
            The all-in-one platform for CrossFit coaches and athletes to manage workouts, track progress, and celebrate PRs.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { value: '10K+', label: 'Workouts tracked' },
            { value: '500+', label: 'Active coaches' },
            { value: '98%', label: 'Athlete satisfaction' },
            { value: 'âˆž', label: 'PRs broken' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl p-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <p className="text-2xl font-extrabold text-primary-400">{s.value}</p>
              <p className="text-xs text-ink-muted mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel â€” form */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-10">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-lime-gradient"
              style={{ boxShadow: '0 0 24px -4px rgba(189,255,46,0.7)' }}
            >
              <Zap size={20} style={{ color: '#0a0b0e' }} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-extrabold tracking-tight">FitTrack</span>
          </div>

          <div
            className="rounded-3xl p-8"
            style={{
              background: 'rgba(16,17,20,0.9)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 32px 80px -20px rgba(0,0,0,0.9), 0 0 0 1px rgba(189,255,46,0.06)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <h1 className="text-2xl font-extrabold text-ink tracking-tight mb-1">Welcome back</h1>
            <p className="text-ink-muted text-sm mb-7">Sign in to your FitTrack account</p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/25 text-red-300 text-sm rounded-xl px-4 py-3 mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl text-sm transition-all',
                    'text-ink placeholder:text-ink-subtle',
                    'focus:outline-none focus:ring-2 focus:ring-primary-400/50',
                  )}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl text-sm transition-all',
                    'text-ink placeholder:text-ink-subtle',
                    'focus:outline-none focus:ring-2 focus:ring-primary-400/50',
                  )}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  autoComplete="current-password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={cn(
                  'btn-lime w-full py-3.5 px-4 rounded-2xl font-bold text-sm',
                  'flex items-center justify-center gap-2',
                  'transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-primary-400/60 focus:ring-offset-2 focus:ring-offset-surface-base',
                  submitting && 'opacity-70 cursor-not-allowed',
                )}
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                    Signing inâ€¦
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={16} strokeWidth={2.5} />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-ink-muted mt-6">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="text-primary-300 font-semibold hover:text-primary-200 transition-colors"
              >
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-base text-ink flex items-center justify-center">
        <div
          className="w-10 h-10 rounded-full animate-spin"
          style={{ border: '2px solid rgba(189,255,46,0.2)', borderTopColor: '#bdff2e' }}
        />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

