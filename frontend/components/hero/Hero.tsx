import Image from "next/image";
import MagneticButton from "@/frontend/components/MagneticButton";
import type { HeroContent } from "@/shared/content/types";

export default function Hero({ hero }: { hero: HeroContent }) {
  return (
    <section
      id="top"
      className="relative flex min-h-screen w-full flex-col overflow-hidden bg-steel-950"
      aria-label="Caldim Engineering — structural steel detailing"
    >
      {/* Blueprint grid texture. */}
      <div className="pointer-events-none absolute inset-0 bp-grid opacity-[0.15]" aria-hidden="true" />

      {/* Ambient glow behind the assembled building. */}
      <div
        className="pointer-events-none absolute right-[-4%] top-1/2 hidden aspect-[1423/875] w-[62%] max-w-[950px] -translate-y-1/2 rounded-[999px] opacity-70 blur-3xl lg:block"
        style={{
          background:
            "radial-gradient(closest-side, rgb(var(--color-glow) / 0.35), rgb(var(--color-glow) / 0) 70%)",
        }}
        aria-hidden="true"
      />

      {/* Gradient scrim for legibility behind the left-side copy. */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-steel-950 via-steel-950/40 to-transparent lg:via-steel-950/20"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-center px-6 py-28 md:px-10 lg:py-0">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-6">
          <div>
            <p className="label-mono mb-4 flex items-center gap-3 text-accent">
              <span className="h-px w-6 shrink-0 bg-accent/60" aria-hidden="true" />
              {hero.eyebrow}
            </p>
            <h1 className="max-w-2xl font-display text-[clamp(2.75rem,5vw+1rem,5.5rem)] font-semibold leading-[1.02] tracking-[-0.025em] text-paper">
              {hero.headingLine1}
              {hero.headingLine2 && (
                <>
                  <br />
                  {hero.headingLine2}
                </>
              )}
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-paper-dim">{hero.subheading}</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <MagneticButton href="#contact" variant="solid">
                {hero.primaryCta}
              </MagneticButton>
              <MagneticButton href="#services" variant="outline">
                {hero.secondaryCta}
              </MagneticButton>
            </div>
          </div>

          {/* Right-side visual panel: Complete isometric structural steel building frame model */}
          <div className="relative z-[3] mx-auto w-full max-w-md lg:absolute lg:right-[-3%] lg:top-1/2 lg:mx-0 lg:w-[58%] lg:max-w-[900px] lg:-translate-y-[46%] xl:w-[54%]">
            <div className="relative w-full aspect-[1418/840] overflow-hidden motion-safe:animate-floaty">
              <Image
                src="/images/iso-full-model.png"
                alt="Detailed isometric wireframe view of a complete multi-story industrial structural steel building frame with columns, girders, bracing, purlins, and access stair towers"
                width={1418}
                height={840}
                priority
                sizes="(min-width: 1280px) 780px, (min-width: 1024px) 58vw, (min-width: 640px) 448px, 92vw"
                className="h-full w-full object-contain [html.light_&]:mix-blend-multiply [html:not(.light)_&]:invert [html:not(.light)_&]:mix-blend-screen transition-transform duration-700 ease-out-expo hover:scale-[1.02]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Scroll cue — a small, quiet affordance on a full-bleed first screen. */}
      <div
        className="pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 lg:flex"
        aria-hidden="true"
      >
        <span className="label-mono-sm text-paper-dim/70">SCROLL</span>
        <span className="relative block h-10 w-px overflow-hidden bg-blueprint-light">
          <span className="absolute inset-x-0 top-0 h-4 bg-accent motion-safe:animate-[sheen_2.4s_ease-in-out_infinite] motion-safe:[animation-name:none]" />
        </span>
      </div>
    </section>
  );
}
