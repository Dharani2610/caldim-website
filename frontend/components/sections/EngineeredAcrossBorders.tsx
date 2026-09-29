import React from "react";

export default function EngineeredAcrossBorders() {
  return (
    <section
      id="engineered-across-borders"
      aria-label="Engineered Across Borders"
      className="relative border-t border-blueprint bg-steel-950 py-12 md:py-16"
    >
      <div className="mx-auto max-w-[1440px] px-6 md:px-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="label-mono-sm font-bold uppercase tracking-widest text-accent mb-1.5">
              ENGINEERING HERITAGE · SOFTWARE INNOVATION
            </p>
            <h2 className="font-display text-2xl font-bold tracking-tight text-paper sm:text-3xl md:text-4xl">
              ENGINEERED ACROSS BORDERS.<br className="hidden sm:inline" /> BUILT FOR THE FIELD.
            </h2>
          </div>
          <div className="flex flex-col items-start md:items-end">
            <span className="font-display text-xl font-bold text-paper">CALDIM-DAS</span>
            <span className="label-mono-sm text-paper-dim mt-0.5">Global Detailing &amp; Structural Engineering</span>
          </div>
        </div>
      </div>
    </section>
  );
}
