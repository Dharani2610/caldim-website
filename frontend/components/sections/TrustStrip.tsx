"use client";

import Image from "next/image";
import Reveal from "@/frontend/components/ui/Reveal";
import { softwareLogos, trustStripCredentials } from "@/shared/data/softwareLogos";

export default function TrustStrip() {
  return (
    <section
      className="relative border-y border-blueprint bg-steel-900/60 py-6 md:py-7 overflow-hidden"
      aria-label="Technology & Engineering Credentials"
    >
      <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-6 md:flex-row md:items-center md:justify-between md:gap-8 md:px-10">
        {/* Technical Credibility Statement */}
        <Reveal delay={0.05} className="shrink-0">
          <p className="label-mono text-xs md:text-sm font-semibold tracking-wider text-paper-dim max-w-sm lg:max-w-md">
            {trustStripCredentials}
          </p>
        </Reveal>

        {/* Vertical Divider (Desktop/Tablet) */}
        <div
          className="hidden md:block h-8 w-px bg-blueprint/60 shrink-0"
          aria-hidden="true"
        />

        {/* Approved Software Tiles */}
        <div className="flex flex-1 items-center gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-1 pt-1 -mx-6 px-6 sm:mx-0 sm:px-0 sm:overflow-visible md:justify-end">
          {softwareLogos.map((logo, index) => (
            <Reveal key={logo.name} delay={0.1 + index * 0.08}>
              <div
                className="card-surface group flex h-12 md:h-14 items-center justify-center rounded-xl border border-blueprint bg-steel-950/60 px-4 md:px-5 py-2 transition-all duration-300 hover:-translate-y-0.5 hover:border-blueprint-light hover:bg-steel-900/80 shrink-0 min-w-[120px] md:min-w-[135px]"
              >
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={logo.w}
                  height={logo.h}
                  className="h-5 md:h-6 w-auto max-w-[105px] object-contain transition-transform duration-300 ease-out group-hover:scale-105"
                />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
