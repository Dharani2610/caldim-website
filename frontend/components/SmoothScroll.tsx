"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Smooth scrolling, wired to GSAP's ticker so Lenis and ScrollTrigger share a
 * single animation frame rather than each running their own.
 *
 * Two things are handled here that the previous version left broken:
 *
 *  - Anchor links. With Lenis driving the scroll position, a plain `#id` jump
 *    fights the interpolation and lands in the wrong place. Clicks on in-page
 *    anchors are intercepted and handed to Lenis instead, with an offset for
 *    the fixed header.
 *  - Ticker cleanup. `gsap.ticker.remove(() => {})` removes a brand-new
 *    function that was never added, so the old callback stayed registered and
 *    kept calling `raf` on a destroyed Lenis instance after every hot reload.
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    // Keep a reference to the exact callback so it can be removed later.
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    /** Header height, so a target doesn't land underneath the fixed nav. */
    const headerOffset = () => (window.innerWidth >= 768 ? -96 : -80);

    const onAnchorClick = (event: MouseEvent) => {
      // Let the browser handle modified clicks (new tab, download, etc).
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) return;

      const anchor = (event.target as HTMLElement)?.closest("a");
      const href = anchor?.getAttribute("href");
      if (!href || !href.startsWith("#") || href === "#") return;

      const target = document.querySelector(href);
      if (!target) return;

      event.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: headerOffset(), duration: 1.2 });

      // Keep the URL and the focus ring in step with the visual position, so
      // the jump works for keyboard and screen-reader users too.
      history.replaceState(null, "", href);
      (target as HTMLElement).setAttribute("tabindex", "-1");
      (target as HTMLElement).focus({ preventScroll: true });
    };

    document.addEventListener("click", onAnchorClick);

    return () => {
      document.removeEventListener("click", onAnchorClick);
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return <div id="main">{children}</div>;
}
