"use client";

import { useEffect, useRef } from "react";

/**
 * The CAD crosshair that replaces the system cursor.
 *
 * The page no longer sets `cursor: none` in CSS unconditionally. This
 * component adds `has-custom-cursor` to the document element only once it has
 * confirmed a fine pointer and mounted successfully — so if the script fails,
 * is blocked, or the visitor is on a touch device, they keep the cursor their
 * operating system gave them rather than losing it entirely.
 */
export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Coarse pointers and reduced-motion users get the native cursor.
    if (
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const root = document.documentElement;
    root.classList.add("has-custom-cursor");

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let renderedX = x;
    let renderedY = y;
    let rafId = 0;

    const move = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
    };

    const render = () => {
      // A little smoothing: the crosshair trails the pointer by a frame or two,
      // which reads as weight rather than lag at this distance.
      renderedX += (x - renderedX) * 0.35;
      renderedY += (y - renderedY) * 0.35;
      element.style.transform = `translate(${renderedX.toFixed(1)}px, ${renderedY.toFixed(
        1
      )}px) translate(-50%, -50%)`;
      rafId = requestAnimationFrame(render);
    };

    const growTargets = "a, button, input, select, textarea, [data-cursor-grow]";

    const onOver = (event: PointerEvent) => {
      if ((event.target as HTMLElement)?.closest(growTargets)) {
        element.style.width = "52px";
        element.style.height = "52px";
      }
    };

    const onOut = (event: PointerEvent) => {
      if ((event.target as HTMLElement)?.closest(growTargets)) {
        element.style.width = "28px";
        element.style.height = "28px";
      }
    };

    // Hide the crosshair when the pointer leaves the window, so it doesn't
    // sit frozen at the edge while the visitor is in another application.
    const onLeaveWindow = () => {
      element.style.opacity = "0";
    };
    const onEnterWindow = () => {
      element.style.opacity = "1";
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", onOver);
    window.addEventListener("pointerout", onOut);
    document.addEventListener("pointerleave", onLeaveWindow);
    document.addEventListener("pointerenter", onEnterWindow);
    rafId = requestAnimationFrame(render);

    return () => {
      root.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerout", onOut);
      document.removeEventListener("pointerleave", onLeaveWindow);
      document.removeEventListener("pointerenter", onEnterWindow);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return <div ref={ref} className="crosshair" aria-hidden="true" />;
}
