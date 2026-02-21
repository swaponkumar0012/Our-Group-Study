'use client';

import { useState, useEffect } from 'react';
import { getMessages, getSession, sendMessage } from '@/lib/actions';
import { MessageSquare, ArrowLeft, User, BookOpen, Send, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function MessagesPage() {
    const [messages, setMessages] = useState<any[]>([]);
    const [session, setSession] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        async function loadData() {
            const [msgData, sessionData] = await Promise.all([
                getMessages(),
                getSession()
            ]);
            setMessages(msgData);
            setSession(sessionData);
            setIsLoading(false);
        }
        loadData();
    }, []);

    const handleReply = async (groupId: string, messageId: string) => {
        if (!replyContent.trim() || isSending) return;
        setIsSending(true);
        try {
            await sendMessage(groupId, replyContent);
            setReplyContent('');
            setReplyingTo(null);
            // Reload messages to show the new reply (or update locally)
            const updatedMessages = await getMessages();
            setMessages(updatedMessages);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSending(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-8">
            <header className="mb-12">
                <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-all mb-8 w-fit">
                    <ArrowLeft size={20} /> Back to Dashboard
                </Link>
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-primary/20 rounded-3xl text-primary">
                        <MessageSquare size={48} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Messaging Dashboard</h1>
                        <p className="text-slate-400">
                            {session?.role === 'TEACHER'
                                ? 'See and respond to questions from all your study groups.'
                                : 'Track your questions and teacher responses across your groups.'}
                        </p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {messages.length > 0 ? (
                    messages.map((m) => (
                        <div key={m.id} className="glass p-6 rounded-3xl group hover:border-primary/50 transition-all flex flex-col md:flex-row items-start gap-6">
                            <div className="hidden md:flex flex-col items-center">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${m.sender.role === 'TEACHER' ? 'bg-primary/20 text-primary' : 'bg-white/5 text-slate-400'
                                    }`}>
                                    <User size={24} />
                                </div>
                                <div className="h-full w-px bg-white/10" />
                            </div>

                            <div className="flex-1 w-full">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-white font-bold">{m.sender.name}</span>
                                        {m.sender.role === 'TEACHER' && (
                                            <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded font-black uppercase tracking-tighter">Teacher</span>
                                        )}
                                        <span className="text-xs font-bold text-slate-500 bg-white/5 px-2 py-1 rounded-lg flex items-center gap-1">
                                            <BookOpen size={12} /> {m.group.name}
                                        </span>
                                    </div>
                                    <span className="text-xs text-slate-500">{new Date(m.createdAt).toLocaleDateString()}</span>
                                </div>

                                <div className={`p-4 rounded-2xl text-slate-300 border mb-4 italic ${m.sender.role === 'TEACHER' ? 'bg-primary/5 border-primary/20' : 'bg-white/5 border-white/10'
                                    }`}>
                                    "{m.content}"
                                </div>

                                {replyingTo === m.id ? (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                        <textarea
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                            placeholder="Write your response..."
                                            className="w-full bg-white/5 border border-primary/20 rounded-2xl p-4 text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                                            rows={3}
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleReply(m.groupId, m.id)}
                                                disabled={isSending}
                                                className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                                            >
                                                {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                                Send Response
                                            </button>
                                            <button
                                                onClick={() => setReplyingTo(null)}
                                                className="px-4 py-2 bg-white/5 text-slate-400 rounded-xl text-xs font-bold uppercase tracking-widest"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-4">
                                        {session?.role === 'TEACHER' && m.sender.role !== 'TEACHER' && (
                                            <button
                                                onClick={() => setReplyingTo(m.id)}
                                                className="text-xs font-bold uppercase tracking-widest text-primary hover:text-white transition-all flex items-center gap-2"
                                            >
                                                <MessageSquare size={14} /> Reply
                                            </button>
                                        )}
                                        <Link href={`/dashboard/groups/${m.groupId}`} className="text-xs font-bold uppercase tracking-widest text-slate-600 hover:text-white transition-all ml-auto flex items-center gap-2">
                                            View Context <ArrowLeft size={14} className="rotate-180" />
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="glass rounded-[2rem] p-20 text-center">
                        <MessageSquare className="mx-auto text-slate-500 mb-4 opacity-20" size={64} />
                        <h3 className="text-xl font-bold text-white mb-2">No messages to show</h3>
                        <p className="text-slate-500 max-w-sm mx-auto">
                            {session?.role === 'TEACHER'
                                ? "Once students start asking questions in your groups, they'll appear here for you to answer."
                                : "Ask questions in your study groups and you can track them here."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
