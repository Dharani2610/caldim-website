"use client";

import { useEffect, useState } from "react";

export type WebGLState = "checking" | "ready" | "unavailable";
export type DetailTier = "full" | "reduced";

export interface WebGLCapability {
  state: WebGLState;
  tier: DetailTier;
}

export function useWebGLCapability(): WebGLCapability {
  const [capability, setCapability] = useState<WebGLCapability>({
    state: "checking",
    tier: "full",
  });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCapability({ state: "unavailable", tier: "reduced" });
      return;
    }

    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    if (typeof memory === "number" && memory > 0 && memory < 1) {
      setCapability({ state: "unavailable", tier: "reduced" });
      return;
    }

    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 2) {
      setCapability({ state: "unavailable", tier: "reduced" });
      return;
    }

    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl2") ??
        canvas.getContext("webgl") ??
        canvas.getContext("experimental-webgl");

      if (!gl) {
        setCapability({ state: "unavailable", tier: "reduced" });
        return;
      }

      const lose = (gl as WebGLRenderingContext).getExtension("WEBGL_lose_context");
      lose?.loseContext();

      // Determine appropriate detail tier based on device hardware capability and screen width
      const isLowCore = typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4;
      const isLowMemory = typeof memory === "number" && memory > 0 && memory <= 4;
      const isMobileViewport = typeof window !== "undefined" && window.innerWidth < 768;

      const tier: DetailTier = isLowCore || isLowMemory || isMobileViewport ? "reduced" : "full";

      setCapability({ state: "ready", tier });
    } catch {
      setCapability({ state: "unavailable", tier: "reduced" });
    }
  }, []);

  return capability;
}

export function useWebGL(): WebGLState {
  const { state } = useWebGLCapability();
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
