"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

const STORAGE_KEY = "caldim-theme";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  // Defaults to "dark" to match the server-rendered assumption (the
  // blocking init script in layout.tsx already fixed the real page
  // colors before paint — this only affects which icon shows first).
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("light") ? "light" : "dark");
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.classList.toggle("light", next === "light");
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage unavailable (private browsing, etc.) — theme just won't persist
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
      data-cursor-grow
      className={`h-9 w-9 md:h-10 md:w-10 inline-flex items-center justify-center rounded-full border border-blueprint text-paper-dim hover:text-accent hover:border-accent transition-colors shrink-0 ${className}`}
    >
      {/* avoid rendering a theme-specific icon until mounted, to prevent hydration mismatch */}
      {mounted && theme === "light" ? (
        <Sun size={16} aria-hidden="true" />
      ) : (
        <Moon size={16} aria-hidden="true" />
      )}
    </button>
  );
}
