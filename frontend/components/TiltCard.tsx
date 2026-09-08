"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent, ReactNode } from "react";

/**
 * A card that tilts toward the pointer.
 *
 * Two deliberate changes from the earlier version:
 *
 *  - The idle float is now opt-in. Every card on the page carried it, which
 *    meant thirty-odd elements drifting at once; on a page of dense technical
 *    copy that reads as instability rather than life. It is kept for the
 *    image-led surfaces where it works, and off where there is text to read.
 *  - Tilt is limited to mouse pointers. On a touchscreen the "hover" is the
 *    beginning of a scroll, and a card that lurches under the thumb fights it.
 */
export default function TiltCard({
  children,
  className = "",
  wrapperClassName = "",
  intensity = 7,
  floatDelay = 0,
  float = false,
  fillHeight = true,
}: {
  children: ReactNode;
  /** Classes for the inner tilting surface — background, border, padding, radius. */
  className?: string;
  /** Classes for the outer grid/flex item — column spans, explicit sizing. */
  wrapperClassName?: string;
  /** Maximum rotation, in degrees. */
  intensity?: number;
  /** Stagger for the idle float across a grid, in seconds. */
  floatDelay?: number;
  /** Enable the ambient float. Off by default — see the note above. */
  float?: boolean;
  /**
   * Stretch the inner card to fill its grid/flex track (the common case, for
   * equal-height cards in a row). Set false when `className` supplies its own
   * height, since Tailwind's utility order otherwise lets the default `h-full`
   * silently win over the caller's class.
   */
  fillHeight?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({});
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reduced || event.pointerType !== "mouse") return;
    const element = ref.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;

    setStyle({
      transform: `perspective(1000px) rotateX(${(-py * intensity).toFixed(2)}deg) rotateY(${(
        px * intensity
      ).toFixed(2)}deg) translateZ(6px)`,
      boxShadow: `${(-px * 14).toFixed(1)}px ${(16 - py * 8).toFixed(
        1
      )}px 38px -14px rgba(0,0,0,0.55), 0 0 24px -10px rgb(var(--color-accent) / 0.28)`,
    });
  };

  const handleLeave = () => setStyle({});

  const shouldFloat = float && !reduced;

  return (
    <div
      className={`${shouldFloat ? "motion-safe:animate-floaty" : ""} ${
        fillHeight ? "h-full" : ""
      } relative shrink-0 hover:z-20 ${wrapperClassName}`}
      style={shouldFloat ? { animationDelay: `${floatDelay}s` } : undefined}
    >
      <div
        ref={ref}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        className={`${
          fillHeight ? "h-full" : ""
        } card-surface motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out-expo will-change-transform ${className}`}
        style={style}
      >
        {children}
      </div>
    </div>
  );
}
