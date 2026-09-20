'use client';

import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react';

type Point = { x: number; y: number };
type Stroke = { colour: string; size: number; points: Point[] };

export interface DrawingHandle {
  toBlob(): Promise<Blob | null>;
  isEmpty(): boolean;
}

/** Repaint every stroke onto the canvas. */
function paint(canvas: HTMLCanvasElement, all: Stroke[]): void {
  const ctx = canvas.getContext?.('2d');
  if (!ctx) return;
  ctx.fillStyle = '#FFFDF7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const s of all) {
    ctx.strokeStyle = s.colour;
    ctx.lineWidth = s.size;
    ctx.beginPath();
    s.points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.stroke();
  }
}

const COLOURS = ['#1F1A15', '#C92F3A', '#2B55C6', '#1B6B57', '#D9A441', '#E0708A'];

/** A small drawing canvas with colour, size, undo and clear. Strokes are kept so undo is exact. */
export const DrawingCanvas = forwardRef<DrawingHandle, { width?: number; height?: number }>(
  function DrawingCanvas({ width = 264, height = 180 }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [colour, setColour] = useState(COLOURS[0] ?? '#1F1A15');
    const [size, setSize] = useState(4);
    const current = useRef<Stroke | null>(null);

    useEffect(() => {
      if (canvasRef.current) paint(canvasRef.current, strokes);
    }, [strokes]);

    useImperativeHandle(ref, () => ({
      toBlob: () =>
        new Promise<Blob | null>((resolve) =>
          canvasRef.current?.toBlob
            ? canvasRef.current.toBlob(resolve, 'image/png')
            : resolve(null),
        ),
      isEmpty: () => strokes.length === 0,
    }));

    const pos = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
      const r = e.currentTarget.getBoundingClientRect();
      return {
        x: ((e.clientX - r.left) / r.width) * width,
        y: ((e.clientY - r.top) / r.height) * height,
      };
    };

    return (
      <div className="space-y-2">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full max-w-[420px] touch-none rounded-md border border-line"
          aria-label="Drawing canvas"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            current.current = { colour, size, points: [pos(e)] };
          }}
          onPointerMove={(e) => {
            if (!current.current) return;
            current.current.points.push(pos(e));
            if (canvasRef.current) paint(canvasRef.current, [...strokes, current.current]);
          }}
          onPointerUp={() => {
            if (current.current) setStrokes((s) => [...s, current.current as Stroke]);
            current.current = null;
          }}
          onPointerLeave={() => {
            if (current.current) setStrokes((s) => [...s, current.current as Stroke]);
            current.current = null;
          }}
        />
        <div className="flex flex-wrap items-center gap-2">
          <div role="radiogroup" aria-label="Colour" className="flex gap-1">
            {COLOURS.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={colour === c}
                aria-label={c}
                onClick={() => setColour(c)}
                className={`h-6 w-6 rounded-full border-2 ${colour === c ? 'border-ink' : 'border-transparent'}`}
                style={{ background: c }}
              />
            ))}
          </div>
          <label className="flex items-center gap-1 text-xs">
            Size
            <input
              type="range"
              min={1}
              max={16}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              aria-label="Pen size"
            />
          </label>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setStrokes((s) => s.slice(0, -1))}
            disabled={strokes.length === 0}
          >
            Undo
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setStrokes([])}
            disabled={strokes.length === 0}
          >
            Clear
          </button>
        </div>
      </div>
    );
  },
);
