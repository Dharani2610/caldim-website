"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "@/frontend/hooks/useTheme";
import { useWebGL } from "@/frontend/components/three/useWebGL";
import type { SceneTheme } from "@/frontend/components/three/SteelAssemblyScene";

/**
 * The title sequence that opens the site.
 *
 * It sits ahead of the existing hero on the same page rather than on a route
 * of its own: the homepage keeps its URL, its metadata and its indexed copy,
 * and "Explore" is a scroll rather than a navigation — so nobody waits on a
 * second document just to reach the content they came for.
 *
 * The canvas is loaded on demand and only where it can actually run. A
 * visitor who has asked for reduced motion, or whose browser or device can't
 * give us WebGL, gets the finished still instead of a blank rectangle.
 */
const SteelAssemblyScene = dynamic(() => import("@/frontend/components/three/SteelAssemblyScene"), {
  ssr: false,
});

/**
 * The two palettes rendered side by side. `ambient` and `key` differ as much
 * as the colours do: the dark half is a lit shop floor, the light half a
 * bright studio, and matching only the hues would leave both halves looking
 * like the same room with a filter over it.
 */
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

/** Shown on the light half once the structure is standing. */
const FIGURES = [
  { value: "150+", label: "EMPLOYEES" },
  { value: "48,000+", label: "TONS DETAILED" },
  { value: "50", label: "STATES PE-STAMPED" },
  { value: "100%", label: "CHECKED BEFORE ISSUE" },
];

const STORAGE_KEY = "caldim-theme";

export default function SteelIntro() {
  const theme = useTheme();
  const webgl = useWebGL();
  const [assembled, setAssembled] = useState(false);
  const [runKey, setRunKey] = useState(0);
  /**
   * A split needs width to read. Below the md breakpoint there isn't room for
   * two halves of a structure plus legible copy, so the phone gets a single
   * palette following the site theme — the same scene, not a cut-down one.
   */
  const [wide, setWide] = useState(true);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const sync = () => setWide(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  const liveRef = useRef<HTMLParagraphElement>(null);

  const canRender = webgl === "ready";

  // With no canvas there is no sequence to wait for, so the copy is shown at
  // once instead of never.
  useEffect(() => {
    if (!canRender) setAssembled(true);
  }, [canRender]);

  const handleComplete = useCallback(() => setAssembled(true), []);

  const replay = () => {
    setAssembled(false);
    setRunKey((value) => value + 1);
  };

  /** Frame 6 — the same switch the header toggle drives, surfaced here as a
   *  beat of the sequence rather than a setting buried in the nav. */
  const flipTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.classList.toggle("light", next === "light");
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private browsing — the theme simply won't persist between visits.
    }
  };

  /**
   * Mirrors the wipe the renderer performs internally. Both are driven from
   * the same idea — dark until the steel is standing, then the light half
   * sweeps in — but the DOM side is keyed off `assembled` rather than the
   * render clock, which keeps the two in step without a shared ticker.
   */
  const seamPercent = !canRender || !wide ? (theme === "light" ? 0 : 100) : assembled ? 50 : 100;

  const stillImage =
    theme === "light" ? "/images/hero-glow-frame-light.png" : "/images/hero-glow-frame.png";

  return (
    <section
      id="intro"
      className="relative flex min-h-[100svh] w-full flex-col overflow-hidden bg-steel-950"
      aria-labelledby="intro-heading"
    >
      {/*
        The split background. The canvas is transparent, so these panels are
        what the two halves of the scene sit against — and because they are
        DOM, the seam stays a crisp single pixel at any device ratio rather
        than something the renderer has to resolve.
      */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute inset-y-0 left-0 bg-steel-950 transition-[width] duration-700 ease-out-expo"
          style={{ width: `${seamPercent}%` }}
        >
          <div
            className="absolute left-1/2 top-1/2 h-[80%] w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, rgb(63 169 232 / 0.22), rgb(63 169 232 / 0) 70%)",
            }}
          />
        </div>
        <div
          className="absolute inset-y-0 right-0 bg-[#EEF1F4] transition-[width] duration-700 ease-out-expo"
          style={{ width: `${100 - seamPercent}%` }}
        >
          <div
            className="absolute left-1/2 top-1/2 h-[80%] w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, rgb(252 124 20 / 0.16), rgb(252 124 20 / 0) 70%)",
            }}
          />
        </div>
        {/* The seam itself — a lit edge where the two worlds meet. */}
        <div
          className="absolute inset-y-0 w-px bg-gradient-to-b from-transparent via-accent to-transparent transition-[left] duration-700 ease-out-expo"
          style={{ left: `${seamPercent}%`, boxShadow: "0 0 24px 3px rgb(63 169 232 / 0.55)" }}
        />
      </div>

      {/* The sequence itself. */}
      <div className="absolute inset-0" aria-hidden="true">
        {canRender ? (
          <SteelAssemblyScene
            dark={THEMES.dark}
            light={THEMES.light}
            splitEnabled={wide}
            singlePalette={theme}
            runKey={runKey}
            onComplete={handleComplete}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-10">
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

      {/* Scrim over the dark half only — the light half needs no help, and a
          full-width gradient would grey it out. */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 bg-gradient-to-t from-steel-950 via-steel-950/20 to-steel-950/65 transition-[width] duration-700 ease-out-expo"
        style={{ width: `${seamPercent}%` }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-6 pb-28 pt-32 md:px-10 md:pb-32 md:pt-36">
        <p className="label-mono flex items-center gap-3 text-accent">
          <span className="h-px w-6 shrink-0 bg-accent/60" aria-hidden="true" />
          CALDIM ENGINEERING SERVICES · STRUCTURAL STEEL
        </p>

        <div className="flex flex-1 flex-col justify-center">
          <div
            className={`max-w-3xl transition-all duration-1000 ease-out-expo ${assembled ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
              }`}
          >
            <h2
              id="intro-heading"
              className="font-display text-[clamp(2.25rem,4.4vw+1rem,4.75rem)] font-semibold leading-[1.04] tracking-[-0.025em] text-paper"
            >
              Precision in Structural Steel Detailing
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-paper-dim">
              Every member modelled, every bolt checked, every drawing issued ready for the
              shop floor.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href="#contact"
                data-cursor-grow
                className="inline-flex items-center justify-center rounded-xl border border-btn-solid bg-accent px-7 py-3.5 text-sm font-semibold text-steel-950 transition-[background-color,box-shadow] duration-200 hover:bg-accent/90 hover:shadow-[0_10px_30px_-12px_rgb(var(--color-accent)/0.7)]"
              >
                Request a Quote
              </a>

              {canRender && (
                <>
                  {/* Only meaningful where the scene follows a single theme.
                      On a wide screen both themes are already on screen, so
                      offering to switch between them would be nonsense. */}
                  {!wide && (
                    <button
                      type="button"
                      onClick={flipTheme}
                      data-cursor-grow
                      className="label-mono-sm rounded-lg border border-blueprint px-4 py-2.5 font-semibold text-paper-dim transition-colors hover:border-accent hover:text-accent"
                    >
                      {theme === "light" ? "VIEW IN DARK" : "VIEW IN LIGHT"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={replay}
                    data-cursor-grow
                    className="label-mono-sm rounded-lg border border-transparent px-2 py-2.5 font-semibold text-paper-dim underline-offset-4 transition-colors hover:text-accent hover:underline"
                  >
                    REPLAY
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/*
          Figures on the light half, mirroring the dark half's headline. These
          are the site's real numbers, pulled from the same set the "By the
          numbers" band uses — not invented to fill the layout.
        */}
        <div
          className={`pointer-events-none absolute right-6 top-1/2 hidden w-[16rem] -translate-y-1/2 space-y-6 transition-all duration-1000 ease-out-expo md:right-10 lg:block ${assembled && wide && canRender
              ? "translate-x-0 opacity-100"
              : "translate-x-6 opacity-0"
            }`}
        >
          <p className="label-mono font-semibold text-[#C2410C]">
            COMPLETED PROJECTS, DELIVERED
          </p>
          {FIGURES.map((figure) => (
            <div key={figure.label} className="flex items-baseline gap-3">
              <span className="font-display text-3xl font-semibold tracking-tight text-[#0F172A]">
                {figure.value}
              </span>
              <span className="label-mono-sm text-[#475569]">{figure.label}</span>
            </div>
          ))}
        </div>

        {/* The sequence is decorative, but its outcome is worth announcing to
            anyone who isn't watching it. */}
        <p ref={liveRef} className="sr-only" role="status">
          {assembled ? "Steel platform assembly complete." : "Assembling steel platform."}
        </p>
      </div>

      {/* Explore — the way through to the rest of the page. */}
      <a
        href="#top"
        data-cursor-grow
        className="group absolute inset-x-0 bottom-8 z-20 mx-auto flex w-fit flex-col items-center gap-2 rounded-xl px-5 py-2 text-paper transition-colors hover:text-accent md:bottom-10"
      >
        <span className="label-mono font-semibold tracking-[0.2em]">EXPLORE</span>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full border border-blueprint-light transition-[transform,border-color] duration-300 ease-out-expo group-hover:border-accent motion-safe:group-hover:translate-y-1"
          aria-hidden="true"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 2.5v11M3.5 9.5L8 14l4.5-4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </a>
    </section>
  );
}
