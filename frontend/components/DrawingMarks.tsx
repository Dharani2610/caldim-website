"use client";

/**
 * Drawing marks — the shop-drawing vocabulary the site borrows from.
 *
 * Every colour here reads from a theme token rather than a literal hex. That
 * matters: these marks previously carried baked-in values (a near-black label
 * box, mid-grey text, a fixed blue), so switching the page to the light theme
 * left a black rectangle floating on a pale card and dimension text at roughly
 * 1.6:1 contrast. They now follow the theme like everything else.
 */

/** A horizontal dimension line with tick marks and a label, e.g. "W12x26 [TYP]". */
export function DimensionLine({
  label,
  width = 220,
  className = "",
}: {
  label: string;
  width?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox={`0 0 ${width} 28`}
      width={width}
      height={28}
      className={className}
      aria-hidden="true"
    >
      <line
        x1={0}
        y1={14}
        x2={width}
        y2={14}
        stroke="rgb(var(--color-blueprint-light))"
        strokeWidth={1}
      />
      <line
        x1={0}
        y1={6}
        x2={0}
        y2={22}
        stroke="rgb(var(--color-blueprint-light))"
        strokeWidth={1}
      />
      <line
        x1={width}
        y1={6}
        x2={width}
        y2={22}
        stroke="rgb(var(--color-blueprint-light))"
        strokeWidth={1}
      />
      {/* The label box masks the dimension line behind the text, so it has to
          match whatever surface it is drawn on — hence `currentColor`, which
          the caller sets to the card's own background. */}
      <rect x={width / 2 - 48} y={2} width={96} height={12} fill="currentColor" />
      <text
        x={width / 2}
        y={11}
        textAnchor="middle"
        fontFamily="var(--font-jetbrains-mono), monospace"
        fontSize="9"
        letterSpacing="0.06em"
        fill="rgb(var(--color-paper-dim))"
      >
        {label}
      </text>
    </svg>
  );
}

/** Fillet weld symbol on a reference line, standard AWS-style triangle. */
export function WeldSymbol({ size = 22, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 40 24"
      width={size * 1.8}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <line x1={0} y1={12} x2={40} y2={12} stroke="rgb(var(--color-accent))" strokeWidth={1.25} />
      <path
        d="M8 12 L18 12 L8 4 Z"
        fill="none"
        stroke="rgb(var(--color-accent))"
        strokeWidth={1.25}
      />
    </svg>
  );
}

/** North arrow — a small orientation glyph near plans. */
export function NorthArrow({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className} aria-hidden="true">
      <circle
        cx={20}
        cy={20}
        r={18}
        fill="none"
        stroke="rgb(var(--color-blueprint-light))"
        strokeWidth={1}
      />
      <path d="M20 6 L25 24 L20 20 L15 24 Z" fill="rgb(var(--color-paper))" />
      <text
        x={20}
        y={34}
        textAnchor="middle"
        fontFamily="var(--font-jetbrains-mono), monospace"
        fontSize="7"
        fill="rgb(var(--color-paper-dim))"
      >
        N
      </text>
    </svg>
  );
}

/** Revision cloud — a scalloped boundary, used as a callout accent. */
export function RevisionCloud({
  width = 120,
  height = 60,
  className = "",
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  const bumps = 10;
  const r = width / bumps / 2;
  let path = `M ${r} ${height / 2}`;
  for (let i = 0; i < bumps; i++) {
    const cx = r + i * r * 2;
    path += ` A ${r} ${r} 0 1 1 ${cx + r * 2} ${height / 2}`;
  }
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      aria-hidden="true"
    >
      <path
        d={path}
        fill="none"
        stroke="rgb(var(--color-accent))"
        strokeWidth={1}
        opacity={0.7}
      />
    </svg>
  );
}

/** Part-mark bubble, e.g. "B1", "C1" — the circled tag identifying a member. */
export function PartMarkBubble({
  mark,
  className = "",
  size = 30,
}: {
  mark: string;
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={`label-mono inline-flex items-center justify-center rounded-full border border-accent text-accent ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      {mark}
    </span>
  );
}
