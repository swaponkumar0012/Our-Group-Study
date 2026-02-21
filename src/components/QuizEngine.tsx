'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, Send, HelpCircle, MessageSquare, AlignLeft, Sparkles, AlertCircle } from 'lucide-react';

interface Question {
    id: string;
    text: string;
    options?: string[]; // For MCQ: 4 options
    correctAnswer?: string; // For MCQ
    placeholder?: string; // For Short/Long questions
    subtype?: 'short' | 'long'; // For mixed patterns: distinguishes short from long
}

interface QuizEngineProps {
    pattern: 'MCQ' | 'Short Question' | 'Long Question' | 'MCQ + Short Question' | 'Short + Long Question' | 'MCQ + Short + Long Question';
    questions: Question[];
    onComplete: (responses: any) => void;
}

export default function QuizEngine({ pattern, questions, onComplete }: QuizEngineProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [responses, setResponses] = useState<Record<string, any>>({});
    const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
    const [isFinished, setIsFinished] = useState(false);

    const currentQuestion = questions[currentIndex];

    const handleMcqSelect = (option: string) => {
        // MCQ logic: works for pure MCQ and for MCQ questions in mixed patterns
        const isCorrect = option === currentQuestion.correctAnswer;
        setResponses({ ...responses, [currentQuestion.id]: option });

        setFeedback({
            isCorrect,
            message: isCorrect
                ? "Excellent! 🌹 Correct answer."
                : `Incorrect. The correct answer was "${currentQuestion.correctAnswer}".`
        });
    };

    const handleTextSubmit = (answer: string) => {
        const nextResponses = { ...responses, [currentQuestion.id]: answer };
        setResponses(nextResponses);
        handleNext(nextResponses);
    };

    const handleNext = (currentResponses = responses) => {
        setFeedback(null);
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setIsFinished(true);
            onComplete(currentResponses);
        }
    };

    if (questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 glass rounded-3xl border border-white/10">
                <HelpCircle size={48} className="text-slate-500 mb-4 opacity-20" />
                <p className="text-slate-400">No questions found for this quiz.</p>
            </div>
        );
    }

    if (isFinished) {
        return (
            <div className="flex flex-col items-center justify-center p-12 glass rounded-3xl border border-white/20 bg-green-500/5 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                    <Sparkles size={40} className="text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Quiz Completed!</h2>
                <p className="text-slate-400 text-center max-w-sm mb-8">
                    Your responses have been recorded and sent to your teacher for review.
                </p>
                <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/10 text-sm font-medium text-slate-300">
                    Results will be posted on the leaderboard soon.
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* Header / Progress */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-lg">
                        {(pattern === 'MCQ') && <HelpCircle size={20} className="text-primary" />}
                        {(pattern === 'Short Question') && <MessageSquare size={20} className="text-primary" />}
                        {(pattern === 'Long Question') && <AlignLeft size={20} className="text-primary" />}
                        {(pattern === 'MCQ + Short Question' || pattern === 'Short + Long Question' || pattern === 'MCQ + Short + Long Question') && <Sparkles size={20} className="text-primary" />}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white leading-tight">{pattern} Challenge</h3>
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Standardized Format</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-sm font-mono text-white/50">Question {currentIndex + 1} of {questions.length}</span>
                    <div className="w-32 h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-500"
                            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Question Card */}
            <div className={`glass rounded-3xl p-8 border ${feedback ? (feedback.isCorrect ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5') : 'border-white/10'}`}>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-8 leading-relaxed">
                    {currentQuestion.text}
                </h2>

                {/* MCQ */}
                {(currentQuestion.options && currentQuestion.options.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentQuestion.options?.map((option, idx) => (
                            <button
                                key={idx}
                                onClick={() => !feedback && handleMcqSelect(option)}
                                disabled={!!feedback}
                                className={`group p-6 rounded-2xl border-2 text-left transition-all duration-300 flex items-center justify-between ${responses[currentQuestion.id] === option
                                    ? feedback?.isCorrect
                                        ? 'bg-green-500/20 border-green-500 text-white'
                                        : 'bg-red-500/20 border-red-500 text-white'
                                    : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10 translate-y-0 hover:-translate-y-1'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border ${responses[currentQuestion.id] === option ? 'border-white' : 'border-white/20'
                                        }`}>
                                        {String.fromCharCode(65 + idx)}
                                    </span>
                                    <span className="font-medium">{option}</span>
                                </div>
                                {responses[currentQuestion.id] === option && (
                                    feedback?.isCorrect ? <CheckCircle2 size={24} className="text-green-500" /> : <XCircle size={24} className="text-red-500" />
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {/* Short Answer — renders when no options AND question type is short (short inputs) */}
                {(!currentQuestion.options || currentQuestion.options.length === 0) && currentQuestion.subtype !== 'long' && (
                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder={currentQuestion.placeholder || "Type your answer here..."}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-8 text-xl text-white focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all"
                            onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit(e.currentTarget.value)}
                        />
                        <p className="text-xs text-slate-500 ml-2">Press Enter to submit and continue</p>
                    </div>
                )}

                {/* Long Answer */}
                {(!currentQuestion.options || currentQuestion.options.length === 0) && currentQuestion.subtype === 'long' && (
                    <div className="space-y-4">
                        <textarea
                            rows={8}
                            placeholder={currentQuestion.placeholder || "Provide a detailed explanation..."}
                            className="w-full bg-white/5 border border-white/10 rounded-3xl py-6 px-8 text-lg text-white focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all resize-none"
                        />
                        <button
                            onClick={(e) => {
                                const textarea = (e.currentTarget.previousElementSibling as HTMLTextAreaElement);
                                handleTextSubmit(textarea.value);
                            }}
                            className="bg-primary text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/80 transition-all ml-auto"
                        >
                            Submit Answer <Send size={18} />
                        </button>
                    </div>
                )}
            </div>

            {/* Feedback Footer (MCQ) */}
            {feedback && (
                <div className={`p-6 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300 ${feedback.isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                    <div className="flex items-center gap-3">
                        {feedback.isCorrect ? <Sparkles size={24} /> : <AlertCircle size={24} />}
                        <span className="font-bold text-lg">{feedback.message}</span>
                    </div>
                    <button
                        onClick={() => handleNext()}
                        className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-xl font-bold transition-all border border-white/10"
                    >
                        {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                    </button>
                </div>
            )}
        </div>
    );
}
