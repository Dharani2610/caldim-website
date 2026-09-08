"use client";

import { useEffect, useState } from "react";

export type Theme = "dark" | "light";

/**
 * Returns the current theme and re-renders whenever it changes (i.e. when
 * ThemeToggle flips the `.light` class on <html>). Defaults to "dark" to
 * match the server-rendered assumption — the blocking init script in
 * layout.tsx already applied the real class before first paint, so this
 * just needs to catch up on mount.
 */
export function useTheme(): Theme {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const read = () => setTheme(document.documentElement.classList.contains("light") ? "light" : "dark");
    read();

    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return theme;
}
