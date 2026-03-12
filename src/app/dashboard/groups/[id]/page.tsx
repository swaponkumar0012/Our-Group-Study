import { getGroup, getSession, deleteGroup } from '@/lib/actions';
import { ArrowLeft, BookOpen, Send, Users, Activity, Trophy, Trash2 } from 'lucide-react';
import Link from 'next/link';
import InteractiveStudySession from '@/components/InteractiveStudySession';
import DeleteGroupButton from '@/components/DeleteGroupButton';

export const dynamic = 'force-dynamic';

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getSession();
    const group = await getGroup(id);

    if (!group) return <div className="min-h-screen flex items-center justify-center text-white">Group not found</div>;

    return (
        <div className="max-w-7xl mx-auto p-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="space-y-1">
                    <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-all w-fit mb-2">
                        <ArrowLeft size={18} /> Back to Dashboard
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg">
                            <Activity size={24} className="text-primary" />
                        </div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Session Console</h2>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {session?.role === 'TEACHER' && (
                        <DeleteGroupButton groupId={id} showText />
                    )}
                    <Link
                        href={`/dashboard/leaderboard?group=${id}`}
                        className="bg-accent/10 border border-accent/20 px-4 py-2.5 rounded-2xl text-accent font-bold text-sm flex items-center gap-2 hover:bg-accent/20 transition-all shadow-lg"
                    >
                        <Trophy size={16} /> Rankings
                    </Link>
                    <div className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl text-slate-300 font-bold text-sm flex items-center gap-2 shadow-lg">
                        <Users size={16} className="text-primary" /> 12 Students
                    </div>
                    <div className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl text-slate-300 font-bold text-sm flex items-center gap-2 shadow-lg">
                        <BookOpen size={16} className="text-secondary" /> {group.quizzes.length} Materials
                    </div>
                </div>
            </header>

            <InteractiveStudySession
                groupId={group.id}
                groupName={group.name}
                teacherName={group.teacher.name}
                pdfUrl={group.pdfUrl}
                pdfViewLimit={group.pdfViewLimit}
                examDuration={group.examDuration}
                questionPattern={group.questionPattern}
                initialMessages={group.messages.map((m: any) => ({
                    id: m.id,
                    senderName: m.sender.name,
                    content: m.content,
                    createdAt: m.createdAt,
                    senderRole: m.sender.role
                }))}
                quizzes={group.quizzes.map((q: any) => ({
                    id: q.id,
                    title: q.title,
                    description: q.description,
                    examTimeSeconds: q.examTimeSeconds,
                    questions: JSON.parse(q.questions)
                }))}
                role={session?.role || 'STUDENT'}
            />
        </div>
    );
}
