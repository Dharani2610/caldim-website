import MagneticButton from "@/frontend/components/MagneticButton";
import Reveal from "@/frontend/components/ui/Reveal";
import type { CareersContent } from "@/shared/content/types";

export default function Careers({ careers }: { careers: CareersContent }) {
  return (
    <section
      id="careers"
      className="relative border-y border-blueprint bg-steel-900/40 py-24 md:py-32"
      aria-labelledby="careers-heading"
    >
      <div className="mx-auto max-w-[1440px] px-6 md:px-10">
        <Reveal>
          <p className="label-mono mb-10 flex items-center gap-3 text-accent">
            <span className="h-px w-6 shrink-0 bg-accent/50" aria-hidden="true" />
            CAREERS
          </p>
        </Reveal>

        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-3">
          <Reveal className="lg:col-span-2">
            <h2
              id="careers-heading"
              className="mb-6 font-display text-[clamp(2rem,3vw+1rem,3.25rem)] font-semibold leading-[1.08] tracking-[-0.015em] text-paper"
            >
              Build the team that builds the drawings.
            </h2>
            <p className="mb-8 max-w-2xl leading-relaxed text-paper-dim">{careers.blurb}</p>
            <MagneticButton href="mailto:careers@caldimengg.com" variant="solid">
              Send Your Resume
            </MagneticButton>
          </Reveal>

          <Reveal delay={0.1} className="border-t border-blueprint pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
            <p className="label-mono-sm mb-4 text-paper-dim/80">CURRENT FOCUS AREAS</p>
            <ul className="space-y-3">
              {careers.roles.map((role) => (
                <li key={role} className="flex gap-2 text-sm text-paper">
                  <span className="text-accent" aria-hidden="true">—</span>
                  <span>{role}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
