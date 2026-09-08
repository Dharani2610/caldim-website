"use client";

import { useEffect, useState } from "react";

export type WebGLState = "checking" | "ready" | "unavailable";

/**
 * Decides whether it is reasonable to start a WebGL canvas here.
 *
 * Three things can make the answer no, and all of them matter on a marketing
 * site that people open on whatever device is to hand:
 *
 *  - the visitor asked for reduced motion, and a continuously rendering scene
 *    is exactly what that setting is about;
 *  - the browser can't give us a WebGL context at all (older devices, hardware
 *    acceleration disabled, a locked-down corporate build);
 *  - the device reports very little memory or very few cores, where a live
 *    canvas costs more in dropped frames and battery than the effect is worth.
 *
 * Callers render a static fallback in every case, so the section is never
 * blank — only quieter.
 */
export function useWebGL(): WebGLState {
  const [state, setState] = useState<WebGLState>("checking");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setState("unavailable");
      return;
    }

    // `deviceMemory` and `hardwareConcurrency` are advisory and absent in some
    // browsers; only act when a value is actually reported and is low.
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    if (typeof memory === "number" && memory > 0 && memory < 1) {
      setState("unavailable");
      return;
    }
    // Only bail on genuinely single-core hardware. A dual-core laptop renders
    // this scene comfortably, and an earlier, stricter threshold turned the
    // interactive model off for machines that had no trouble with it.
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 2) {
      setState("unavailable");
      return;
    }

    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl2") ??
        canvas.getContext("webgl") ??
        canvas.getContext("experimental-webgl");

      if (!gl) {
        setState("unavailable");
        return;
      }

      // Release the probe context immediately; browsers cap how many can be
      // live at once, and leaking one here would count against the real scene.
      const lose = (gl as WebGLRenderingContext).getExtension("WEBGL_lose_context");
      lose?.loseContext();

      setState("ready");
    } catch {
      setState("unavailable");
    }
  }, []);

  return state;
}

/**
 * True once the element has been near the viewport at least once.
 *
 * A WebGL canvas that mounts on page load runs its render loop while it is
 * three screens below the fold. Gating on visibility means the GPU stays idle
 * until the scene is actually about to be seen.
 */
export function useNearViewport(
  ref: React.RefObject<HTMLElement>,
  rootMargin = "300px"
): boolean {
  const [near, setNear] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, rootMargin]);

  return near;
}
