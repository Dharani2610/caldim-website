"use client";

import { useId, useRef, useState } from "react";

/** Wireframe "Tekla model" render, built as SVG */
function ModelRender() {
  return (
    <svg viewBox="0 0 400 260" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="260" fill="rgb(var(--color-steel-950))" />
      <g stroke="rgb(var(--color-mark-cool))" strokeWidth="1" opacity="0.8">
        {[0, 1, 2, 3].map((i) => (
          <line key={`v${i}`} x1={60 + i * 95} y1={40} x2={60 + i * 95} y2={220} />
        ))}
        {[0, 1, 2].map((i) => (
          <line key={`h${i}`} x1={60} y1={60 + i * 70} x2={345} y2={60 + i * 70} />
        ))}
        <line x1={60} y1={220} x2={155} y2={150} />
        <line x1={155} y1={220} x2={250} y2={150} />
      </g>
    </svg>
  );
}

/** Erected-steel style render, built as SVG */
function ErectedRender({ gradientId }: { gradientId: string }) {
  return (
    <svg viewBox="0 0 400 260" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(var(--color-blueprint))" />
          <stop offset="100%" stopColor="rgb(var(--color-steel-950))" />
        </linearGradient>
      </defs>
      <rect width="400" height="260" fill={`url(#${gradientId})`} />
      <g stroke="rgb(var(--color-steel-mark))" strokeWidth="3" strokeLinecap="square">
        {[0, 1, 2, 3].map((i) => (
          <line key={`v${i}`} x1={60 + i * 95} y1={40} x2={60 + i * 95} y2={220} />
        ))}
        {[0, 1, 2].map((i) => (
          <line key={`h${i}`} x1={60} y1={60 + i * 70} x2={345} y2={60 + i * 70} />
        ))}
      </g>
      <g stroke="rgb(var(--color-accent))" strokeWidth="2.5">
        <line x1={60} y1={220} x2={155} y2={150} />
        <line x1={155} y1={220} x2={250} y2={150} />
      </g>
    </svg>
  );
}

export default function BeforeAfterSlider() {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  // Three of these render side by side; a shared literal gradient id would
  // make all of them resolve to whichever one mounted first.
  const gradientId = `bas-sky-${useId().replace(/:/g, "")}`;

  const handleMove = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(100, Math.max(0, pct)));
  };

  return (
    <div
      ref={ref}
      className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-blueprint select-none touch-none"
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        handleMove(e.clientX);
      }}
      onPointerMove={(e) => {
        if (e.buttons === 1) handleMove(e.clientX);
      }}
    >
      <div className="absolute inset-0">
        <ErectedRender gradientId={gradientId} />
      </div>
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <ModelRender />
      </div>
      <div
        className="absolute top-0 bottom-0 w-px bg-accent z-20"
        style={{ left: `${pos}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-8 w-8 bg-accent flex items-center justify-center text-steel-950 shadow-md">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M4 2L1 7L4 12M10 2L13 7L10 12" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </div>
      </div>
      <span className="pointer-events-none absolute top-3 left-3 z-10 label-mono-sm font-semibold text-paper bg-steel-950/90 border border-blueprint/60 px-2 py-0.5 rounded backdrop-blur-sm">
        MODEL
      </span>
      <span className="pointer-events-none absolute top-3 right-3 z-10 label-mono-sm font-semibold text-paper bg-steel-950/90 border border-blueprint/60 px-2 py-0.5 rounded backdrop-blur-sm">
        ERECTED
      </span>
      <div className="pointer-events-none absolute inset-x-2.5 bottom-2.5 z-10 flex items-center justify-between gap-1.5">
        <span className="whitespace-nowrap rounded border border-blueprint/70 bg-steel-950/90 px-2 py-1 font-mono text-[9.5px] font-bold tracking-tight text-accent backdrop-blur-sm">
          TEKLA MODEL — WIREFRAME
        </span>
        <span className="whitespace-nowrap rounded border border-blueprint/70 bg-steel-950/90 px-2 py-1 font-mono text-[9.5px] font-bold tracking-tight text-paper backdrop-blur-sm">
          ERECTED STEEL — FIELD PHOTO STYLE
        </span>
      </div>
    </div>
  );
}
