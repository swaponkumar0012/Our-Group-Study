'use client';

import { useState } from 'react';
import { UserCircle, GraduationCap, Lock, ArrowRight, AlertCircle, Loader2, UserPlus } from 'lucide-react';
import { register } from '@/lib/actions';
import Link from 'next/link';

export default function RegisterPage() {
    const [role, setRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await register(role, username, name, password);
            if (res && res.error) {
                setError(res.error);
            }
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass w-full max-w-md rounded-3xl p-8 animate-float">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Create ID</h1>
                    <p className="text-slate-400">Join Our Group Study platform today.</p>
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

                <form onSubmit={handleRegister} className="space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-center gap-2 text-sm">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400 ml-1">Full Name</label>
                        <div className="relative">
                            <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                                placeholder="Ex: John Doe"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400 ml-1">Username / ID</label>
                        <div className="relative">
                            <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                                placeholder="unique_id"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400 ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] ${role === 'STUDENT' ? 'bg-primary hover:bg-primary/80 shadow-primary/20' : 'bg-secondary hover:bg-secondary/80 shadow-secondary/20'
                            } shadow-lg disabled:opacity-50 mt-4`}
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>Create {role === 'STUDENT' ? 'Student' : 'Teacher'} ID <ArrowRight size={20} /></>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-500">
                    Already have an ID? <Link href="/login" className="text-primary hover:underline font-bold">Sign In here</Link>
                </div>
            </div>
        </div>
    );
}
