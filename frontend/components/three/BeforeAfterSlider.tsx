"use client";

import { useRef, useState, useCallback } from "react";

export interface BeforeAfterSliderProps {
  modelImage?: string;
  erectedImage?: string;
  modelAlt?: string;
  erectedAlt?: string;
  modelTag?: string;
  erectedTag?: string;
  className?: string;
}

export default function BeforeAfterSlider({
  modelImage = "/images/canopy-model-tight.png",
  erectedImage = "/images/canopy-erected.jpg",
  modelAlt = "Tekla 3D structural model of curved canopy",
  erectedAlt = "Erected steel and glass canopy structure field photo",
  modelTag = "TEKLA MODEL — WIREFRAME",
  erectedTag = "ERECTED STEEL — FIELD PHOTO STYLE",
  className = "",
}: BeforeAfterSliderProps) {
  const [pos, setPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(100, Math.max(0, pct)));
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // fallback if pointer capture fails
    }
    setIsDragging(true);
    updatePosFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging || e.buttons === 1) {
      updatePosFromClientX(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setIsDragging(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setPos((prev) => Math.max(0, prev - 5));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setPos((prev) => Math.min(100, prev + 5));
    }
  };

  return (
    <div
      ref={containerRef}
      role="slider"
      aria-label="Comparison slider: Tekla 3D Model to Erected Steel"
      aria-valuenow={Math.round(pos)}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`group relative aspect-[4/3] w-full select-none touch-none overflow-hidden rounded-2xl border border-blueprint bg-steel-950 cursor-ew-resize focus:outline-none focus:ring-2 focus:ring-accent ${className}`}
    >
      {/* BASE LAYER (Revealed on the RIGHT when slider moves LEFT): Erected Steel Field Photo */}
      <div className="absolute inset-0 bg-steel-950">
        <img
          src={erectedImage}
          alt={erectedAlt}
          className="h-full w-full object-cover object-center"
          loading="lazy"
          draggable={false}
        />
      </div>

      {/* OVERLAY LAYER (Revealed on the LEFT when slider moves RIGHT): Tekla 3D Model */}
      <div
        className="absolute inset-0 overflow-hidden bg-white"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        <img
          src={modelImage}
          alt={modelAlt}
          className="h-full w-full object-contain object-center"
          loading="lazy"
          draggable={false}
        />
      </div>

      {/* SLIDER DIVIDER LINE */}
      <div
        className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-accent z-20 shadow-[0_0_12px_rgba(59,130,246,0.7)]"
        style={{ left: `${pos}%` }}
      >
        {/* SLIDER HANDLE BUTTON */}
        <div className="pointer-events-auto absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-8 w-8 rounded-lg bg-accent flex items-center justify-center text-steel-950 shadow-xl border border-white/60 active:scale-95 transition-transform cursor-ew-resize hover:bg-accent-light">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-steel-950">
            <path
              d="M4 2L1 7L4 12M10 2L13 7L10 12"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* TOP BADGES */}
      <span className="pointer-events-none absolute top-3 left-3 z-10 label-mono-sm font-semibold text-paper bg-steel-950/85 border border-blueprint/60 px-2 py-0.5 rounded shadow-sm backdrop-blur-sm">
        MODEL
      </span>
      <span className="pointer-events-none absolute top-3 right-3 z-10 label-mono-sm font-semibold text-paper bg-steel-950/85 border border-blueprint/60 px-2 py-0.5 rounded shadow-sm backdrop-blur-sm">
        ERECTED
      </span>

      {/* BOTTOM BADGES */}
      <div className="pointer-events-none absolute inset-x-2.5 bottom-2.5 z-10 flex items-center justify-between gap-1.5">
        <span className="whitespace-nowrap rounded border border-blueprint/70 bg-steel-950/85 px-2 py-1 font-mono text-[9.5px] font-bold tracking-tight text-accent backdrop-blur-sm shadow-sm">
          {modelTag}
        </span>
        <span className="whitespace-nowrap rounded border border-blueprint/70 bg-steel-950/85 px-2 py-1 font-mono text-[9.5px] font-bold tracking-tight text-paper backdrop-blur-sm shadow-sm">
          {erectedTag}
        </span>
      </div>
    </div>
  );
}

