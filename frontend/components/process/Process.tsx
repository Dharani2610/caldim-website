"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { processPhases } from "@/shared/data/content";
import Reveal from "@/frontend/components/ui/Reveal";

/**
 * RFQ to issued-for-fab, in six phases.
 *
 * On desktop the track is pinned and scrubbed horizontally by scroll. Below
 * `lg`, and whenever reduced motion is requested, it becomes an ordinary
 * scroll-snap carousel — the pinned timeline needs viewport height it doesn't
 * have on a phone, and the previous build hid every phase after the first in
 * exactly those cases because the `w-max` track sat inside `overflow-hidden`
 * with nothing driving it.
 */

/** An SVG beam that gains detail layers as `level` (0–5) increases. */
function BeamStage({ level }: { level: number }) {
  return (
    <svg viewBox="0 0 320 120" width="100%" height="120" aria-hidden="true">
      {/* Bare shape — visible from level 0. */}
      <rect
        x="40"
        y="50"
        width="240"
        height="20"
        fill="none"
        stroke="rgb(var(--color-steel-mark))"
        strokeWidth={level >= 0 ? 2 : 0}
        className="transition-all duration-500 ease-out-expo"
      />

      {/* Modelled — flange lines. */}
      <line
        x1="40"
        y1="56"
        x2="280"
        y2="56"
        stroke="rgb(var(--color-steel-mark))"
        strokeWidth={1}
        opacity={level >= 1 ? 0.6 : 0}
        className="transition-opacity duration-500"
      />
      <line
        x1="40"
        y1="64"
        x2="280"
        y2="64"
        stroke="rgb(var(--color-steel-mark))"
        strokeWidth={1}
        opacity={level >= 1 ? 0.6 : 0}
        className="transition-opacity duration-500"
      />

      {/* Dimensioned — dimension line and label. */}
      <g
        opacity={level >= 2 ? 1 : 0}
        className="transition-opacity duration-500"
        style={{ stroke: "rgb(var(--color-blueprint-light))" }}
      >
        <line x1="40" y1="90" x2="280" y2="90" strokeWidth={1} />
        <line x1="40" y1="84" x2="40" y2="96" strokeWidth={1} />
        <line x1="280" y1="84" x2="280" y2="96" strokeWidth={1} />
        <text
          x="160"
          y="86"
          textAnchor="middle"
          fontSize="9"
          style={{ fill: "rgb(var(--color-paper-dim))", stroke: "none" }}
          fontFamily="var(--font-jetbrains-mono), monospace"
        >
          W12x26 — 20&apos;-0&quot;
        </text>
      </g>

      {/* Checked — checkmark badge. */}
      <g
        opacity={level >= 3 ? 1 : 0}
        transform="translate(295,40)"
        className="transition-opacity duration-500"
      >
        <circle r="10" fill="none" stroke="rgb(var(--color-mark-cool))" strokeWidth={1.5} />
        <path
          d="M-4 0 L-1 4 L5 -4"
          fill="none"
          stroke="rgb(var(--color-mark-cool))"
          strokeWidth={1.5}
        />
      </g>

      {/* Stamped — PE seal ring. */}
      <g
        opacity={level >= 4 ? 1 : 0}
        transform="translate(20,20)"
        className="transition-opacity duration-500"
        style={{ stroke: "rgb(var(--color-accent))" }}
      >
        <circle r="14" fill="none" strokeWidth={1.25} />
        <text
          textAnchor="middle"
          y="3"
          fontSize="7"
          style={{ fill: "rgb(var(--color-accent))", stroke: "none" }}
          fontFamily="var(--font-jetbrains-mono), monospace"
        >
          PE
        </text>
      </g>

      {/* Issued — title-block frame. */}
      <rect
        x="4"
        y="4"
        width="312"
        height="112"
        fill="none"
        style={{ stroke: "rgb(var(--color-accent))" }}
        strokeWidth={level >= 5 ? 1.5 : 0}
        className="transition-all duration-500"
      />
    </svg>
  );
}

function PhaseCard({
  phase,
  index,
  active,
  level,
}: {
  phase: (typeof processPhases)[number];
  index: number;
  active: boolean;
  level: number;
}) {
  return (
    <div
      className={`card-surface snap-item w-[84vw] shrink-0 rounded-2xl border p-6 sm:w-[420px] md:p-8 ${
        active
          ? "border-process-active bg-steel-900/70"
          : "border-blueprint bg-steel-900/25"
      }`}
      aria-current={active ? "step" : undefined}
    >
      <div className="mb-6 flex items-center justify-between">
        <span className="label-mono text-accent">{phase.step}</span>
        <span className="label-mono-sm text-paper-dim/80">{phase.phase}</span>
      </div>
      <BeamStage level={level} />
      <h3 className="mt-6 font-display text-lg font-semibold text-paper">{phase.label}</h3>
      <p className="mt-2 text-sm leading-relaxed text-paper-dim">{phase.description}</p>
      <span className="sr-only">Phase {index + 1} of {processPhases.length}</span>
    </div>
  );
}

export default function Process() {
  const trackRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wideEnough = window.matchMedia("(min-width: 1024px)").matches;

    if (reduced || !wideEnough || !trackRef.current || !wrapRef.current) return;

    gsap.registerPlugin(ScrollTrigger);
    setPinned(true);

    const track = trackRef.current;
    const totalScroll = Math.max(0, track.scrollWidth - window.innerWidth + 80);

    const trigger = ScrollTrigger.create({
      trigger: wrapRef.current,
      start: "top top",
      end: () => `+=${totalScroll}`,
      scrub: 0.6,
      pin: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        gsap.set(track, { x: -totalScroll * self.progress });
        setActive(
          Math.min(
            processPhases.length - 1,
            Math.floor(self.progress * processPhases.length)
          )
        );
      },
    });

    return () => {
      trigger.kill();
      setPinned(false);
    };
  }, []);

  return (
    <section id="process" className="relative bg-steel-950" aria-labelledby="process-heading">
      <div
        ref={wrapRef}
        className={`relative flex flex-col justify-center overflow-hidden ${
          pinned ? "h-screen" : "py-24 md:py-32"
        }`}
      >
        <div
          className={`z-10 px-6 md:px-10 ${
            pinned ? "absolute left-0 right-0 top-24" : "mx-auto w-full max-w-[1440px]"
          }`}
        >
          <Reveal className="max-w-2xl">
            <p className="label-mono mb-3 flex items-center gap-3 text-accent">
              <span className="h-px w-6 shrink-0 bg-accent/50" aria-hidden="true" />
              PROCESS
            </p>
            <h2
              id="process-heading"
              className="font-display text-[clamp(2rem,3vw+1rem,3.25rem)] font-semibold leading-[1.08] tracking-[-0.015em] text-paper"
            >
              RFQ to issued-for-fab, in six phases.
            </h2>
          </Reveal>
        </div>

        {/*
          One track, two behaviours. When pinned, GSAP translates it and the
          overflow stays hidden. Otherwise it is a native horizontal scroller
          with snap points — which is also what a keyboard and a screen reader
          get, since both can reach every card in the normal flow.
        */}
        <div
          ref={trackRef}
          className={`flex gap-5 px-6 md:px-10 ${
            pinned
              ? "mt-20 w-max"
              : "snap-track mx-auto mt-12 w-full max-w-[1440px] overflow-x-auto pb-4"
          }`}
          role={pinned ? undefined : "group"}
          aria-label={pinned ? undefined : "Process phases — scroll sideways"}
        >
          {processPhases.map((phase, index) => (
            <PhaseCard
              key={phase.step}
              phase={phase}
              index={index}
              active={pinned ? active === index : true}
              // Off the pinned timeline every card shows its finished state,
              // because there is no scrub position to derive a stage from.
              level={pinned ? (active === index ? index : index < active ? 5 : -1) : index}
            />
          ))}
        </div>

        <div
          className={`z-10 flex gap-2 px-6 md:px-10 ${
            pinned ? "absolute bottom-8 left-0 right-0" : "mx-auto mt-8 w-full max-w-[1440px]"
          }`}
          aria-hidden="true"
        >
          {processPhases.map((phase, index) => (
            <div
              key={phase.step}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                !pinned || index <= active ? "bg-accent" : "bg-blueprint"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
