"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";

export default function Badge3D({
  code,
  label,
  delay = 0,
}: {
  /** short code shown inside the seal, e.g. "TS", "AISC 360" */
  code: string;
  /** full name shown below the seal */
  label: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hoverStyle, setHoverStyle] = useState<CSSProperties>({});
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setHoverStyle({
      transform: `rotateY(${(px * 26).toFixed(1)}deg) rotateX(${(-py * 26).toFixed(1)}deg) scale(1.06)`,
      animationPlayState: "paused",
    });
  };

  const handleLeave = () => setHoverStyle({});

  return (
    <div className="flex flex-col items-center gap-2.5" style={{ perspective: "600px" }}>
      <div
        ref={ref}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        className="relative motion-safe:animate-badge-tilt motion-safe:transition-transform motion-safe:duration-200 will-change-transform"
        style={{
          transformStyle: "preserve-3d",
          animationDelay: reduced ? undefined : `${delay}s`,
          ...hoverStyle,
        }}
      >
        <svg width="76" height="76" viewBox="0 0 76 76" aria-hidden="true">
          <polygon
            points="38,3 68,20 68,56 38,73 8,56 8,20"
            fill="rgb(var(--color-steel-900))"
            stroke="rgb(var(--color-accent))"
            strokeWidth="1.25"
            opacity="0.9"
          />
          <polygon
            points="38,10 61,23 61,53 38,66 15,53 15,23"
            fill="none"
            stroke="rgb(var(--color-accent))"
            strokeWidth="0.75"
            opacity="0.45"
          />
          <text
            x="38"
            y="43"
            textAnchor="middle"
            fontFamily="var(--font-jetbrains-mono), monospace"
            fontWeight="600"
            fontSize={code.length > 4 ? "11" : "15"}
            fill="rgb(var(--color-paper))"
          >
            {code}
          </text>
        </svg>
      </div>
      <span className="label-mono text-paper-dim/70 text-[10px] md:text-[11px] text-center leading-tight max-w-[92px]">
        {label}
      </span>
    </div>
  );
}
