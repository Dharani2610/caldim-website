import TiltCard from "@/frontend/components/TiltCard";
import Reveal from "@/frontend/components/ui/Reveal";
import SectionHeading from "@/frontend/components/ui/SectionHeading";
import type { PillarContent } from "@/shared/content/types";

export default function WhyUs({ pillars }: { pillars: PillarContent[] }) {
  return (
    <section className="relative bg-steel-950 py-24 md:py-32" aria-labelledby="why-heading">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10">
        <SectionHeading
          eyebrow="WHY CALDIM"
          title={<span id="why-heading">What your fabricator actually needs from a detailer.</span>}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-4">
          {pillars.map((pillar, index) => (
            <Reveal key={pillar.title} delay={index * 0.06} className="h-full">
              <TiltCard className="rounded-2xl border border-blueprint bg-steel-950 p-6 md:p-8">
                <span className="label-mono-sm text-paper-dim/80">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold text-paper">{pillar.title}</h3>
                <p className="label-mono mt-2 text-accent">{pillar.stat}</p>
                <p className="mt-4 text-sm leading-relaxed text-paper-dim">{pillar.description}</p>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
