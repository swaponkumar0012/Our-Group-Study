'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
    durationSeconds: number;
    onComplete?: () => void;
    label?: string;
}

export default function Timer({ durationSeconds, onComplete, label }: TimerProps) {
    const [timeLeft, setTimeLeft] = useState(durationSeconds);

    useEffect(() => {
        if (timeLeft <= 0) {
            if (onComplete) onComplete();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, onComplete]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="glass p-6 rounded-2xl flex flex-col items-center justify-center min-w-[200px]">
            {label && <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{label}</span>}
            <div className="flex items-center gap-3">
                <Clock className={timeLeft < 60 ? 'text-accent animate-pulse' : 'text-primary'} size={32} />
                <span className="text-4xl font-mono font-bold text-white">
                    {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                </span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full mt-4 overflow-hidden">
                <div
                    className={`h-full transition-all duration-1000 ${timeLeft < 60 ? 'bg-accent' : 'bg-primary'}`}
                    style={{ width: `${(timeLeft / durationSeconds) * 100}%` }}
                />
            </div>
        </div>
    );
}
