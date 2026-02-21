'use client';

import { useState } from 'react';
import { BookOpen, Upload, ArrowLeft, Loader2, Check, AlertCircle, FileText, Clock, FileQuestion, Plus, Trash2, CheckCircle2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { createGroup } from '@/lib/actions';
import { useRouter } from 'next/navigation';

export default function CreateGroupPage() {
    const [name, setName] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [examDuration, setExamDuration] = useState(30);
    const [pdfViewLimit, setPdfViewLimit] = useState(15);
    const [questionPattern, setQuestionPattern] = useState('MCQ');
    const [questions, setQuestions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const MIXED_PATTERNS = ['MCQ + Short Question', 'Short + Long Question', 'MCQ + Short + Long Question'];
    const isMixed = MIXED_PATTERNS.includes(questionPattern);

    const addQuestion = (subtype?: 'mcq' | 'short' | 'long') => {
        const id = Math.random().toString(36).substr(2, 9);
        if (questionPattern === 'MCQ' || subtype === 'mcq') {
            setQuestions([...questions, { id, text: '', options: ['', '', '', ''], correctAnswer: '', subtype: 'mcq' }]);
        } else if (subtype === 'long' || questionPattern === 'Long Question') {
            setQuestions([...questions, { id, text: '', placeholder: '', subtype: 'long' }]);
        } else {
            setQuestions([...questions, { id, text: '', placeholder: '', subtype: 'short' }]);
        }
    };

    const removeQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const updateQuestionText = (id: string, text: string) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, text } : q));
    };

    const updateMcqOption = (qId: string, oIdx: number, val: string) => {
        setQuestions(questions.map(q => q.id === qId ? {
            ...q,
            options: q.options.map((o: string, idx: number) => idx === oIdx ? val : o)
        } : q));
    };

    const setMcqCorrect = (qId: string, val: string) => {
        setQuestions(questions.map(q => q.id === qId ? { ...q, correctAnswer: val } : q));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (questions.length === 0) {
            setError('Please add at least one question to the Question Set.');
            setIsLoading(false);
            return;
        }

        // Basic validation for MCQ and mixed MCQ
        if (questionPattern === 'MCQ') {
            const invalid = questions.find(q => !q.correctAnswer || q.options.some((o: string) => !o));
            if (invalid) {
                setError('Please ensure all MCQ questions have 4 options and a correct answer selected.');
                setIsLoading(false);
                return;
            }
        }
        if (MIXED_PATTERNS.includes(questionPattern)) {
            const invalidMcq = questions.filter(q => q.subtype === 'mcq').find(q => !q.correctAnswer || q.options.some((o: string) => !o));
            if (invalidMcq) {
                setError('Please ensure all MCQ questions in the set have 4 options and a correct answer.');
                setIsLoading(false);
                return;
            }
        }

        try {
            let pdfUrl = '';

            if (file) {
                const formData = new FormData();
                formData.append('file', file);

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!uploadRes.ok) {
                    throw new Error('Failed to upload PDF');
                }

                const uploadData = await uploadRes.json();
                pdfUrl = uploadData.url;
            }

            await createGroup(name, pdfUrl, examDuration, pdfViewLimit, questionPattern, questions);
            setIsSuccess(true);
            setTimeout(() => {
                router.push('/dashboard');
            }, 1000);
        } catch (err: any) {
            setError(err.message || 'Failed to create group');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-all mb-8 w-fit">
                <ArrowLeft size={20} /> Back to Dashboard
            </Link>

            <div className="glass rounded-3xl p-6 md:p-10 shadow-2xl border border-white/5">
                <div className="mb-10 text-center md:text-left">
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Create New Group</h1>
                    <p className="text-slate-400">Set up a study space and define your interactive quiz questions.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle size={20} />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Section 1: Basic Info */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 opacity-80">
                                <BookOpen size={18} className="text-primary" /> General Info
                            </h3>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Group Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                                    placeholder="e.g. Advanced Physics 101"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Exam Time (min)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={isNaN(examDuration) ? '' : examDuration}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            setExamDuration(val);
                                        }}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">PDF Limit (min)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={isNaN(pdfViewLimit) ? '' : pdfViewLimit}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            setPdfViewLimit(val);
                                        }}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all font-medium"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Material */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 opacity-80">
                                <FileText size={18} className="text-secondary" /> Study Material
                            </h3>

                            <div className="relative group/upload h-full min-h-[160px]">
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className={`h-full border-2 border-dashed rounded-3xl p-6 text-center transition-all flex flex-col items-center justify-center ${file
                                    ? 'border-secondary/50 bg-secondary/5'
                                    : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                                    }`}>
                                    {file ? (
                                        <div className="flex flex-col items-center animate-in zoom-in duration-300">
                                            <div className="bg-secondary/20 p-3 rounded-2xl mb-3 text-secondary">
                                                <Check size={24} />
                                            </div>
                                            <p className="text-white font-bold text-sm max-w-[200px] truncate">{file.name}</p>
                                            <p className="text-xs text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <Upload className="text-slate-600 group-hover/upload:text-secondary transition-all mb-3" size={32} />
                                            <p className="text-white text-sm font-bold mb-1">Click to upload Study PDF</p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Required for students</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Question Set (DYNAMIC) */}
                    <div className="space-y-6 pt-6 border-t border-white/5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-accent/20 rounded-lg">
                                    <FileQuestion size={20} className="text-accent" />
                                </div>
                                <h3 className="text-xl font-bold text-white">Question Set</h3>
                            </div>

                            <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                                <select
                                    value={questionPattern}
                                    onChange={(e) => {
                                        setQuestionPattern(e.target.value);
                                        setQuestions([]); // Reset questions when changing pattern
                                    }}
                                    className="bg-transparent text-white px-4 py-2 text-sm font-bold focus:outline-none cursor-pointer"
                                >
                                    <option value="MCQ" className="bg-slate-900">MCQ Pattern</option>
                                    <option value="Short Question" className="bg-slate-900">Short Question Pattern</option>
                                    <option value="Long Question" className="bg-slate-900">Long Question Pattern</option>
                                    <option value="MCQ + Short Question" className="bg-slate-900">MCQ + Short Question</option>
                                    <option value="Short + Long Question" className="bg-slate-900">Short + Long Question</option>
                                    <option value="MCQ + Short + Long Question" className="bg-slate-900">MCQ + Short + Long Question</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {questions.map((q, qIdx) => (
                                <div key={q.id} className="glass border border-white/10 rounded-3xl p-6 md:p-8 animate-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-start justify-between mb-6">
                                        <span className="bg-white/10 text-white px-3 py-1 rounded-full text-xs font-black">#{qIdx + 1}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeQuestion(q.id)}
                                            className="text-slate-500 hover:text-red-400 transition-colors p-1"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Question Text</label>
                                            <input
                                                type="text"
                                                value={q.text}
                                                onChange={(e) => updateQuestionText(q.id, e.target.value)}
                                                placeholder="e.g. What is the capital of France?"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white font-medium focus:ring-1 focus:ring-accent/50 outline-none"
                                                required
                                            />
                                        </div>

                                        {/* MCQ options builder */}
                                        {(questionPattern === 'MCQ' || q.subtype === 'mcq') && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {q.options.map((option: string, oIdx: number) => (
                                                    <div key={oIdx} className="relative group">
                                                        <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold border transition-all ${q.correctAnswer === option && option !== ''
                                                            ? 'bg-green-500 border-green-500 text-white'
                                                            : 'bg-white/10 border-white/10 text-slate-500'
                                                            }`}>
                                                            {String.fromCharCode(65 + oIdx)}
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={option}
                                                            onChange={(e) => updateMcqOption(q.id, oIdx, e.target.value)}
                                                            placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-12 text-sm text-white focus:ring-1 focus:ring-green-500/50 outline-none"
                                                            required
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setMcqCorrect(q.id, option)}
                                                            className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all ${q.correctAnswer === option && option !== ''
                                                                ? 'text-green-500 opacity-100'
                                                                : 'text-slate-600 opacity-0 group-hover:opacity-100 hover:text-green-500'
                                                                }`}
                                                        >
                                                            <CheckCircle2 size={18} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Subtype badge for mixed text questions */}
                                        {isMixed && q.subtype !== 'mcq' && (
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${q.subtype === 'long'
                                                        ? 'bg-secondary/10 border-secondary/30 text-secondary'
                                                        : 'bg-primary/10 border-primary/30 text-primary'
                                                    }`}>
                                                    {q.subtype === 'long' ? 'Long Answer' : 'Short Answer'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Add Question: simple for pure patterns, subtype chooser for mixed */}
                            {!isMixed ? (
                                <button
                                    type="button"
                                    onClick={() => addQuestion()}
                                    className="w-full py-8 border-2 border-dashed border-white/10 rounded-3xl text-slate-500 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all flex flex-col items-center justify-center gap-2 group"
                                >
                                    <div className="bg-white/5 p-3 rounded-full group-hover:scale-110 transition-transform">
                                        <Plus size={24} />
                                    </div>
                                    <span className="text-sm font-bold tracking-widest uppercase">Add {questionPattern}</span>
                                </button>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {questionPattern.includes('MCQ') && (
                                        <button type="button" onClick={() => addQuestion('mcq')}
                                            className="py-6 border-2 border-dashed border-primary/30 rounded-3xl text-primary/60 hover:text-primary hover:border-primary/60 hover:bg-primary/5 transition-all flex flex-col items-center gap-2 group">
                                            <div className="bg-primary/10 p-3 rounded-full group-hover:scale-110 transition-transform"><Plus size={20} /></div>
                                            <span className="text-xs font-black uppercase tracking-widest">Add MCQ</span>
                                        </button>
                                    )}
                                    {(questionPattern.includes('Short')) && (
                                        <button type="button" onClick={() => addQuestion('short')}
                                            className="py-6 border-2 border-dashed border-accent/30 rounded-3xl text-accent/60 hover:text-accent hover:border-accent/60 hover:bg-accent/5 transition-all flex flex-col items-center gap-2 group">
                                            <div className="bg-accent/10 p-3 rounded-full group-hover:scale-110 transition-transform"><Plus size={20} /></div>
                                            <span className="text-xs font-black uppercase tracking-widest">Add Short Q</span>
                                        </button>
                                    )}
                                    {(questionPattern.includes('Long')) && (
                                        <button type="button" onClick={() => addQuestion('long')}
                                            className="py-6 border-2 border-dashed border-secondary/30 rounded-3xl text-secondary/60 hover:text-secondary hover:border-secondary/60 hover:bg-secondary/5 transition-all flex flex-col items-center gap-2 group">
                                            <div className="bg-secondary/10 p-3 rounded-full group-hover:scale-110 transition-transform"><Plus size={20} /></div>
                                            <span className="text-xs font-black uppercase tracking-widest">Add Long Q</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || isSuccess}
                        className={`w-full py-5 rounded-2xl font-black text-white flex items-center justify-center gap-3 transition-all transform hover:scale-[1.01] active:scale-[0.99] ${isSuccess ? 'bg-green-500' : 'bg-primary hover:bg-primary/80 shadow-primary/20'
                            } shadow-xl disabled:opacity-50`}
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : isSuccess ? (
                            <><Check size={20} /> Group Active!</>
                        ) : (
                            <>Initialize Global Study Session <Sparkles size={18} /></>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
