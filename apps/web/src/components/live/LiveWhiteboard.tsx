'use client';

import { Pen, Eraser, Trash2, Undo2, Minus, Plus } from 'lucide-react';
import { useEffect, useRef, useState, useCallback, type PointerEvent } from 'react';

import { cn } from '@/lib/utils';

import type { Socket } from 'socket.io-client';

// ------------------------------------------------------------------ types

type Tool = 'pen' | 'eraser';

interface Stroke {
  tool: Tool;
  color: string;
  width: number;
  points: { x: number; y: number }[];
}

type DrawEvent =
  | { type: 'stroke'; stroke: Stroke }
  | { type: 'clear' };

interface Props {
  socket: Socket | null;
  className?: string;
}

// ------------------------------------------------------------------ constants

const PALETTE = ['#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#000000'];
const DEFAULT_COLOR = '#ffffff';
const DEFAULT_WIDTH = 3;
const MAX_UNDO = 50;

// ------------------------------------------------------------------ component

export function LiveWhiteboard({ socket, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isDrawing, setIsDrawing] = useState(false);

  // local stroke history for undo
  const strokesRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<{ x: number; y: number }[]>([]);

  // ------------------------------------------------------------------ drawing helpers

  const getCtx = () => canvasRef.current?.getContext('2d') ?? null;

  const relativePoint = (e: PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvasRef.current!.width / rect.width),
      y: (e.clientY - rect.top) * (canvasRef.current!.height / rect.height),
    };
  };

  const applyStroke = useCallback((ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length < 2) {return;}
    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = stroke.tool === 'eraser' ? stroke.width * 4 : stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = stroke.color;
    }
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }, []);

  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) {return;}
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of strokesRef.current) {
      applyStroke(ctx, s);
    }
  }, [applyStroke]);

  // ------------------------------------------------------------------ canvas resize

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) {return;}

    const resize = () => {
      const { width: w, height: h } = container.getBoundingClientRect();
      canvas.width = w;
      canvas.height = h;
      redrawAll();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [redrawAll]);

  // ------------------------------------------------------------------ socket listener

  const applyRemoteEvent = useCallback((event: DrawEvent) => {
    const ctx = getCtx();
    if (!ctx) {return;}
    if (event.type === 'clear') {
      strokesRef.current = [];
      redrawAll();
    } else if (event.type === 'stroke') {
      strokesRef.current.push(event.stroke);
      applyStroke(ctx, event.stroke);
    }
  }, [applyStroke, redrawAll]);

  useEffect(() => {
    if (!socket) {return;}
    const handler = ({ data }: { userId: string; data: DrawEvent }) => {
      applyRemoteEvent(data);
    };
    socket.on('whiteboard-update', handler);
    return () => { socket.off('whiteboard-update', handler); };
  }, [socket, applyRemoteEvent]);

  // ------------------------------------------------------------------ pointer events

  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    canvasRef.current?.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    currentStrokeRef.current = [relativePoint(e)];
  };

  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) {return;}
    const pt = relativePoint(e);
    currentStrokeRef.current.push(pt);

    // draw live feedback
    const ctx = getCtx();
    if (ctx && currentStrokeRef.current.length >= 2) {
      const pts = currentStrokeRef.current;
      const stroke: Stroke = { tool, color, width, points: [pts[pts.length - 2], pts[pts.length - 1]] };
      applyStroke(ctx, stroke);
    }
  };

  const onPointerUp = () => {
    if (!isDrawing) {return;}
    setIsDrawing(false);

    const pts = currentStrokeRef.current;
    if (pts.length < 2) {return;}

    const stroke: Stroke = { tool, color, width, points: pts };
    strokesRef.current.push(stroke);
    if (strokesRef.current.length > MAX_UNDO) {
      strokesRef.current.shift();
    }

    const event: DrawEvent = { type: 'stroke', stroke };
    socket?.emit('whiteboard-draw', event);
    currentStrokeRef.current = [];
  };

  // ------------------------------------------------------------------ actions

  const undo = () => {
    if (!strokesRef.current.length) {return;}
    strokesRef.current.pop();
    redrawAll();
  };

  const clearBoard = () => {
    strokesRef.current = [];
    redrawAll();
    socket?.emit('whiteboard-draw', { type: 'clear' } satisfies DrawEvent);
  };

  // ------------------------------------------------------------------ render

  return (
    <div className={cn('flex flex-col bg-gray-900 select-none', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 border-b border-gray-700 flex-wrap">
        {/* Tool toggle */}
        <div className="flex rounded-lg overflow-hidden border border-gray-600">
          {(['pen', 'eraser'] as Tool[]).map(t => (
            <button
              key={t}
              onClick={() => setTool(t)}
              className={cn(
                'p-2 transition-colors',
                tool === t ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600',
              )}
              title={t.charAt(0).toUpperCase() + t.slice(1)}
            >
              {t === 'pen' ? <Pen className="h-3.5 w-3.5" /> : <Eraser className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>

        {/* Color palette */}
        <div className="flex items-center gap-1">
          {PALETTE.map(c => (
            <button
              key={c}
              onClick={() => { setColor(c); setTool('pen'); }}
              className={cn(
                'h-6 w-6 rounded-full border-2 transition-transform hover:scale-110',
                color === c && tool === 'pen' ? 'border-white scale-110' : 'border-transparent',
              )}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>

        {/* Stroke width */}
        <div className="flex items-center gap-1.5 ml-1">
          <button
            onClick={() => setWidth(w => Math.max(1, w - 1))}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="text-xs text-gray-300 w-5 text-center">{width}</span>
          <button
            onClick={() => setWidth(w => Math.min(20, w + 1))}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        <div className="flex-1" />

        {/* Undo & clear */}
        <button
          onClick={undo}
          className="p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white transition-colors"
          title="Undo"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={clearBoard}
          className="p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
          title="Clear board"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="block touch-none"
          style={{ cursor: tool === 'eraser' ? 'cell' : 'crosshair' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        />
      </div>
    </div>
  );
}
