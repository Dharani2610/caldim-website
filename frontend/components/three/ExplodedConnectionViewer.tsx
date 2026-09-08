"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState, type PointerEvent } from "react";
import { Maximize2, Minimize2, RotateCcw } from "lucide-react";
import { useNearViewport, useWebGL } from "@/frontend/components/three/useWebGL";

/**
 * Interactive connection viewer.
 *
 * The WebGL scene is code-split and only requested once the element is near
 * the viewport — three.js and drei are a large payload, and there is no reason
 * for someone who never scrolls this far to download them.
 */
const ConnectionScene = dynamic(() => import("@/frontend/components/three/ConnectionScene"), {
  ssr: false,
  loading: () => <ViewerSkeleton />,
});

function ViewerSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center" aria-hidden="true">
      <div className="flex items-center gap-3">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
        <span className="label-mono-sm text-paper-dim/70">LOADING MODEL</span>
      </div>
    </div>
  );
}

/**
 * Static stand-in shown when WebGL is unavailable or the visitor has asked for
 * reduced motion. It carries the same information as the live scene — the
 * parts and how they stack — so nothing is lost, only the interactivity.
 */
function StaticConnection() {
  return (
    <svg
      viewBox="0 0 420 300"
      className="h-full w-full"
      role="img"
      aria-label="Moment connection assembly: a wide-flange column with continuity stiffeners, a bolted end plate, and an incoming beam."
    >
      <g stroke="rgb(var(--color-blueprint-light))" strokeWidth="1" opacity="0.5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line key={`v${i}`} x1={40 + i * 68} y1={24} x2={40 + i * 68} y2={276} />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <line key={`h${i}`} x1={24} y1={40 + i * 68} x2={396} y2={40 + i * 68} />
        ))}
      </g>

      {/* Column */}
      <rect x="118" y="36" width="38" height="228" fill="rgb(var(--color-steel-mark))" opacity="0.9" />
      <rect x="108" y="36" width="10" height="228" fill="rgb(var(--color-steel-mark))" opacity="0.6" />
      <rect x="156" y="36" width="10" height="228" fill="rgb(var(--color-steel-mark))" opacity="0.6" />

      {/* Stiffeners */}
      <rect x="120" y="112" width="34" height="7" fill="rgb(var(--color-accent-vivid))" opacity="0.85" />
      <rect x="120" y="182" width="34" height="7" fill="rgb(var(--color-accent-vivid))" opacity="0.85" />

      {/* End plate */}
      <rect x="168" y="104" width="9" height="93" fill="rgb(var(--color-accent-vivid))" />

      {/* Beam */}
      <rect x="182" y="126" width="196" height="48" fill="rgb(var(--color-steel-mark))" opacity="0.9" />
      <rect x="182" y="126" width="196" height="8" fill="rgb(var(--color-steel-mark))" />
      <rect x="182" y="166" width="196" height="8" fill="rgb(var(--color-steel-mark))" />

      {/* Bolt group */}
      {[116, 136, 164, 184].map((y) => (
        <g key={y}>
          <circle cx="172" cy={y} r="4" fill="rgb(var(--color-mark-cool))" />
        </g>
      ))}

      <text
        x="24"
        y="292"
        fontFamily="var(--font-jetbrains-mono), monospace"
        fontSize="9"
        letterSpacing="1.2"
        fill="rgb(var(--color-paper-dim))"
      >
        MOMENT CONNECTION — BOLTED END PLATE, (8) 7/8&quot; A325
      </text>
    </svg>
  );
}

export default function ExplodedConnectionViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const webgl = useWebGL();
  const near = useNearViewport(containerRef);

  const spin = useRef(0.6);
  const explode = useRef(0);
  const dragging = useRef(false);
  const lastX = useRef(0);

  const [explodeDisplay, setExplodeDisplay] = useState(0);
  const [showLabels, setShowLabels] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const setExplode = useCallback((value: number) => {
    explode.current = value;
    setExplodeDisplay(value);
  }, []);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    lastX.current = event.clientX;
    setHasInteracted(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    spin.current += (event.clientX - lastX.current) * 0.009;
    lastX.current = event.clientX;
  };

  /** Keyboard equivalent for the drag, so the model isn't mouse-only. */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = 0.18;
    if (event.key === "ArrowLeft") {
      spin.current -= step;
      setHasInteracted(true);
      event.preventDefault();
    } else if (event.key === "ArrowRight") {
      spin.current += step;
      setHasInteracted(true);
      event.preventDefault();
    }
  };

  const live = webgl === "ready";

  return (
    <figure className="m-0">
      <div
        ref={containerRef}
        className="relative h-80 w-full touch-none overflow-hidden rounded-2xl border border-blueprint bg-steel-900/40 md:h-[440px]"
      >
        {live ? (
          <>
            <div
              role="application"
              tabIndex={0}
              aria-label="Interactive 3D moment connection. Drag or use the left and right arrow keys to rotate; use the slider below to separate the parts."
              className="h-full w-full cursor-grab outline-offset-[-3px] active:cursor-grabbing"
              onPointerDown={handlePointerDown}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onPointerLeave={endDrag}
              onPointerMove={handlePointerMove}
              onKeyDown={handleKeyDown}
            >
              {near ? (
                <ConnectionScene
                  spin={spin}
                  explode={explode}
                  dragging={dragging}
                  showLabels={showLabels}
                />
              ) : (
                <ViewerSkeleton />
              )}
            </div>

            {!hasInteracted && (
              <p className="label-mono-sm pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-blueprint-light bg-steel-950/80 px-3 py-1.5 text-paper-dim backdrop-blur-sm">
                DRAG TO ROTATE
              </p>
            )}

            <button
              type="button"
              onClick={() => setShowLabels((value) => !value)}
              aria-pressed={showLabels}
              className="label-mono-sm absolute right-3 top-3 rounded-full border border-blueprint-light bg-steel-950/80 px-3 py-1.5 text-paper-dim backdrop-blur-sm transition-colors hover:border-accent hover:text-accent"
            >
              {showLabels ? "HIDE MARKS" : "SHOW MARKS"}
            </button>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center p-4">
            <StaticConnection />
          </div>
        )}
      </div>

      {live && (
        <div className="mt-4 flex items-center gap-4">
          <Minimize2 size={14} className="shrink-0 text-paper-dim/70" aria-hidden="true" />
          <label className="flex-1">
            <span className="sr-only">Separate the connection parts</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={explodeDisplay}
              onChange={(event) => {
                setExplode(Number(event.target.value));
                setHasInteracted(true);
              }}
              className="h-1 w-full cursor-pointer appearance-none rounded-full bg-blueprint accent-accent"
              aria-valuetext={`${Math.round(explodeDisplay * 100)} percent separated`}
            />
          </label>
          <Maximize2 size={14} className="shrink-0 text-paper-dim/70" aria-hidden="true" />
          <button
            type="button"
            onClick={() => {
              setExplode(0);
              spin.current = 0.6;
            }}
            className="label-mono-sm inline-flex shrink-0 items-center gap-1.5 text-paper-dim transition-colors hover:text-accent"
          >
            <RotateCcw size={13} aria-hidden="true" />
            RESET
          </button>
        </div>
      )}

      <figcaption className="label-mono-sm mt-3 text-paper-dim/70">
        {live
          ? "BOLTED END-PLATE MOMENT CONNECTION — DRAG TO ROTATE, SLIDE TO EXPLODE"
          : "BOLTED END-PLATE MOMENT CONNECTION — AISC 360-22"}
      </figcaption>
    </figure>
  );
}
