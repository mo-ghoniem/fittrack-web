export const dynamic = 'force-dynamic';

<<<<<<< HEAD
import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import Link from 'next/link';

function RegisterContent() {
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

        // Bug #8 fix: align with backend @MinLength(8) in RegisterDto.
        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
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
        <div className="min-h-screen bg-surface-base text-ink flex items-center justify-center p-4 relative overflow-hidden">
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
                    <p className="text-ink-muted mt-1 text-sm">Create your account</p>
                </div>

                {/* Card */}
                <div className="card-glow rounded-2xl p-8">
                    <h2 className="text-xl font-semibold text-ink mb-1">Sign up</h2>
                    <p className="text-ink-muted text-sm mb-6">Fill in your details to get started</p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg px-4 py-3 mb-5">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-ink mb-1.5">
                                Full name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                                className={cn(
                                    'w-full px-4 py-2.5 rounded-lg border border-surface-border bg-surface-700',
                                    'text-ink placeholder:text-ink-subtle text-sm',
                                    'focus:outline-none focus:ring-2 focus:ring-primary-400/60 focus:border-transparent',
                                    'transition-shadow',
                                )}
                                autoComplete="name"
                                required
                            />
                        </div>

                        {/* Email */}
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

                        {/* Persona selector */}
                        <div>
                            <label className="block text-sm font-medium text-ink mb-1.5">
                                I am a…
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPersona('athlete')}
                                    className={cn(
                                        'flex flex-col items-center gap-1 py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all duration-150',
                                        persona === 'athlete'
                                            ? 'border-primary-400 bg-primary-400/10 text-primary-300'
                                             : 'border-surface-border text-ink-muted hover:border-surface-border-strong',
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
                                            ? 'border-primary-400 bg-primary-400/10 text-primary-300'
                                            : 'border-surface-border text-ink-muted hover:border-surface-border-strong',
                                    )}
                                >
                                    <span className="text-xl">📋</span>
                                    Coach
                                </button>
                            </div>
                        </div>

                        {/* Password */}
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
                                autoComplete="new-password"
                                required
                            />
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-ink mb-1.5">
                                Confirm password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className={cn(
                                    'w-full px-4 py-2.5 rounded-lg border border-surface-border bg-surface-700',
                                    'text-ink placeholder:text-ink-subtle text-sm',
                                    'focus:outline-none focus:ring-2 focus:ring-primary-400/60 focus:border-transparent',
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
                                'btn-lime w-full py-3 px-4 rounded-full font-semibold text-sm',
                                'transition-all duration-150',
                                'focus:outline-none focus:ring-2 focus:ring-primary-400/60 focus:ring-offset-2 focus:ring-offset-surface-base',
                                loading && 'opacity-70 cursor-not-allowed',
                            )}
                        >
                            {loading ? 'Creating account…' : 'Create account'}
                        </button>
                    </form>

                    {/* Link to login */}
                    <p className="text-center text-sm text-ink-muted mt-6">
                        Already have an account?{' '}
                        <Link
                            href="/login"
                            className="text-primary-300 font-medium hover:text-primary-200 transition-colors"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
=======
import { Suspense } from 'react';
import { RegisterContent } from './RegisterContent';

export default function RegisterPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-surface-base flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '2px solid rgba(189,255,46,0.2)', borderTopColor: '#bdff2e' }} />
                </div>
            }
        >
            <RegisterContent />
        </Suspense>
>>>>>>> d952a10dfe09291a556c79a7edfcded67d527a73
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-surface-base text-ink flex items-center justify-center p-4 relative overflow-hidden">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-400" />
            </div>
        }>
            <RegisterContent />
        </Suspense>
    );
}
