"use client";

import Image from "next/image";
import { useTheme } from "@/frontend/hooks/useTheme";

export default function GlowVignette({
  src,
  srcLight,
  alt,
  height = 132,
}: {
  /** dark-theme (blue-glow) image */
  src: string;
  /** light-theme (#FC7C14 glow) image — falls back to `src` if omitted */
  srcLight?: string;
  alt: string;
  height?: number;
}) {
  const theme = useTheme();
  const activeSrc = theme === "light" && srcLight ? srcLight : src;

  return (
    <div className="relative w-full flex items-center justify-center" style={{ height }}>
      <div
        className="absolute inset-2 rounded-full opacity-60 blur-2xl animate-pulse-slow pointer-events-none"
        style={{
          background:
            "radial-gradient(closest-side, rgb(var(--color-glow) / 0.4), rgb(var(--color-glow) / 0) 72%)",
        }}
        aria-hidden="true"
      />
      <div className="relative motion-safe:animate-floaty h-full w-full flex items-center justify-center">
        <Image
          key={activeSrc}
          src={activeSrc}
          alt={alt}
          width={700}
          height={480}
          className="max-h-full w-auto object-contain drop-shadow-[0_10px_26px_rgba(0,0,0,0.55)]"
        />
      </div>
    </div>
  );
}
