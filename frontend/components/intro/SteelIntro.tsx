"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { useTheme } from "@/frontend/hooks/useTheme";
import { useWebGLCapability } from "@/frontend/components/three/useWebGL";
import type { SceneTheme } from "@/frontend/components/three/SteelAssemblyScene";

const SteelAssemblyScene = dynamic(() => import("@/frontend/components/three/SteelAssemblyScene"), {
  ssr: false,
});

const THEMES: Record<"dark" | "light", SceneTheme> = {
  dark: {
    steel: "#94A1B0",
    secondary: "#626F7D",
    steelDark: "#48535E",
    accent: "#3FA9E8",
    bolt: "#E2EDF8",
    ambient: 0.6,
    key: 2.8,
  },
  light: {
    steel: "#BDC5CD",
    secondary: "#949EA8",
    steelDark: "#7E8892",
    accent: "#F97316",
    bolt: "#E2E8F0",
    ambient: 1.1,
    key: 3.2,
  },
};

export default function SteelIntro() {
  const theme = useTheme();
  const webgl = useWebGLCapability();
  const [assembled, setAssembled] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const liveRef = useRef<HTMLParagraphElement>(null);

  const canRender = webgl.state === "ready";

  useEffect(() => {
    if (!canRender) setAssembled(true);
  }, [canRender]);

  const handleComplete = useCallback(() => setAssembled(true), []);

  const replay = () => {
    setAssembled(false);
    setRunKey((value) => value + 1);
  };

  const stillImage =
    theme === "light" ? "/images/hero-glow-frame-light.png" : "/images/hero-glow-frame.png";

  return (
    <section
      id="intro"
      className="relative flex min-h-[100svh] w-full flex-col overflow-hidden bg-gradient-to-br from-[#E2EFFC] via-[#D2E6FA] to-[#BFE0F8] [html:not(.light)_&]:from-steel-950 [html:not(.light)_&]:via-[#0C1929] [html:not(.light)_&]:to-steel-950"
      aria-labelledby="intro-heading"
    >
      {/* Background - Blue engineering ambient gradient meshes & blueprint grid */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {/* Engineering blueprint texture */}
        <div className="absolute inset-0 bp-grid opacity-[0.07] [html:not(.light)_&]:opacity-[0.15]" />

        {/* Ambient radial blue glow behind structural assembly */}
        <div
          className="absolute right-[5%] top-1/2 h-[80%] w-[60%] -translate-y-1/2 rounded-full opacity-70 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(42, 107, 204, 0.2), rgba(63, 169, 232, 0.1), transparent 75%)",
          }}
        />

        {/* Top-left subtle cool blue spotlight */}
        <div
          className="absolute -left-[10%] -top-[10%] h-[60%] w-[50%] rounded-full opacity-50 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(63, 169, 232, 0.16), transparent 70%)",
          }}
        />
      </div>

      {/* The 3D sequence */}
      {/* The 3D sequence */}
      {/* The 3D sequence */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-full md:w-[80%] lg:w-[74%] xl:w-[72%] flex items-center justify-end" aria-hidden="true">  {canRender ? (
        <SteelAssemblyScene
          dark={THEMES.dark}
          light={THEMES.light}
          splitEnabled={false}
          singlePalette="light"
          tier={webgl.tier}
          runKey={runKey}
          onComplete={handleComplete}
        />
      ) : webgl.state === "unavailable" ? (
        <div className="flex h-full w-full items-center justify-end p-8 pr-12 lg:pr-16">
          <Image
            src={stillImage}
            alt="Fully assembled 4-5 story structural steel building with multi-tier staircase system, columns, framing and bracing"
            width={1423}
            height={775}
            priority
            className="max-h-[82%] w-auto max-w-[min(92%,1000px)] object-contain opacity-90"
          />
        </div>
      ) : null}
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-6 pb-28 pt-32 md:px-10 md:pb-32 md:pt-36">
        <p className="label-mono mb-3 flex items-center gap-3 text-accent font-semibold">
          <span className="h-px w-6 shrink-0 bg-accent/60" aria-hidden="true" />
          CALDIM ENGINEERING SERVICES · STRUCTURAL STEEL
        </p>

        <div className="flex flex-1 flex-col justify-center">
          <div className="max-w-3xl">
            <h2
              id="intro-heading"
              className="font-display text-[clamp(2.25rem,4.4vw+1rem,4.75rem)] font-semibold leading-[1.04] tracking-[-0.025em] max-w-xl bg-gradient-to-r from-[#17479F] via-[#2A6BCC] to-[#1E5DBF] [html:not(.light)_&]:from-[#5E97F3] [html:not(.light)_&]:via-[#2A6BCC] [html:not(.light)_&]:to-[#91BDFF] bg-clip-text text-transparent"
            >
              Precision in Structural Steel Detailing
            </h2>
            <p className="mt-5 max-w-xl text-base md:text-lg leading-relaxed text-paper-dim">
              Every member modelled, every bolt checked, every drawing issued ready for the
              shop floor.
            </p>

            {canRender && (
              <div className="mt-8 flex items-center">
                <button
                  type="button"
                  onClick={replay}
                  data-cursor-grow
                  className="group inline-flex items-center gap-2.5 rounded-xl border border-blueprint bg-steel-900/50 px-4 py-2.5 text-xs font-semibold tracking-wider text-paper-dim transition-all duration-200 hover:border-accent/50 hover:bg-steel-900/80 hover:text-accent hover:shadow-sm"
                  aria-label="Replay 3D steel assembly animation"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-accent transition-transform duration-500 ease-out group-hover:-rotate-180" />
                  <span className="label-mono-sm font-semibold">REPLAY</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <p ref={liveRef} className="sr-only" role="status">
          {assembled ? "Steel platform assembly complete." : "Assembling steel platform."}
        </p>
      </div>
    </section>
  );
}