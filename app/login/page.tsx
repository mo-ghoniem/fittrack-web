'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setLoading(true);

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
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-2xl shadow-lg mb-4">
            <span className="text-2xl">🏋️</span>
          </div>
          <h1 className="text-3xl font-bold text-white">FitTrack</h1>
          <p className="text-primary-200 mt-1 text-sm">Admin Dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-1">Sign in</h2>
          <p className="text-slate-500 text-sm mb-6">Enter your credentials to continue</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={cn(
                  'w-full px-4 py-2.5 rounded-lg border border-slate-200',
                  'text-slate-900 placeholder-slate-400 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                  'transition-shadow',
                )}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={cn(
                  'w-full px-4 py-2.5 rounded-lg border border-slate-200',
                  'text-slate-900 placeholder-slate-400 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                  'transition-shadow',
                )}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full py-2.5 px-4 rounded-lg font-semibold text-sm text-white',
                'bg-primary-600 hover:bg-primary-700 active:bg-primary-800',
                'transition-colors duration-150',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                loading && 'opacity-70 cursor-not-allowed',
              )}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Link to register */}
          <p className="text-center text-sm text-slate-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="text-primary-600 font-medium hover:text-primary-700 transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
