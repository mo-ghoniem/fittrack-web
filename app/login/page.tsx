export const dynamic = 'force-dynamic';

<<<<<<< HEAD
import { useState, useEffect, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import Link from 'next/link';

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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base text-ink flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient lime/cyan glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 10%, rgba(189,255,46,0.10) 0%, transparent 50%), radial-gradient(circle at 80% 90%, rgba(34,211,238,0.08) 0%, transparent 55%)',
        }}
      />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 bg-lime-gradient"
            style={{ boxShadow: '0 0 30px -4px rgba(189,255,46,0.6)' }}
          >
            <span className="text-2xl">🏋️</span>
          </div>
          <h1 className="text-3xl font-bold text-ink tracking-tight">FitTrack</h1>
          <p className="text-ink-muted mt-1 text-sm">Admin Dashboard</p>
        </div>

        {/* Card */}
        <div className="card-glow rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-ink mb-1">Sign in</h2>
          <p className="text-ink-muted text-sm mb-6">Enter your credentials to continue</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={cn(
                  'w-full px-4 py-2.5 rounded-lg border border-surface-border bg-surface-700',
                  'text-ink placeholder:text-ink-subtle text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary-400/60 focus:border-transparent',
                  'transition-shadow',
                )}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={cn(
                  'w-full px-4 py-2.5 rounded-lg border border-surface-border bg-surface-700',
                  'text-ink placeholder:text-ink-subtle text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary-400/60 focus:border-transparent',
                  'transition-shadow',
                )}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={cn(
                'btn-lime w-full py-3 px-4 rounded-full font-semibold text-sm',
                'transition-all duration-150',
                'focus:outline-none focus:ring-2 focus:ring-primary-400/60 focus:ring-offset-2 focus:ring-offset-surface-base',
                submitting && 'opacity-70 cursor-not-allowed',
              )}
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Link to register */}
          <p className="text-center text-sm text-ink-muted mt-6">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="text-primary-300 font-medium hover:text-primary-200 transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
=======
import { Suspense } from 'react';
import { LoginContent } from './LoginContent';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-base flex items-center justify-center">
          <div
            className="w-10 h-10 rounded-full animate-spin"
            style={{ border: '2px solid rgba(189,255,46,0.2)', borderTopColor: '#bdff2e' }}
          />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
>>>>>>> d952a10dfe09291a556c79a7edfcded67d527a73
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-base text-ink flex items-center justify-center p-4 relative overflow-hidden">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-400" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
