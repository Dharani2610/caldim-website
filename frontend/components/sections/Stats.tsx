"use client";

import { useEffect, useRef, useState } from "react";
import Reveal from "@/frontend/components/ui/Reveal";
import SectionHeading from "@/frontend/components/ui/SectionHeading";
import type { StatContent } from "@/shared/content/types";

/**
 * A number that counts up as it scrolls into view, on a card that flips in
 * from edge-on — the 3D rotation is what makes it read as an odometer rolling
 * over rather than a value fading in.
 */
function Counter({ value, suffix, label }: StatContent) {
  const [display, setDisplay] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      setDisplay(value);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || done.current) return;
        done.current = true;
        setRevealed(true);

        if (reduced) {
          setDisplay(value);
          return;
        }

        const duration = 1400;
        const start = performance.now();
        const step = (nowMs: number) => {
          const t = Math.min(1, (nowMs - start) / duration);
          // Cubic ease-out: fast at first, then settling — how a mechanical
          // counter actually behaves.
          setDisplay(Math.round((1 - Math.pow(1 - t, 3)) * value));
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      },
      { threshold: 0.4 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div>
      <span style={{ perspective: "700px", display: "inline-block" }}>
        <span
          ref={ref}
          // The live value is announced once, at the end, rather than on every
          // frame — otherwise a screen reader reads out the entire count.
          aria-label={`${value.toLocaleString()}${suffix} ${label}`}
          className={`inline-block font-display text-[clamp(2.5rem,4vw+1rem,4.5rem)] font-semibold tabular-nums tracking-[-0.02em] leading-none text-paper motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-out-expo ${
            revealed ? "opacity-100" : "opacity-0"
          }`}
          style={{
            transform: revealed ? "rotateX(0deg)" : "rotateX(-88deg)",
            transformOrigin: "50% 100%",
          }}
        >
          <span aria-hidden="true">
            {display.toLocaleString()}
            {suffix}
          </span>
        </span>
      </span>
      <p className="label-mono mt-3 text-paper-dim" aria-hidden="true">
        {label}
      </p>
    </div>
  );
}

export default function Stats({ stats }: { stats: StatContent[] }) {
  return (
    <section className="relative overflow-hidden bg-steel-950 py-24 md:py-32" aria-label="By the numbers">
      {/* Wireframe frame in the background, at the depth of a drawing underlay. */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.12]"
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <g stroke="rgb(var(--color-mark-cool))" strokeWidth="1">
          {[0, 1, 2, 3, 4].map((i) => (
            <line key={`v${i}`} x1={100 + i * 150} y1={50} x2={100 + i * 150} y2={350} />
          ))}
          {[0, 1, 2].map((i) => (
            <line key={`h${i}`} x1={100} y1={100 + i * 100} x2={700} y2={100 + i * 100} />
          ))}
        </g>
      </svg>

      <div className="relative mx-auto max-w-[1440px] px-6 md:px-10">
        <SectionHeading eyebrow="BY THE NUMBERS" />

        <div className="grid grid-cols-2 gap-8 sm:gap-10 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
          {stats.map((stat, index) => (
            <Reveal key={stat.label} delay={index * 0.08}>
              <Counter {...stat} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
