import { getSession, logout, getGroups } from '@/lib/actions';
import { LogOut, Plus, BookOpen, MessageSquare, Trophy, Clock, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import DeleteGroupButton from '@/components/DeleteGroupButton';

export default async function DashboardPage() {
    const session = await getSession();
    const groups = await getGroups();

    return (
        <div className="min-h-screen">
            <nav className="glass sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BookOpen className="text-primary" />
                    <span className="text-xl font-bold text-white tracking-tight">Our Study</span>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <span className="text-white font-medium">{session?.name}</span>
                        <span className="text-xs text-slate-400 capitalize">{session?.role}</span>
                    </div>
                    <form action={logout}>
                        <button className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-all text-slate-400">
                            <LogOut size={20} />
                        </button>
                    </form>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto p-8">
                <header className="mb-12">
                    <h2 className="text-3xl font-bold text-white mb-2">Welcome back, {session?.name}!</h2>
                    <p className="text-slate-400">Here's what's happening with your study groups.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <StatCard icon={<BookOpen />} label="Active Groups" value={groups.length.toString()} color="primary" />
                    <StatCard icon={<Clock />} label="Quizzes" value={groups.reduce((acc, g) => acc + g.quizzes.length, 0).toString()} color="secondary" />
                    <Link href="/dashboard/leaderboard">
                        <StatCard icon={<Trophy />} label="Ranking" value="View" color="accent" />
                    </Link>
                    <Link href="/dashboard/messages">
                        <StatCard icon={<MessageSquare />} label="Messages" value="0" color="primary" />
                    </Link>
                </div>

                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-white">
                            {session?.role === 'TEACHER' ? 'Your Groups' : 'Joined Groups'}
                        </h3>
                        {session?.role === 'TEACHER' && (
                            <Link href="/dashboard/groups/create">
                                <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary/20">
                                    <Plus size={20} /> Create Group
                                </button>
                            </Link>
                        )}
                    </div>

                    {groups.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {groups.map((group) => (
                                <Link key={group.id} href={`/dashboard/groups/${group.id}`}>
                                    <div className="glass p-6 rounded-3xl group cursor-pointer hover:border-primary/50 transition-all h-full flex flex-col">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                                                <BookOpen size={24} />
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className="text-xs font-bold text-slate-500 bg-white/5 px-2 py-1 rounded-lg">
                                                    {group.quizzes.length} Quizzes
                                                </span>
                                                {session?.role === 'TEACHER' && (
                                                    <DeleteGroupButton groupId={group.id} />
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-auto">
                                            <h4 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-all">
                                                {group.name}
                                            </h4>
                                            <div className="flex items-center justify-between text-sm text-slate-500">
                                                <span>{session?.role === 'TEACHER' ? 'Active' : 'Shared by Teacher'}</span>
                                                <ChevronRight size={18} />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="glass rounded-3xl p-12 text-center">
                            <div className="bg-white/5 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <BookOpen className="text-slate-500" size={32} />
                            </div>
                            <h4 className="text-white font-medium mb-1">No groups found</h4>
                            <p className="text-slate-500 mb-6">
                                {session?.role === 'TEACHER'
                                    ? 'Start by creating your first study group to share materials.'
                                    : 'Ask your teacher for a group join code.'}
                            </p>
                            {session?.role === 'TEACHER' && (
                                <Link href="/dashboard/groups/create">
                                    <button className="text-primary font-medium hover:underline">Get started now</button>
                                </Link>
                            )}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}


function StatCard({ icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
    const colorMap: any = {
        primary: 'text-primary bg-primary/10',
        secondary: 'text-secondary bg-secondary/10',
        accent: 'text-accent bg-accent/10',
    };

    return (
        <div className="glass p-6 rounded-2xl flex items-center gap-4">
            <div className={`p-3 rounded-xl ${colorMap[color]}`}>
                {icon}
            </div>
            <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
            </div>
        </div>
    );
}
