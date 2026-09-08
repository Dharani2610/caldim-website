"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface AssembleImageProps {
  src: string;
  alt: string;
  /** intrinsic pixel width/height of the source image, for aspect-ratio + tile math */
  width: number;
  height: number;
  cols?: number;
  rows?: number;
  className?: string;
  /** delay (seconds) before the assemble animation starts */
  delay?: number;
}

export default function AssembleImage({
  src,
  alt,
  width,
  height,
  cols = 8,
  rows = 5,
  className = "",
  delay = 0.35,
}: AssembleImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const tiles = Array.from(container.querySelectorAll<HTMLDivElement>("[data-tile]"));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      gsap.set(tiles, { x: 0, y: 0, rotation: 0, opacity: 1, scale: 1 });
      return;
    }

    const rect = container.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    tiles.forEach((tile) => {
      const tx = (parseFloat(tile.dataset.cx || "0") / width) * rect.width;
      const ty = (parseFloat(tile.dataset.cy || "0") / height) * rect.height;
      const dx = tx - cx;
      const dy = ty - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const scaleFactor = Math.min(1, rect.width / 600);
      const scatter = (40 + Math.random() * 50) * scaleFactor;
      gsap.set(tile, {
        x: (dx / dist) * scatter + (Math.random() - 0.5) * 15 * scaleFactor,
        y: (dy / dist) * scatter + (Math.random() - 0.5) * 15 * scaleFactor,
        rotation: (Math.random() - 0.5) * 45,
        opacity: 0,
        scale: 0.82,
      });
    });

    const tl = gsap.timeline({ delay });
    tl.to(tiles, {
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      scale: 1,
      duration: 1.5,
      ease: "power3.out",
      stagger: { each: 0.018, from: "random" },
    });

    // once assembled, keep the whole building gently adrift rather than sitting static
    tl.to(
      container,
      {
        y: -14,
        rotation: 0.4,
        duration: 3.6,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      },
      ">-0.1"
    );

    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tiles = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tw = 100 / cols;
      const th = 100 / rows;
      tiles.push(
        <div
          key={`${r}-${c}`}
          data-tile
          data-cx={((c + 0.5) * width) / cols}
          data-cy={((r + 0.5) * height) / rows}
          style={{
            position: "absolute",
            left: `${c * tw}%`,
            top: `${r * th}%`,
            width: `${tw}%`,
            height: `${th}%`,
            backgroundImage: `url(${src})`,
            backgroundSize: `${cols * 100}% ${rows * 100}%`,
            backgroundPosition: `${(c / (cols - 1)) * 100}% ${(r / (rows - 1)) * 100}%`,
            willChange: "transform, opacity",
          }}
        />
      );
    }
  }

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={alt}
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {tiles}
    </div>
  );
}
