"use client";

import Image from "next/image";
import Reveal from "@/frontend/components/ui/Reveal";
import { softwareLogos, trustStripCredentials } from "@/shared/data/softwareLogos";

export default function TrustStrip() {
  // We duplicate the logo set per half to ensure enough width for seamless gapless looping on all screens.
  const tickerLogos = [...softwareLogos, ...softwareLogos];

  return (
    <section
      className="relative w-full border-y border-blueprint bg-steel-900/60 py-6 md:py-7 overflow-hidden select-none"
      aria-label="Technology & Engineering Credentials"
    >
      <div className="mx-auto flex max-w-[1440px] items-center gap-3 sm:gap-5 md:gap-8 px-3 sm:px-6 md:px-10">
        {/* Left: Static Technical Credibility Statement */}
        <Reveal delay={0.05} className="shrink-0">
          <div className="shrink-0">
            <p className="label-mono text-[10px] sm:text-xs md:text-sm font-semibold tracking-wider text-paper-dim leading-snug">
              <span className="md:hidden">
                <span className="block whitespace-nowrap">PE-STAMPED IN ALL 50 STATES</span>
                <span className="block whitespace-nowrap">AISC MEMBER · 150+ EMPLOYEES</span>
                <span className="block whitespace-nowrap">48,000+ TONS DETAILED</span>
              </span>
              <span className="hidden md:inline">
                <span className="block whitespace-nowrap">PE-STAMPED IN ALL 50 STATES · AISC MEMBER · </span>
                <span className="block whitespace-nowrap">150+ EMPLOYEES · 48,000+ TONS DETAILED</span>
              </span>
            </p>
          </div>
        </Reveal>

        {/* Vertical Divider */}
        <div
          className="h-8 w-px bg-blueprint/60 shrink-0"
          aria-hidden="true"
        />

        {/* Right: Continuous Horizontal Scrolling Ticker */}
        <div className="group/ticker relative flex-1 min-w-0 overflow-hidden">
          {/* Feathered edge gradient masks for smooth entry and exit */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 sm:w-10 md:w-16 bg-gradient-to-r from-steel-900 via-steel-900/80 to-transparent"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 sm:w-10 md:w-16 bg-gradient-to-l from-steel-900 via-steel-900/80 to-transparent"
            aria-hidden="true"
          />

          {/* Looping Marquee Track - pauses on hover and respects prefers-reduced-motion */}
          <div
            className="flex w-max items-center animate-marquee hover:[animation-play-state:paused] motion-reduce:animate-none py-1"
            aria-hidden="true"
            style={{ animationDuration: "28s" }}
          >
            {[0, 1].map((copyIndex) => (
              <div
                key={copyIndex}
                className="flex items-center gap-3 md:gap-4 shrink-0 pr-3 md:pr-4"
              >
                {tickerLogos.map((logo, index) => (
                  <div
                    key={`${copyIndex}-${logo.name}-${index}`}
                    className="card-surface group flex h-12 md:h-14 items-center justify-center rounded-xl border border-blueprint bg-steel-950/60 px-4 md:px-5 py-2 transition-all duration-300 hover:-translate-y-0.5 hover:border-blueprint-light hover:bg-steel-900/80 shrink-0 min-w-[120px] md:min-w-[135px]"
                  >
                    <Image
                      src={logo.src}
                      alt={logo.alt}
                      width={logo.w}
                      height={logo.h}
                      loading="eager"
                      className="h-5 md:h-6 w-auto max-w-[105px] object-contain transition-transform duration-300 ease-out group-hover:scale-105 pointer-events-none select-none"
                      draggable={false}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Accessible screen reader announcement */}
          <div className="sr-only">
            {trustStripCredentials}. Approved tools: Bluebeam, Tekla Structures, SDS2 by ALLPLAN, AutoCAD.
          </div>
        </div>
      </div>
    </section>
  );
}
