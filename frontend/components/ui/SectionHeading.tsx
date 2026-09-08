import type { ReactNode } from "react";
import Reveal from "@/frontend/components/ui/Reveal";

/**
 * The section header used across the whole page.
 *
 * This markup was repeated in twelve components, each with its own margin and
 * max-width, which is why the gap between an eyebrow and its heading drifted
 * between sections. One component means one vertical rhythm — and changing the
 * rhythm later is a single edit rather than twelve.
 */
export default function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
  as: Heading = "h2",
  className = "",
  action,
}: {
  /** Small mono label above the heading, e.g. "CAPABILITIES". */
  eyebrow: string;
  /** Omit for sections that carry only an eyebrow (Stats, Testimonials). */
  title?: ReactNode;
  /** Optional supporting sentence below the heading. */
  lead?: ReactNode;
  align?: "left" | "center";
  as?: "h1" | "h2" | "h3";
  className?: string;
  /** Optional trailing element — a link or button, right-aligned on desktop. */
  action?: ReactNode;
}) {
  const centred = align === "center";

  return (
    <div
      className={`flex flex-col gap-6 md:flex-row md:items-end md:justify-between ${
        title ? "mb-12 md:mb-16" : "mb-10 md:mb-12"
      } ${className}`}
    >
      <Reveal className={`max-w-2xl ${centred ? "mx-auto text-center" : ""}`}>
        <p className="label-mono text-accent mb-3 flex items-center gap-3">
          {!centred && (
            <span className="h-px w-6 bg-accent/50 shrink-0" aria-hidden="true" />
          )}
          {eyebrow}
        </p>
        {title && (
          <Heading className="font-display font-semibold text-paper text-[clamp(2rem,3vw+1rem,3.25rem)] leading-[1.08] tracking-[-0.015em]">
            {title}
          </Heading>
        )}
        {lead && (
          <p className="mt-4 text-paper-dim leading-relaxed max-w-xl">{lead}</p>
        )}
      </Reveal>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
