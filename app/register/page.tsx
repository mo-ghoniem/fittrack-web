'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get('redirect');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [persona, setPersona] = useState<'athlete' | 'coach'>('athlete');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!name.trim() || !email.trim() || !password.trim()) {
            setError('Please fill in all required fields.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            // Sign up via Supabase Auth — store role in user_metadata
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email.trim(),
                password,
                options: {
                    data: {
                        name: name.trim(),
                        role: persona,          // used by useUserRole hook
                        initialPersona: persona,
                    },
                },
            });

            if (authError) {
                setError(authError.message);
                return;
            }

            // Also persist role to profiles table so the backend CoachGuard works
            if (authData.user) {
                await supabase.from('profiles').upsert({
                    id: authData.user.id,
                    name: name.trim(),
                    email: email.trim(),
                    role: persona,
                }, { onConflict: 'id' });
            }

            // Redirect to the original page (e.g. /join/TOKEN) or dashboard
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
                    <p className="text-primary-200 mt-1 text-sm">Create your account</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h2 className="text-xl font-semibold text-slate-800 mb-1">Sign up</h2>
                    <p className="text-slate-500 text-sm mb-6">Fill in your details to get started</p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Full name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                                className={cn(
                                    'w-full px-4 py-2.5 rounded-lg border border-slate-200',
                                    'text-slate-900 placeholder-slate-400 text-sm',
                                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                                    'transition-shadow',
                                )}
                                autoComplete="name"
                                required
                            />
                        </div>

                        {/* Email */}
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

                        {/* Persona selector */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                I am a…
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPersona('athlete')}
                                    className={cn(
                                        'flex flex-col items-center gap-1 py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all duration-150',
                                        persona === 'athlete'
                                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                                            : 'border-slate-200 text-slate-600 hover:border-slate-300',
                                    )}
                                >
                                    <span className="text-xl">💪</span>
                                    Athlete
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPersona('coach')}
                                    className={cn(
                                        'flex flex-col items-center gap-1 py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all duration-150',
                                        persona === 'coach'
                                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                                            : 'border-slate-200 text-slate-600 hover:border-slate-300',
                                    )}
                                >
                                    <span className="text-xl">📋</span>
                                    Coach
                                </button>
                            </div>
                        </div>

                        {/* Password */}
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
                                autoComplete="new-password"
                                required
                            />
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Confirm password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className={cn(
                                    'w-full px-4 py-2.5 rounded-lg border border-slate-200',
                                    'text-slate-900 placeholder-slate-400 text-sm',
                                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                                    'transition-shadow',
                                )}
                                autoComplete="new-password"
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
                            {loading ? 'Creating account…' : 'Create account'}
                        </button>
                    </form>

                    {/* Link to login */}
                    <p className="text-center text-sm text-slate-500 mt-6">
                        Already have an account?{' '}
                        <Link
                            href="/login"
                            className="text-primary-600 font-medium hover:text-primary-700 transition-colors"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
