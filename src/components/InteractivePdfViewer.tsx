'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
    ZoomIn, ZoomOut, Maximize, MousePointer2,
    Pencil, Highlighter, Eraser, Trash2,
    ChevronLeft, ChevronRight, Download, Move
} from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for tailwind classes
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// PDF.js worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Annotation {
    type: 'pen' | 'highlighter';
    color: string;
    points: { x: number; y: number }[];
    width: number;
}

interface InteractivePdfViewerProps {
    url: string;
}

export default function InteractivePdfViewer({ url }: InteractivePdfViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.0);
    const [tool, setTool] = useState<'select' | 'pen' | 'highlighter' | 'eraser' | 'pan'>('select');
    const [color, setColor] = useState<string>('#3b82f6'); // Default blue
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const currentPathRef = useRef<{ x: number; y: number }[]>([]);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
    }

    // Draw annotations on canvas
    const drawLine = useCallback((ctx: CanvasRenderingContext2D, annotation: Annotation) => {
        if (annotation.points.length < 2) return;

        ctx.beginPath();
        ctx.strokeStyle = annotation.color;
        ctx.lineWidth = annotation.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = annotation.type === 'highlighter' ? 0.4 : 1;

        ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
        for (let i = 1; i < annotation.points.length; i++) {
            ctx.lineTo(annotation.points[i].x, annotation.points[i].y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
    }, []);

    const redrawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        annotations.forEach(ann => drawLine(ctx, ann));
    }, [annotations, drawLine]);

    useEffect(() => {
        redrawCanvas();
    }, [redrawCanvas]);

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        return {
            x: (clientX - rect.left) / scale,
            y: (clientY - rect.top) / scale
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (tool === 'select' || tool === 'pan') return;
        setIsDrawing(true);
        const coords = getCoordinates(e);
        currentPathRef.current = [coords];
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || tool === 'select' || tool === 'pan') return;
        const coords = getCoordinates(e);
        currentPathRef.current.push(coords);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Temporary draw for feedback
        ctx.strokeStyle = color;
        ctx.lineWidth = tool === 'highlighter' ? 20 : 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = tool === 'highlighter' ? 0.4 : 1;

        const points = currentPathRef.current;
        if (points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
            ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
            ctx.stroke();
        }
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);

        if (currentPathRef.current.length > 1) {
            const newAnnotation: Annotation = {
                type: tool === 'highlighter' ? 'highlighter' : 'pen',
                color: color,
                width: tool === 'highlighter' ? 20 : 3,
                points: [...currentPathRef.current]
            };
            setAnnotations([...annotations, newAnnotation]);
        }
        currentPathRef.current = [];
    };

    return (
        <div className="flex flex-col h-full bg-slate-900/50 rounded-2xl overflow-hidden border border-white/10">
            {/* Interactive Toolbar */}
            <div className="flex items-center justify-between p-3 bg-white/5 border-b border-white/10 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    {/* Tool Selection */}
                    <div className="flex bg-black/30 p-1 rounded-lg border border-white/5">
                        <ToolbarButton
                            active={tool === 'select'}
                            onClick={() => setTool('select')}
                            icon={<MousePointer2 size={16} />}
                            label="Select"
                        />
                        <ToolbarButton
                            active={tool === 'pan'}
                            onClick={() => setTool('pan')}
                            icon={<Move size={16} />}
                            label="Pan"
                        />
                        <ToolbarButton
                            active={tool === 'pen'}
                            onClick={() => setTool('pen')}
                            icon={<Pencil size={16} />}
                            label="Pen"
                        />
                        <ToolbarButton
                            active={tool === 'highlighter'}
                            onClick={() => setTool('highlighter')}
                            icon={<Highlighter size={16} />}
                            label="Highlight"
                        />
                        <ToolbarButton
                            active={tool === 'eraser'}
                            onClick={() => setTool('eraser')}
                            icon={<Eraser size={16} />}
                            label="Eraser"
                        />
                    </div>

                    {/* Color Picker */}
                    {(tool === 'pen' || tool === 'highlighter') && (
                        <div className="flex gap-1 bg-black/30 p-1 rounded-lg border border-white/5 ml-2">
                            {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#ffffff'].map(c => (
                                <button
                                    key={c}
                                    className={cn(
                                        "w-5 h-5 rounded-full border border-white/10 transition-transform hover:scale-110",
                                        color === c && "ring-2 ring-white scale-110 shadow-lg"
                                    )}
                                    style={{ backgroundColor: c }}
                                    onClick={() => setColor(c)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Zoom Controls */}
                    <div className="flex items-center bg-black/30 rounded-lg border border-white/5">
                        <button
                            onClick={() => setScale(s => Math.max(0.5, s - 0.2))}
                            className="p-2 hover:bg-white/10 text-slate-400 transition-colors"
                        >
                            <ZoomOut size={16} />
                        </button>
                        <span className="text-[10px] font-mono text-slate-300 min-w-[45px] text-center border-x border-white/5">
                            {Math.round(scale * 100)}%
                        </span>
                        <button
                            onClick={() => setScale(s => Math.min(3, s + 0.2))}
                            className="p-2 hover:bg-white/10 text-slate-400 transition-colors"
                        >
                            <ZoomIn size={16} />
                        </button>
                    </div>

                    <button
                        onClick={() => setAnnotations([])}
                        className="p-2 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg border border-white/5 transition-all"
                        title="Clear All Annotations"
                    >
                        <Trash2 size={16} />
                    </button>

                    {/* Download Button */}
                    <a
                        href={url}
                        download
                        className="flex items-center gap-1.5 px-3 py-2 bg-primary/20 hover:bg-primary/40 text-primary border border-primary/30 rounded-lg transition-all font-semibold text-[11px] uppercase tracking-wide shadow-sm hover:shadow-primary/20 hover:shadow-md"
                        title="Download PDF"
                    >
                        <Download size={14} />
                        <span>Download</span>
                    </a>
                </div>
            </div>

            {/* PDF View Area */}
            <div
                ref={containerRef}
                className={cn(
                    "flex-1 overflow-auto p-8 flex justify-center items-start custom-scrollbar bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-950",
                    tool === 'pan' ? "cursor-grab active:cursor-grabbing" : "cursor-crosshair"
                )}
            >
                <motion.div
                    className="relative shadow-2xl shadow-black/50 bg-white group/viewer"
                    style={{ scale }}
                    drag={tool === 'pan'}
                    dragConstraints={containerRef}
                >
                    {/* Active Resize Handle */}
                    <motion.div
                        className="absolute -right-3 -bottom-3 w-8 h-8 bg-primary rounded-full cursor-se-resize flex items-center justify-center shadow-lg z-50 hover:scale-110 active:scale-95 transition-transform"
                        drag
                        dragConstraints={{ left: 0, top: 0, right: 0, bottom: 0 }}
                        dragElastic={0}
                        dragMomentum={false}
                        onDrag={(_, info) => {
                            const delta = (info.delta.x + info.delta.y) / 200;
                            setScale(s => Math.min(3, Math.max(0.4, s + delta)));
                        }}
                    >
                        <Maximize size={16} className="text-white" />
                    </motion.div>
                    <Document
                        file={url}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={
                            <div className="flex flex-col items-center justify-center p-20 text-slate-500">
                                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                                <p className="text-sm font-medium animate-pulse">Loading smart PDF...</p>
                            </div>
                        }
                    >
                        <Page
                            pageNumber={pageNumber}
                            scale={1} // We use framer-motion for scaling
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            onRenderSuccess={(page) => {
                                if (canvasRef.current) {
                                    canvasRef.current.width = page.width;
                                    canvasRef.current.height = page.height;
                                    redrawCanvas();
                                }
                            }}
                        />
                    </Document>

                    {/* Annotation Canvas Overlay */}
                    <canvas
                        ref={canvasRef}
                        className="absolute top-0 left-0 w-full h-full pointer-events-auto"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                    />
                </motion.div>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center justify-between px-6 py-3 bg-white/5 border-t border-white/10 backdrop-blur-md">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Page {pageNumber} of {numPages}
                </p>
                <div className="flex gap-1">
                    <button
                        disabled={pageNumber <= 1}
                        onClick={() => setPageNumber(p => p - 1)}
                        className="p-1.5 rounded-md hover:bg-white/10 disabled:opacity-30 text-slate-300 transition-colors"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        disabled={pageNumber >= numPages}
                        onClick={() => setPageNumber(p => p + 1)}
                        className="p-1.5 rounded-md hover:bg-white/10 disabled:opacity-30 text-slate-300 transition-colors"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}

function ToolbarButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "p-2 rounded-md transition-all flex flex-col items-center gap-1 group relative",
                active ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:bg-white/10"
            )}
            title={label}
        >
            {icon}
            <span className="sr-only">{label}</span>
            {active && (
                <motion.div
                    layoutId="active-tool"
                    className="absolute inset-0 bg-primary/20 rounded-md -z-10"
                />
            )}
        </button>
    );
}
