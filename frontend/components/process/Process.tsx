"use client";

import { processPhases } from "@/shared/data/content";
import SectionHeading from "@/frontend/components/ui/SectionHeading";
import Reveal from "@/frontend/components/ui/Reveal";

function BeamStage({ level }: { level: number }) {
  return (
    <svg viewBox="0 0 320 120" width="100%" height="120" aria-hidden="true" className="max-w-[280px] sm:max-w-[320px]">
      {/* Bare shape - visible from level 0. */}
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

      {/* Modelled - flange lines. */}
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

      {/* Dimensioned - dimension line and label. */}
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
          W12x26 - 20&apos;-0&quot;
        </text>
      </g>

      {/* Checked - checkmark badge. */}
      <g
        opacity={level >= 3 ? 1 : 0}
        transform="translate(295,40)"
        className="transition-opacity duration-500"
      >
        <circle r="10" fill="none" stroke="rgb(var(--color-mark-cool))" strokeWidth={1.5} />
        <path
          d="M-4 0 L-1 4 5 -4"
          fill="none"
          stroke="rgb(var(--color-mark-cool))"
          strokeWidth={1.5}
        />
      </g>

      {/* Stamped - PE seal ring. */}
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

      {/* Issued - title-block frame. */}
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
}: {
  phase: (typeof processPhases)[number];
  index: number;
}) {
  return (
    <div
      className="card-surface flex h-full flex-col justify-between rounded-2xl border border-blueprint bg-steel-900/25 p-6 md:p-8 transition-all duration-300 hover:border-accent/40 hover:bg-steel-900/40"
    >
      <div>
        <div className="mb-6 flex items-center justify-end">
          <span className="label-mono-sm text-paper-dim/80">{phase.phase}</span>
        </div>
        <div className="my-4 flex items-center justify-center">
          <BeamStage level={index} />
        </div>
        <h3 className="mt-6 font-display text-xl font-semibold text-paper">{phase.label}</h3>
        <p className="mt-2 text-sm leading-relaxed text-paper-dim">{phase.description}</p>
      </div>
      <span className="sr-only">Phase {index + 1} of {processPhases.length}</span>
    </div>
  );
}

export default function Process() {
  return (
    <section id="process" className="relative border-y border-blueprint bg-steel-950 py-24 md:py-32" aria-labelledby="process-heading">
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
        <SectionHeading
          eyebrow="PROCESS"
          title={<span id="process-heading">RFQ to issued-for-fab, in six phases.</span>}
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 md:gap-8">
          {processPhases.map((phase, index) => (
            <Reveal key={phase.step} delay={index * 0.06} className="h-full">
              <PhaseCard phase={phase} index={index} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
