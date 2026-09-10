"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "@/frontend/hooks/useTheme";
import { useWebGL } from "@/frontend/components/three/useWebGL";
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
  const webgl = useWebGL();
  const [assembled, setAssembled] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const liveRef = useRef<HTMLParagraphElement>(null);

  const canRender = webgl === "ready";

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
      className="relative flex min-h-[100svh] w-full flex-col overflow-hidden bg-white"
      aria-labelledby="intro-heading"
    >
      {/* Background - pure unified white across the entire section */}
      <div className="pointer-events-none absolute inset-0 bg-white" aria-hidden="true">
        <div
          className="absolute right-[10%] top-1/2 h-[75%] w-[50%] -translate-y-1/2 rounded-full opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgb(252 124 20 / 0.08), rgb(252 124 20 / 0) 70%)",
          }}
        />
      </div>

      {/* The 3D sequence */}
      <div className="absolute inset-0" aria-hidden="true">
        {canRender ? (
          <SteelAssemblyScene
            dark={THEMES.dark}
            light={THEMES.light}
            splitEnabled={false}
            singlePalette="light"
            runKey={runKey}
            onComplete={handleComplete}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-end p-10 pr-16">
            <Image
              src={stillImage}
              alt="Fully assembled structural steel platform model with columns, bracing, ladder and stairs"
              width={1423}
              height={875}
              priority
              className="max-h-full w-auto max-w-[min(92%,1100px)] object-contain opacity-90"
            />
          </div>
        )}
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-6 pb-28 pt-32 md:px-10 md:pb-32 md:pt-36">
        <p className="label-mono flex items-center gap-3 text-accent font-semibold">
          <span className="h-px w-6 shrink-0 bg-accent/60" aria-hidden="true" />
          CALDIM ENGINEERING SERVICES · STRUCTURAL STEEL
        </p>

        <div className="flex flex-1 flex-col justify-center">
          <div
            className={`max-w-3xl transition-all duration-1000 ease-out-expo ${
              assembled ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            }`}
          >
            <h2
              id="intro-heading"
              className="font-display text-[clamp(2.25rem,4.4vw+1rem,4.75rem)] font-semibold leading-[1.04] tracking-[-0.025em] text-[#0F172A]"
            >
              Precision in Structural Steel Detailing
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#475569]">
              Every member modelled, every bolt checked, every drawing issued ready for the
              shop floor.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href="#contact"
                data-cursor-grow
                className="inline-flex items-center justify-center rounded-xl border border-btn-solid bg-accent px-7 py-3.5 text-sm font-semibold text-white transition-[background-color,box-shadow] duration-200 hover:bg-accent/90 hover:shadow-[0_10px_30px_-12px_rgb(var(--color-accent)/0.7)]"
              >
                Request a Quote
              </a>

              {canRender && (
                <button
                  type="button"
                  onClick={replay}
                  data-cursor-grow
                  className="label-mono-sm rounded-lg border border-transparent px-2 py-2.5 font-semibold text-[#64748B] underline-offset-4 transition-colors hover:text-accent hover:underline"
                >
                  REPLAY
                </button>
              )}
            </div>
          </div>
        </div>

        <p ref={liveRef} className="sr-only" role="status">
          {assembled ? "Steel platform assembly complete." : "Assembling steel platform."}
        </p>
      </div>
    </section>
  );
}
