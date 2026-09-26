"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { Linkedin, Mail, MapPin } from "lucide-react";
import SectionHeading from "@/frontend/components/ui/SectionHeading";
import Reveal from "@/frontend/components/ui/Reveal";
import type { LeaderView } from "@/shared/content/types";

/**
 * Meet Our Leadership.
 *
 * The card is built as a real 3D scene rather than a flat panel with a shadow:
 * the portrait, the name plate, and the part-mark bubble each sit on their own
 * Z plane inside a shared `preserve-3d` context, so rotating the card moves
 * them at different rates and produces genuine parallax. That is what makes it
 * read as depth instead of as a tilted picture.
 *
 * Everything degrades cleanly — no photo falls back to an engraved monogram,
 * no pointer (touch, keyboard) simply gets the flat card, and reduced-motion
 * disables the tilt entirely.
 */

interface CardTransform {
  card: CSSProperties;
  glare: CSSProperties;
}

const NEUTRAL: CardTransform = {
  card: { transform: "perspective(1100px) rotateX(0deg) rotateY(0deg) translateZ(0)" },
  glare: { opacity: 0 },
};

function LeaderCard({ leader, index }: { leader: LeaderView; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<CardTransform>(NEUTRAL);
  const [active, setActive] = useState(false);
  const [entered, setEntered] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isTapped, setIsTapped] = useState(false);

  const isRevealed = isHovered || isFocused || isTapped;

  /**
   * The cards swing in on their own Y axis as they scroll into view, each one
   * a little after the last.
   */
  useEffect(() => {
    const element = shell.current;
    if (!element) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setEntered(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        window.setTimeout(() => setEntered(true), index * 110);
        observer.disconnect();
      },
      { threshold: 0.2 }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [index]);

  const handlePointerEnter = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") {
      setIsHovered(true);
      setActive(true);
    }
  };

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = element.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;

    setActive(true);
    setIsHovered(true);
    setTransform({
      card: {
        transform: `perspective(1100px) rotateX(${(-py * 8).toFixed(2)}deg) rotateY(${(
          px * 10
        ).toFixed(2)}deg) translateZ(12px)`,
      },
      glare: {
        opacity: 0.45,
        background: `radial-gradient(420px circle at ${(px + 0.5) * 100}% ${
          (py + 0.5) * 100
        }%, rgb(var(--color-accent) / 0.16), transparent 62%)`,
      },
    });
  };

  const handleLeave = () => {
    setActive(false);
    setIsHovered(false);
    setTransform(NEUTRAL);
  };

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const handleClick = () => {
    setIsTapped((prev) => !prev);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsTapped((prev) => !prev);
    } else if (e.key === "Escape") {
      setIsTapped(false);
      setIsFocused(false);
    }
  };

  return (
    <Reveal delay={index * 0.08} className="h-full">
      <div ref={shell} className="h-full" style={{ perspective: "1500px" }}>
        <div
          className={`h-full transition-[transform,opacity] duration-[900ms] ease-out-expo motion-reduce:transition-none ${
            entered
              ? "opacity-100 [transform:none]"
              : "opacity-0 [transform:rotateY(-26deg)_rotateX(7deg)_translateZ(-110px)]"
          }`}
          style={{ transformStyle: "preserve-3d" }}
        >
          <div
            ref={ref}
            tabIndex={0}
            role="region"
            aria-label={`${leader.name}, ${leader.title} — ${isRevealed ? "Bio details shown" : "Hover or tap to view bio"}`}
            aria-expanded={isRevealed}
            onPointerEnter={handlePointerEnter}
            onPointerMove={handleMove}
            onPointerLeave={handleLeave}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            className="group relative h-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-steel-950 rounded-2xl"
            style={{ perspective: "1100px" }}
          >
            <article
              className="card-surface relative h-full overflow-hidden rounded-2xl border border-blueprint bg-steel-900/50 motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out-expo will-change-transform hover:border-blueprint-light"
              style={{ ...transform.card, transformStyle: "preserve-3d" }}
            >
              {/* Blueprint texture, pushed furthest back in the stack. */}
              <div
                className="pointer-events-none absolute inset-0 bp-grid-fine opacity-[0.06]"
                style={{ transform: "translateZ(0px)" }}
                aria-hidden="true"
              />

              {/* FRONT FACE: Default portrait & nameplate (maintains natural card height) */}
              <div
                className={`relative flex flex-col h-full transition-opacity duration-300 ease-out motion-reduce:transition-none ${
                  isRevealed
                    ? "opacity-0 pointer-events-none"
                    : "opacity-100 group-hover:opacity-0 group-focus-within:opacity-0"
                }`}
                style={{ transform: "translateZ(18px)" }}
              >
                {/* Portrait plane */}
                <div className="relative aspect-square w-full overflow-hidden bg-white">
                  {leader.photoUrl ? (
                    <Image
                      src={leader.photoUrl}
                      alt={leader.photoAlt}
                      fill
                      sizes="(min-width: 1280px) 360px, (min-width: 768px) 33vw, 90vw"
                      quality={90}
                      className="object-cover object-top motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out-expo group-hover:scale-[1.03]"
                    />
                  ) : (
                    <MonogramPortrait initials={leader.initials} />
                  )}

                  {/* Scrim */}
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-steel-900 via-steel-900/60 to-transparent"
                    aria-hidden="true"
                  />
                </div>

                {/* Front text plate */}
                <div className="relative p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display text-xl font-semibold leading-tight text-paper">
                      {leader.name}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-paper-dim">{leader.title}</p>

                    {leader.credentials && (
                      <p className="label-mono-sm mt-2 text-accent">{leader.credentials}</p>
                    )}
                  </div>

                  {(leader.location || leader.email || leader.linkedinUrl) && (
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                      {leader.location && (
                        <span className="label-mono-sm inline-flex items-center gap-1.5 text-paper-dim/80">
                          <MapPin size={12} aria-hidden="true" />
                          {leader.location}
                        </span>
                      )}
                      {leader.email && (
                        <span className="label-mono-sm inline-flex items-center gap-1.5 text-paper-dim/80">
                          <Mail size={12} aria-hidden="true" />
                          Email
                        </span>
                      )}
                      {leader.linkedinUrl && (
                        <span className="label-mono-sm inline-flex items-center gap-1.5 text-paper-dim/80">
                          <Linkedin size={12} aria-hidden="true" />
                          LinkedIn
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* BACK / REVEALED BIO FACE: Compact bio details view */}
              <div
                className={`absolute inset-0 z-20 flex flex-col p-5 bg-steel-900/95 backdrop-blur-md transition-opacity duration-300 ease-out motion-reduce:transition-none ${
                  isRevealed
                    ? "opacity-100 pointer-events-auto"
                    : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto"
                }`}
                style={{ transform: "translateZ(30px)" }}
              >
                {/* Subtle blueprint grid overlay */}
                <div className="pointer-events-none absolute inset-0 bp-grid-fine opacity-[0.08]" aria-hidden="true" />

                {/* Top Section: Small Circular Photo (top-left) */}
                <div className="relative flex-shrink-0">
                  <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-full border border-accent/40 bg-white shadow-md ring-2 ring-steel-950/80">
                    {leader.photoUrl ? (
                      <Image
                        src={leader.photoUrl}
                        alt={leader.photoAlt}
                        fill
                        sizes="44px"
                        quality={90}
                        className="object-cover object-top"
                      />
                    ) : (
                      <MonogramPortrait initials={leader.initials} />
                    )}
                  </div>
                </div>

                {/* Below Circular Photo: Leader Name and Title */}
                <div className="relative mt-2 flex-shrink-0">
                  <h4 className="font-display text-base font-semibold leading-tight text-paper">
                    {leader.name}
                  </h4>
                  <p className="label-mono-sm mt-0.5 text-xs text-accent font-medium">
                    {leader.title}
                  </p>
                </div>

                {/* Middle Section: Scrollable Bio Content (Education, Experience, Highlights) */}
                <div className="relative my-2 flex-1 overflow-y-auto pr-1 pb-1 text-left space-y-2 focus:outline-none scrollbar-thin">
                  {leader.education && (
                    <div className="space-y-0.5">
                      <span className="label-mono-sm block text-[9.5px] uppercase tracking-wider text-accent/85 font-semibold">
                        Education
                      </span>
                      <p className="text-xs font-medium leading-snug text-paper">
                        {leader.education}
                      </p>
                    </div>
                  )}

                  {leader.experience && (
                    <div className="space-y-0.5">
                      <span className="label-mono-sm block text-[9.5px] uppercase tracking-wider text-accent/85 font-semibold">
                        Experience
                      </span>
                      <p className="text-xs font-medium leading-snug text-paper">
                        {leader.experience}
                      </p>
                    </div>
                  )}

                  {leader.highlights && leader.highlights.length > 0 && (
                    <div className="space-y-1 pt-0.5">
                      <span className="label-mono-sm block text-[9.5px] uppercase tracking-wider text-accent/85 font-semibold">
                        Key Highlights
                      </span>
                      <ul className="space-y-1 text-[11px] leading-relaxed text-paper-dim">
                        {leader.highlights.map((point, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-accent" aria-hidden="true" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {leader.bio && (
                    <p className="border-t border-blueprint/60 pt-2 text-xs leading-relaxed text-paper-dim">
                      {leader.bio}
                    </p>
                  )}
                </div>

                {/* Bottom Section: Compact Contact / Social Links */}
                {(leader.location || leader.email || leader.linkedinUrl) && (
                  <div className="relative flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-blueprint/60 pt-2 flex-shrink-0">
                    {leader.location && (
                      <span className="label-mono-sm inline-flex items-center gap-1 text-[10px] text-paper-dim/80">
                        <MapPin size={10} aria-hidden="true" />
                        {leader.location}
                      </span>
                    )}
                    {leader.email && (
                      <a
                        href={`mailto:${leader.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="label-mono-sm inline-flex items-center gap-1 text-[10px] text-paper-dim/80 transition-colors hover:text-accent"
                      >
                        <Mail size={10} aria-hidden="true" />
                        Email
                      </a>
                    )}
                    {leader.linkedinUrl && (
                      <a
                        href={leader.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="label-mono-sm inline-flex items-center gap-1 text-[10px] text-paper-dim/80 transition-colors hover:text-accent"
                      >
                        <Linkedin size={10} aria-hidden="true" />
                        LinkedIn
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Specular highlight, sitting above every plane */}
              <div
                className="pointer-events-none absolute inset-0 transition-opacity duration-300"
                style={{ ...transform.glare, transform: "translateZ(60px)" }}
                aria-hidden="true"
              />

              {/* Accent edge that lights along the bottom on hover */}
              <div
                className={`pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent transition-opacity duration-300 ${
                  active ? "opacity-80" : "opacity-0"
                }`}
                aria-hidden="true"
              />
            </article>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/**
 * Stand-in portrait: initials engraved on a steel plate, drawn to match the
 * site's drawing language rather than a generic grey avatar. Rendered whenever
 * a leader has no photo uploaded yet.
 */
function MonogramPortrait({ initials }: { initials: string }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bp-grid opacity-[0.14]" aria-hidden="true" />
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(circle at 50% 38%, rgb(var(--color-glow) / 0.18), transparent 62%)",
        }}
        aria-hidden="true"
      />
      <svg
        viewBox="0 0 200 250"
        className="relative h-full w-full"
        role="img"
        aria-label={`Placeholder portrait, initials ${initials}`}
      >
        {/* Plate outline with corner ticks, like a drawing title block. */}
        <rect
          x="34"
          y="58"
          width="132"
          height="132"
          rx="4"
          fill="none"
          stroke="rgb(var(--color-blueprint-light))"
          strokeWidth="1"
        />
        {[
          [34, 58],
          [166, 58],
          [34, 190],
          [166, 190],
        ].map(([cx, cy]) => (
          <circle
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r="3"
            fill="none"
            stroke="rgb(var(--color-accent))"
            strokeWidth="1"
            opacity="0.7"
          />
        ))}
        <text
          x="100"
          y="136"
          textAnchor="middle"
          fontFamily="var(--font-space-grotesk), sans-serif"
          fontWeight="700"
          fontSize="46"
          letterSpacing="2"
          fill="rgb(var(--color-steel-mark))"
          opacity="0.85"
        >
          {initials}
        </text>
        <text
          x="100"
          y="166"
          textAnchor="middle"
          fontFamily="var(--font-jetbrains-mono), monospace"
          fontSize="8"
          letterSpacing="1.6"
          fill="rgb(var(--color-paper-dim))"
          opacity="0.7"
        >
          PHOTO PENDING
        </text>
      </svg>
    </div>
  );
}

export default function Leadership({ leaders }: { leaders: LeaderView[] }) {
  if (leaders.length === 0) return null;

  return (
    <section
      id="leadership"
      className="relative overflow-hidden border-y border-blueprint bg-steel-950 py-24 md:py-32"
      aria-labelledby="leadership-heading"
    >
      <div className="absolute inset-0 bp-grid opacity-[0.05]" aria-hidden="true" />

      <div className="relative mx-auto max-w-[1440px] px-6 md:px-10">
        <SectionHeading
          eyebrow="MEET OUR LEADERSHIP"
          title={
            <span id="leadership-heading">
              The people who sign off on your steel.
            </span>
          }
          lead="Every package leaves here under a named engineer, not a queue. These are the people accountable for the drawings, the calculations, and the dates we commit to."
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {leaders.map((leader, index) => (
            <LeaderCard key={leader.id} leader={leader} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
