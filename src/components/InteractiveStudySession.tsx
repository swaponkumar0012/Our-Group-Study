'use client';

import { useState, useRef, useEffect } from 'react';
import { BookOpen, Clock, ChevronRight, CheckCircle2, AlertCircle, FileQuestion, Sparkles, Send, User } from 'lucide-react';
import Timer from './Timer';
import QuizEngine from './QuizEngine';
import { sendMessage, submitQuizResponse } from '@/lib/actions';
import InteractivePdfViewer from './InteractivePdfViewer';

interface Message {
    id: string;
    senderName: string;
    content: string;
    createdAt: Date;
    senderRole: string;
}

interface Question {
    id: string;
    text: string;
    options?: string[];
    correctAnswer?: string;
}

interface Quiz {
    id: string;
    title: string;
    description: string | null;
    examTimeSeconds: number;
    questions: Question[];
}

interface InteractiveStudySessionProps {
    groupId: string;
    groupName: string;
    teacherName: string;
    pdfUrl: string | null;
    pdfViewLimit: number; // in minutes
    examDuration: number; // in minutes
    questionPattern: string; // 'MCQ', 'Short Question', 'Long Question'
    initialMessages: Message[];
    quizzes: Quiz[];
    role: string;
}

export default function InteractiveStudySession({
    groupId,
    groupName,
    teacherName,
    pdfUrl,
    pdfViewLimit,
    examDuration,
    questionPattern,
    initialMessages,
    quizzes,
    role
}: InteractiveStudySessionProps) {
    const [sessionState, setSessionState] = useState<'STUDY' | 'QUIZ'>('STUDY');
    const [isPdfVisible, setIsPdfVisible] = useState(true);
    const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [lastScore, setLastScore] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeQuiz = quizzes.find(q => q.id === activeQuizId);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleStudyComplete = () => {
        setSessionState('QUIZ');
        setIsPdfVisible(false);
    };

    const handleQuizFinish = async (userResponses: any) => {
        console.log('Quiz Finished Triggered', { activeQuiz: !!activeQuiz, role, userResponses });
        if (!activeQuiz || role !== 'STUDENT') {
            console.warn('Submission blocked: Not a student or no active quiz');
            return;
        }

        let score = 0;
        let correctCount = 0;
        const totalCount = activeQuiz.questions.length;

        if (questionPattern === 'MCQ') {
            activeQuiz.questions.forEach((q: any) => {
                if (userResponses[q.id] === q.correctAnswer) {
                    score += 10; // 10 points per correct MCQ
                    correctCount++;
                }
            });
        } else if (['MCQ + Short Question', 'Short + Long Question', 'MCQ + Short + Long Question'].includes(questionPattern)) {
            // Mixed: auto-grade MCQ sub-questions, give completion points for text ones
            activeQuiz.questions.forEach((q: any) => {
                if (q.subtype === 'mcq') {
                    if (userResponses[q.id] === q.correctAnswer) {
                        score += 10;
                        correctCount++;
                    }
                } else {
                    // Short or long answered = 5 points for completion
                    if (userResponses[q.id]) {
                        score += 5;
                        correctCount++;
                    }
                }
            });
        } else {
            // Pure Short/Long: completion points only
            correctCount = Object.keys(userResponses).length;
            score = correctCount * 10;
        }

        try {
            await submitQuizResponse(activeQuiz.id, score, correctCount, totalCount);
            setLastScore(score);
        } catch (err) {
            console.error('Failed to submit quiz:', err);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        try {
            const sent = await sendMessage(groupId, newMessage);
            setMessages([...messages, {
                id: sent.id,
                senderName: sent.sender.name,
                content: sent.content,
                createdAt: sent.createdAt,
                senderRole: sent.sender.role
            }]);
            setNewMessage('');
        } catch (err) {
            console.error('Failed to send message:', err);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-8">
                <div className="glass rounded-3xl p-8 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">{groupName}</h1>
                            <p className="text-slate-400">
                                Guided by <span className="text-primary font-medium">{teacherName}</span> •
                                <span className="ml-2 px-2 py-0.5 bg-accent/10 border border-accent/20 rounded text-accent text-xs font-bold uppercase">
                                    {questionPattern} Pattern
                                </span>
                            </p>
                        </div>
                        <div className={`px-4 py-2 rounded-xl border font-bold text-xs uppercase tracking-widest ${sessionState === 'STUDY'
                            ? 'bg-primary/10 border-primary/20 text-primary'
                            : 'bg-secondary/10 border-secondary/20 text-secondary'
                            }`}>
                            {sessionState} PHASE
                        </div>
                    </div>

                    <div className="min-h-[500px] flex flex-col">
                        {sessionState === 'STUDY' && (
                            <div className="aspect-[16/9] bg-white/5 border border-white/10 rounded-2xl overflow-hidden relative group flex-1">
                                {pdfUrl && isPdfVisible ? (
                                    <div className="w-full h-full flex flex-col">
                                        <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
                                            <div className="flex items-center gap-2">
                                                <BookOpen size={14} className="text-primary" />
                                                <span className="text-xs text-slate-400 font-medium tracking-wide">STUDY MATERIAL</span>
                                            </div>
                                            <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">
                                                LOCKED DURING QUIZ
                                            </span>
                                        </div>
                                        <InteractivePdfViewer url={pdfUrl} />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4 p-8 text-center">
                                        <BookOpen size={64} className="opacity-20" />
                                        <p>No study material available or access restricted.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {sessionState === 'QUIZ' && (
                            <div className="flex-1">
                                {activeQuiz ? (
                                    lastScore !== null ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-20">
                                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center animate-bounce">
                                                <Sparkles size={40} className="text-green-400" />
                                            </div>
                                            <div>
                                                <h2 className="text-3xl font-black text-white mb-2">Quiz Completed!</h2>
                                                <div className="text-5xl font-black text-primary mb-4">
                                                    Score: {lastScore}
                                                </div>
                                                <p className="text-slate-400 max-w-sm mx-auto">
                                                    Great job! Your score has been updated on the leaderboard.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <QuizEngine
                                            pattern={questionPattern as any}
                                            questions={activeQuiz.questions}
                                            onComplete={handleQuizFinish}
                                        />
                                    )
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-20 glass border-2 border-dashed border-white/10 rounded-3xl">
                                        <div className="w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center">
                                            <Sparkles size={40} className="text-secondary" />
                                        </div>
                                        <div className="max-w-md">
                                            <h2 className="text-2xl font-bold text-white mb-2">Ready for the Quiz?</h2>
                                            <p className="text-slate-400">
                                                The study session has ended. Select a quiz from the sidebar to begin your {questionPattern} challenge.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Session Live Chat */}
                <div className="glass rounded-3xl p-8 border border-white/5 shadow-2xl">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Send className="text-primary" size={20} /> Live Session Chat
                    </h3>

                    <div className="space-y-6">
                        <div className="h-[300px] overflow-y-auto pr-4 space-y-4 custom-scrollbar">
                            {messages.length > 0 ? (
                                messages.map((m) => (
                                    <div key={m.id} className={`flex gap-3 ${m.senderRole === 'TEACHER' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${m.senderRole === 'TEACHER' ? 'bg-primary/20 text-primary' : 'bg-white/10 text-slate-400'
                                            }`}>
                                            {m.senderName.charAt(0)}
                                        </div>
                                        <div className={`flex flex-col ${m.senderRole === 'TEACHER' ? 'items-end' : ''}`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{m.senderName}</span>
                                                <span className="text-[9px] text-slate-600 italic">
                                                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className={`p-4 rounded-2xl text-sm max-w-sm border ${m.senderRole === 'TEACHER'
                                                ? 'bg-primary/10 border-primary/20 text-white rounded-tr-none'
                                                : 'bg-white/5 border-white/10 text-slate-300 rounded-tl-none'
                                                }`}>
                                                {m.content}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                                    <User size={32} className="mb-2" />
                                    <p className="text-xs uppercase tracking-[0.2em] font-bold">No messages yet</p>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="relative mt-4">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={role === 'TEACHER' ? "Post a session update..." : "Ask a question..."}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim() || isSending}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-xl hover:bg-primary/80 transition-all disabled:opacity-50 disabled:grayscale"
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Sidebar / Session Control */}
            <div className="space-y-8">
                <div className="glass rounded-3xl p-8 border border-white/5 shadow-2xl sticky top-8">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Clock className="text-primary" size={20} /> Live Status
                    </h3>
                    <div className="space-y-6">
                        {sessionState === 'STUDY' ? (
                            <Timer
                                key="study-timer"
                                durationSeconds={pdfViewLimit * 60}
                                label="Reading Time Left"
                                onComplete={handleStudyComplete}
                            />
                        ) : (
                            <Timer
                                key="quiz-timer"
                                durationSeconds={examDuration * 60}
                                label="Total Quiz Time"
                            />
                        )}

                        <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 uppercase font-bold tracking-widest">Phase Duration</span>
                                <span className="text-white font-mono bg-white/10 px-2 py-1 rounded">
                                    {sessionState === 'STUDY' ? pdfViewLimit : examDuration} mins
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 uppercase font-bold tracking-widest">Questions</span>
                                <span className="text-accent font-bold bg-accent/10 px-2 py-1 rounded border border-accent/20">
                                    {questionPattern}
                                </span>
                            </div>
                        </div>

                        {role === 'TEACHER' && sessionState === 'STUDY' && (
                            <button
                                onClick={handleStudyComplete}
                                className="w-full py-4 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-all border border-white/10 flex items-center justify-center gap-2 group"
                            >
                                <ChevronRight className="group-hover:translate-x-1 transition-transform" size={18} />
                                Skip to Quiz Phase
                            </button>
                        )}
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/5">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <FileQuestion className="text-secondary" size={20} /> Available Quizzes
                        </h3>
                        <div className="space-y-4">
                            {quizzes.length > 0 ? (
                                quizzes.map((q) => (
                                    <button
                                        key={q.id}
                                        onClick={() => sessionState === 'QUIZ' && setActiveQuizId(q.id)}
                                        className={`w-full text-left p-4 border rounded-2xl transition-all ${sessionState === 'QUIZ'
                                            ? activeQuizId === q.id
                                                ? 'bg-secondary/20 border-secondary text-white ring-2 ring-secondary/20'
                                                : 'bg-secondary/10 border-secondary/50 hover:bg-secondary/20 hover:scale-[1.02] shadow-lg shadow-secondary/10'
                                            : 'bg-white/5 border-white/10 opacity-50 grayscale cursor-not-allowed'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="font-bold text-sm">{q.title}</h4>
                                            {sessionState === 'QUIZ' && <ChevronRight size={14} className="text-secondary" />}
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-medium lowercase">
                                            {examDuration} mins • {q.questions.length} questions
                                        </p>
                                    </button>
                                ))
                            ) : (
                                <p className="text-slate-500 text-sm text-center py-4 bg-white/5 rounded-2xl border border-dashed border-white/10">
                                    No quizzes scheduled.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
