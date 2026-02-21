'use client';

import { useState } from 'react';
import { UserCircle, GraduationCap, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { login } from '@/lib/actions';

import Link from 'next/link';

export default function LoginPage() {
    const [role, setRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await login(role, username);
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass w-full max-w-md rounded-3xl p-8 animate-float">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Our Group Study</h1>
                    <p className="text-slate-400">Welcome back! Please enter your details.</p>
                </div>

                <div className="mb-8 flex gap-4">
                    <button
                        onClick={() => setRole('STUDENT')}
                        className={`flex-1 flex flex-col items-center justify-center p-4 rounded-2xl transition-all ${role === 'STUDENT'
                            ? 'bg-primary/20 border-2 border-primary'
                            : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                            }`}
                    >
                        <GraduationCap className={role === 'STUDENT' ? 'text-primary' : 'text-slate-400'} size={32} />
                        <span className={`mt-2 font-medium ${role === 'STUDENT' ? 'text-white' : 'text-slate-400'}`}>Student</span>
                    </button>
                    <button
                        onClick={() => setRole('TEACHER')}
                        className={`flex-1 flex flex-col items-center justify-center p-4 rounded-2xl transition-all ${role === 'TEACHER'
                            ? 'bg-secondary/20 border-2 border-secondary'
                            : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                            }`}
                    >
                        <UserCircle className={role === 'TEACHER' ? 'text-secondary' : 'text-slate-400'} size={32} />
                        <span className={`mt-2 font-medium ${role === 'TEACHER' ? 'text-white' : 'text-slate-400'}`}>Teacher</span>
                    </button>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 ml-1">Username / ID</label>
                        <div className="relative">
                            <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                placeholder="Enter your ID"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] ${role === 'STUDENT' ? 'bg-primary hover:bg-primary/80 shadow-primary/20' : 'bg-secondary hover:bg-secondary/80 shadow-secondary/20'
                            } shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>Sign In <ArrowRight size={20} /></>
                        )}
                    </button>
                </form>

                {error && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-red-400 text-sm">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <div className="mt-8 text-center text-sm text-slate-500">
                    New to Our Study? <Link href="/register" className="text-primary hover:underline font-bold">Create an ID here</Link>
                </div>
            </div>
        </div>
    );
}
