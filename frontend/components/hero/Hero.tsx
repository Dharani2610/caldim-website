import Image from "next/image";
import type { HeroContent } from "@/shared/content/types";

export default function Hero({ hero }: { hero: HeroContent }) {
  return (
    <section
      id="top"
      className="relative flex min-h-screen w-full flex-col overflow-hidden bg-gradient-to-br from-[#E2EFFC] via-[#D2E6FA] to-[#BFE0F8] [html:not(.light)_&]:from-steel-950 [html:not(.light)_&]:via-[#0C1929] [html:not(.light)_&]:to-steel-950"
      aria-label="Caldim Engineering — structural steel detailing"
    >
      {/* Blueprint grid texture. */}
      <div className="pointer-events-none absolute inset-0 bp-grid opacity-[0.15]" aria-hidden="true" />

      {/* Ambient gradient meshes */}
      <div
        className="pointer-events-none absolute -left-24 top-1/4 h-[550px] w-[550px] rounded-full bg-gradient-to-tr from-accent/20 to-transparent blur-[140px] mix-blend-screen [html.light_&]:from-accent/10 [html.light_&]:mix-blend-multiply"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-[-5%] top-1/2 aspect-[1423/875] w-[65%] max-w-[1000px] -translate-y-1/2 rounded-[999px] bg-gradient-to-br from-accent/25 via-accent-vivid/15 to-transparent blur-[110px] opacity-75 [html.light_&]:opacity-35"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-steel-950 via-steel-950/40 to-transparent [html.light_&]:opacity-0"
        aria-hidden="true"
      />

      {/* Gradient scrim for legibility behind the left-side copy. */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-steel-950 via-steel-950/50 to-transparent lg:via-steel-950/25 [html.light_&]:opacity-0"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-center px-6 py-28 md:px-10 lg:py-0">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-6">
          <div>
            <p className="label-mono mb-4 flex items-center gap-3 font-semibold text-accent">
              <span className="h-px w-6 shrink-0 bg-accent/60" aria-hidden="true" />
              {hero.eyebrow}
            </p>
            <h1 className="max-w-2xl font-display text-[clamp(2.5rem,4.5vw+1rem,5rem)] font-semibold leading-[1.05] tracking-[-0.025em]">
              <span className="bg-gradient-to-r from-paper via-paper to-paper/90 bg-clip-text text-transparent">
                {hero.headingLine1}
              </span>
              {hero.headingLine2 && (
                <>
                  <br />
                  <span className="bg-gradient-to-r from-accent via-accent-vivid to-paper bg-clip-text text-transparent">
                    {hero.headingLine2}
                  </span>
                </>
              )}
            </h1>
            <p className="mt-6 max-w-lg text-base md:text-lg leading-relaxed text-paper-dim">{hero.subheading}</p>
          </div>

          {/* Right-side visual panel: Complete isometric structural steel building frame model */}
          <div className="relative z-[3] mx-auto w-full max-w-md lg:mx-0 lg:w-full lg:max-w-none">
            <div className="relative w-full aspect-[1418/840] overflow-hidden motion-safe:animate-floaty">
              <Image
                src="/images/iso-full-model.png"
                alt="Detailed isometric wireframe view of a complete multi-story industrial structural steel building frame with columns, girders, bracing, purlins, and access stair towers"
                width={1418}
                height={840}
                priority
                sizes="(min-width: 1280px) 780px, (min-width: 1024px) 58vw, (min-width: 640px) 448px, 92vw"
                className="h-full w-full object-contain [html:not(.light)_&]:invert [html:not(.light)_&]:opacity-90 [html.light_&]:opacity-85 transition-transform duration-700 ease-out-expo hover:scale-[1.02]"
              />
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
