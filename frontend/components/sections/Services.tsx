"use client";

import { useState } from "react";
import ServiceVignette, { type Kind } from "@/frontend/components/three/ServiceVignette";
import GlowVignette from "@/frontend/components/GlowVignette";
import TiltCard from "@/frontend/components/TiltCard";
import Reveal from "@/frontend/components/ui/Reveal";
import SectionHeading from "@/frontend/components/ui/SectionHeading";
import { PartMarkBubble } from "@/frontend/components/DrawingMarks";
import type { ServiceContent } from "@/shared/content/types";

/**
 * Real, glowing shop-drawing imagery for every discipline card. ServiceVignette
 * (a 3D canvas) remains the fallback for any discipline added later without
 * its own artwork.
 */
const glowVignette: Record<string, { src: string; srcLight: string; alt: string }> = {
  estimation: {
    src: "/images/vignette-estimation-glow.png",
    srcLight: "/images/vignette-estimation-glow-light.png",
    alt: "Glowing icon graphic representing cost estimation — takeoff, calculator, magnifying glass, and percentage breakdown",
  },
  structural: {
    src: "/images/vignette-structural-glow.png",
    srcLight: "/images/vignette-structural-glow-light.png",
    alt: "Glowing shop-drawing beam detail with dimensions and bolt callouts, W16x26 beam",
  },
  misc: {
    src: "/images/vignette-misc-glow.png",
    srcLight: "/images/vignette-misc-glow-light.png",
    alt: "Glowing isometric detail of a multi-level steel stair and platform assembly with guardrails",
  },
  connections: {
    src: "/images/vignette-connections-glow.png",
    srcLight: "/images/vignette-connections-glow-light.png",
    alt: "Glowing welded moment connection detail with bolt pattern and weld callouts",
  },
  "joist-deck": {
    src: "/images/vignette-joistdeck-glow.png",
    srcLight: "/images/vignette-joistdeck-glow-light.png",
    alt: "Glowing roof framing plan showing joist layout and metal deck span directions",
  },
  "digital-automation": {
    src: "/images/vignette-automation-glow.png",
    srcLight: "/images/vignette-automation-glow-light.png",
    alt: "Glowing icon graphic representing detailing automation — gear, robotic arm, model data exchange, script brackets, batch pipeline, and checked output",
  },
};

export default function Services({ services }: { services: ServiceContent[] }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section
      id="services"
      className="relative bg-steel-950 py-24 md:py-32"
      aria-labelledby="services-heading"
    >
      <div className="mx-auto max-w-[1440px] px-6 md:px-10">
        <SectionHeading
          eyebrow="CAPABILITIES"
          title={<span id="services-heading">Six disciplines. One steel package.</span>}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
          {services.map((service, index) => {
            const isOpen = open === service.id;
            const glow = glowVignette[service.id];
            const panelId = `service-panel-${service.id}`;

            return (
              <Reveal key={service.id} delay={index * 0.06} className="h-full">
                <TiltCard
                  className="group relative flex flex-col rounded-2xl border border-blueprint bg-steel-950 p-6 transition-colors hover:border-blueprint-light hover:bg-steel-900/70 md:p-8"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <PartMarkBubble mark={service.mark} />
                    <span className="label-mono-sm text-paper-dim/80">{service.standard}</span>
                  </div>

                  {glow ? (
                    <GlowVignette src={glow.src} srcLight={glow.srcLight} alt={glow.alt} />
                  ) : (
                    <ServiceVignette kind={service.id as Kind} />
                  )}

                  <h3 className="relative mt-4 inline-block w-fit font-display text-xl font-semibold text-paper">
                    {service.title}
                    <span
                      className="absolute -bottom-1 left-0 h-px w-0 bg-accent transition-all duration-300 ease-out-expo group-hover:w-full"
                      aria-hidden="true"
                    />
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-paper-dim">{service.summary}</p>

                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : service.id)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="label-mono mt-5 w-fit text-left text-accent underline-offset-4 hover:underline"
                  >
                    {isOpen ? "Close −" : "Learn more +"}
                  </button>

                  <div
                    id={panelId}
                    className={`grid transition-all duration-300 ease-out-expo ${
                      isOpen ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <ul className="space-y-2 border-t border-blueprint pt-4">
                        {service.deliverables.map((deliverable) => (
                          <li key={deliverable} className="flex gap-2 text-sm text-paper-dim">
                            <span className="text-accent" aria-hidden="true">—</span>
                            <span>{deliverable}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </TiltCard>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
