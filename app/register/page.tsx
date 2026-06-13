'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Zap, ArrowRight, CheckCircle2 } from 'lucide-react';

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

        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email.trim(),
                password,
                options: {
                    data: {
                        name: name.trim(),
                        role: persona,
                        initialPersona: persona,
                    },
                },
            });

            if (authError) {
                setError(authError.message);
                return;
            }

            if (authData.user) {
                await supabase.from('profiles').upsert({
                    id: authData.user.id,
                    name: name.trim(),
                    email: email.trim(),
                    role: persona,
                }, { onConflict: 'id' });
            }

            router.push(redirect ?? '/dashboard');
        } catch {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const personaOptions: { value: 'athlete' | 'coach'; emoji: string; title: string; desc: string }[] = [
        { value: 'athlete', emoji: '💪', title: 'Athlete', desc: 'Log workouts & track PRs' },
        { value: 'coach', emoji: '📋', title: 'Coach', desc: 'Manage athletes & programs' },
    ];

    const inputCls = cn(
        'w-full px-4 py-3 rounded-xl text-sm transition-all',
        'text-ink placeholder:text-ink-subtle',
        'focus:outline-none focus:ring-2 focus:ring-primary-400/50',
    );
    const inputStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' };

    return (
        <div className="min-h-screen bg-surface-base text-ink flex items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient */}
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
                <div
                    className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-25"
                    style={{ background: 'radial-gradient(circle, rgba(189,255,46,0.15) 0%, transparent 70%)' }}
                />
                <div
                    className="absolute -bottom-40 -left-20 w-[400px] h-[400px] rounded-full opacity-15"
                    style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.15) 0%, transparent 70%)' }}
                />
                <div className="absolute inset-0 dot-grid opacity-30" />
            </div>

            <div className="w-full max-w-md relative animate-fade-in">
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-8">
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
                    <h1 className="text-2xl font-extrabold text-ink tracking-tight mb-1">Create account</h1>
                    <p className="text-ink-muted text-sm mb-7">Join FitTrack and start crushing your goals</p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/25 text-red-300 text-sm rounded-xl px-4 py-3 mb-5">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Persona selector */}
                        <div className="grid grid-cols-2 gap-3 mb-2">
                            {personaOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setPersona(opt.value)}
                                    className={cn(
                                        'relative flex flex-col items-center gap-1 py-4 px-3 rounded-2xl text-sm font-semibold transition-all duration-200',
                                        persona === opt.value
                                            ? 'text-surface-900'
                                            : 'text-ink-muted hover:text-ink',
                                    )}
                                    style={persona === opt.value ? {
                                        background: 'linear-gradient(135deg, #d8ff5c 0%, #bdff2e 100%)',
                                        boxShadow: '0 0 20px -4px rgba(189,255,46,0.5)',
                                    } : {
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                    }}
                                >
                                    {persona === opt.value && (
                                        <CheckCircle2 size={14} className="absolute top-2 right-2 opacity-70" strokeWidth={2.5} />
                                    )}
                                    <span className="text-2xl">{opt.emoji}</span>
                                    <span>{opt.title}</span>
                                    <span className={cn('text-[10px] font-normal', persona === opt.value ? 'text-surface-900/70' : 'text-ink-subtle')}>
                                        {opt.desc}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Full name</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className={inputCls} style={inputStyle} autoComplete="name" required />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Email</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputCls} style={inputStyle} autoComplete="email" required />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Password</label>
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 chars" className={inputCls} style={inputStyle} autoComplete="new-password" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Confirm</label>
                                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className={inputCls} style={inputStyle} autoComplete="new-password" required />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={cn(
                                'btn-lime w-full py-3.5 px-4 rounded-2xl font-bold text-sm',
                                'flex items-center justify-center gap-2',
                                'transition-all duration-200 mt-2',
                                'focus:outline-none focus:ring-2 focus:ring-primary-400/60 focus:ring-offset-2 focus:ring-offset-surface-base',
                                loading && 'opacity-70 cursor-not-allowed',
                            )}
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                                    Creating account…
                                </>
                            ) : (
                                <>
                                    Create account
                                    <ArrowRight size={16} strokeWidth={2.5} />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm text-ink-muted mt-6">
                        Already have an account?{' '}
                        <Link href="/login" className="text-primary-300 font-semibold hover:text-primary-200 transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-surface-base text-ink flex items-center justify-center">
                <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '2px solid rgba(189,255,46,0.2)', borderTopColor: '#bdff2e' }} />
            </div>
        }>
            <RegisterContent />
        </Suspense>
    );
}
