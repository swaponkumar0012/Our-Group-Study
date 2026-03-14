import { getLeaderboard, getSession, getGroups } from '@/lib/actions';
import { Trophy, Medal, ArrowLeft, Filter } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage({
    searchParams
}: {
    searchParams: Promise<{ group?: string }>;
}) {
    const { group: groupId } = await searchParams;
    const session = await getSession();
    const [rankings, groups] = await Promise.all([
        getLeaderboard(groupId),
        getGroups()
    ]);

    const activeGroup = groups.find(g => g.id === groupId);

    return (
        <div className="max-w-4xl mx-auto p-8">
            <header className="mb-12">
                <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-all mb-8 w-fit">
                    <ArrowLeft size={20} /> Back to Dashboard
                </Link>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-accent/20 rounded-3xl text-accent">
                            <Trophy size={48} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">
                                {activeGroup ? `${activeGroup.name} Rankings` : 'Global Leaderboard'}
                            </h1>
                            <p className="text-slate-400 truncate max-w-md">
                                {activeGroup
                                    ? `Top performers in this study group.`
                                    : 'Total points accumulated across all study group quizzes.'}
                            </p>
                        </div>
                    </div>

                    {/* Group Filter */}
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-2 rounded-2xl">
                        <Filter size={18} className="text-slate-500 ml-2" />
                        <div className="flex gap-1">
                            <Link
                                href="/dashboard/leaderboard"
                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${!groupId ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-white/5'}`}
                            >
                                Global
                            </Link>
                            {groups.map((g) => (
                                <Link
                                    key={g.id}
                                    href={`/dashboard/leaderboard?group=${g.id}`}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${groupId === g.id ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-slate-400 hover:bg-white/5'}`}
                                >
                                    {g.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            <div className="glass rounded-[2rem] overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-white/5 border-b border-white/10">
                            <th className="px-8 py-6 text-sm font-bold text-slate-500 uppercase tracking-widest">Rank</th>
                            <th className="px-8 py-6 text-sm font-bold text-slate-500 uppercase tracking-widest">Student</th>
                            <th className="px-8 py-6 text-sm font-bold text-slate-500 uppercase tracking-widest text-center">Stats (Correct/Total)</th>
                            <th className="px-8 py-6 text-sm font-bold text-slate-500 uppercase tracking-widest text-right">Total Score</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {rankings.map((student, index) => (
                            <tr key={student.id} className={`group hover:bg-white/5 transition-all ${student.id === session?.id ? 'bg-primary/5' : ''}`}>
                                <td className="px-8 py-6">
                                    {index === 0 ? (
                                        <div className="w-12 h-12 bg-yellow-400/20 rounded-2xl flex items-center justify-center text-yellow-500 border border-yellow-400/30 shadow-[0_0_20px_rgba(250,204,21,0.2)]">
                                            <Trophy size={28} />
                                        </div>
                                    ) : index === 1 ? (
                                        <div className="w-10 h-10 bg-slate-100/20 rounded-xl flex items-center justify-center text-slate-100 border border-slate-100/30">
                                            <Medal size={24} />
                                        </div>
                                    ) : index === 2 ? (
                                        <div className="w-10 h-10 bg-orange-400/20 rounded-xl flex items-center justify-center text-orange-500 border border-orange-400/30">
                                            <Medal size={24} />
                                        </div>
                                    ) : (
                                        <span className="text-xl font-bold text-slate-600 ml-3">#{index + 1}</span>
                                    )}
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white font-black text-xl border border-white/5">
                                            {student.name[0]}
                                        </div>
                                        <div>
                                            <p className="text-white font-bold group-hover:text-primary transition-all text-lg">
                                                {student.name} {student.id === session?.id && '(You)'}
                                            </p>
                                            <p className="text-xs text-slate-500 font-mono tracking-tighter">ID: ...{student.id.slice(-8)}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <div className="inline-flex flex-col items-center">
                                        <span className="text-2xl font-black text-secondary">
                                            {student.correctCount}/{student.totalCount}
                                        </span>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                                            Correct Answers
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="inline-flex flex-col items-end">
                                        <span className="text-3xl font-black text-white">{student.totalScore}</span>
                                        <span className="text-primary text-[10px] font-black uppercase tracking-widest">Points</span>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {rankings.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-8 py-12 text-center text-slate-500 italic">
                                    No scores recorded yet for this selection. Participate in quizzes to see the standings!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
