"use client";

import Image from "next/image";
import TiltCard from "@/frontend/components/TiltCard";
import Reveal from "@/frontend/components/ui/Reveal";
import SectionHeading from "@/frontend/components/ui/SectionHeading";
import { useTheme } from "@/frontend/hooks/useTheme";
import type { GalleryItemView } from "@/shared/content/types";

/**
 * The artwork the site ships with, used until an editor uploads something.
 *
 * Keeping it means a fresh install and a database outage both look finished
 * rather than empty — the same fallback rule the leadership grid follows.
 */
const shipped = [
  {
    src: "/images/hero-glow-frame.png",
    srcLight: "/images/hero-glow-frame-light.png",
    alt: "Full building isometric steel model, glowing render",
    span: "md:col-span-2 md:row-span-2",
    sizes: "(min-width: 768px) 60vw, 100vw",
  },
  {
    src: "/images/vignette-structural-glow.png",
    srcLight: "/images/vignette-structural-glow-light.png",
    alt: "Structural beam shop-drawing detail, glowing render",
    span: "",
    sizes: "(min-width: 768px) 30vw, 100vw",
  },
  {
    src: "/images/vignette-misc-glow.png",
    srcLight: "/images/vignette-misc-glow-light.png",
    alt: "Multi-level stair and platform assembly, glowing render",
    span: "md:row-span-2",
    sizes: "(min-width: 768px) 30vw, 100vw",
  },
  {
    src: "/images/vignette-connections-glow.png",
    srcLight: "/images/vignette-connections-glow-light.png",
    alt: "Welded moment connection detail, glowing render",
    span: "",
    sizes: "(min-width: 768px) 30vw, 100vw",
  },
  {
    src: "/images/vignette-joistdeck-glow.png",
    srcLight: "/images/vignette-joistdeck-glow-light.png",
    alt: "Roof framing plan with joist and deck spans, glowing render",
    span: "md:col-span-2",
    sizes: "(min-width: 768px) 60vw, 100vw",
  },
];

export default function Gallery({ items = [] }: { items?: GalleryItemView[] }) {
  const theme = useTheme();
  const hasUploads = items.length > 0;

  // Uploaded media keeps the same mosaic rhythm as the shipped set: the first
  // tile is large, and the pattern repeats every five.
  const spans = ["md:col-span-2 md:row-span-2", "", "md:row-span-2", "", "md:col-span-2"];

  return (
    <section
      id="gallery"
      className="relative bg-steel-950 bp-grid bg-[length:64px_64px] py-24 md:py-32"
      aria-labelledby="gallery-heading"
    >
      <div className="mx-auto max-w-[1440px] px-6 md:px-10">
        <SectionHeading
          eyebrow="GALLERY"
          title={<span id="gallery-heading">A closer look at the models and drawings.</span>}
        />

        <div className="grid grid-cols-1 gap-4 md:auto-rows-[180px] md:grid-cols-3 md:gap-5">
          {hasUploads
            ? items.map((item, index) => (
                <Reveal
                  key={item.id}
                  delay={index * 0.05}
                  className={`h-full ${spans[index % spans.length]}`}
                >
                  <TiltCard
                    intensity={4}
                    className="group relative overflow-hidden rounded-2xl border border-blueprint bg-steel-900/40"
                  >
                    <div className="relative h-56 w-full md:h-full">
                      {item.kind === "video" ? (
                        <video
                          src={item.url}
                          poster={item.posterUrl ?? undefined}
                          muted
                          loop
                          playsInline
                          // Autoplay only where motion is welcome; a looping
                          // clip is decoration, and `prefers-reduced-motion`
                          // users get the poster frame and a control instead.
                          autoPlay
                          controls={false}
                          aria-label={item.alt}
                          className="h-full w-full object-cover motion-reduce:hidden"
                        />
                      ) : (
                        <Image
                          src={item.url}
                          alt={item.alt}
                          fill
                          sizes="(min-width: 768px) 60vw, 100vw"
                          className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.05]"
                        />
                      )}

                      {(item.caption || item.meta) && (
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-steel-950 via-steel-950/60 to-transparent p-4">
                          {item.caption && (
                            <p className="text-sm font-medium text-paper">{item.caption}</p>
                          )}
                          {item.meta && (
                            <p className="label-mono-sm mt-0.5 text-paper-dim">{item.meta}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </TiltCard>
                </Reveal>
              ))
            : shipped.map((item, index) => {
                const activeSrc = theme === "light" ? item.srcLight : item.src;
                return (
                  <Reveal key={item.alt} delay={index * 0.05} className={`h-full ${item.span}`}>
                    <TiltCard
                      intensity={4}
                      float
                      floatDelay={index * 0.6}
                      className="group relative overflow-hidden rounded-2xl border border-blueprint bg-steel-900/40"
                    >
                      <div className="relative h-56 w-full md:h-full">
                        <Image
                          key={activeSrc}
                          src={activeSrc}
                          alt={item.alt}
                          fill
                          sizes={item.sizes}
                          className="object-contain p-6 transition-transform duration-700 ease-out-expo group-hover:scale-[1.05]"
                        />
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
