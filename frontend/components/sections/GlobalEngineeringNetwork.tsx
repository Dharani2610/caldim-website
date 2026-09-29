"use client";

import { useState } from "react";
import { ArrowUpRight, Phone } from "lucide-react";

interface OfficeNode {
  index: string;
  code: string;
  city: string;
  country: string;
  type: string;
  typeBadge: string;
  company?: string;
  addressLines: string[];
  phoneDisplay: string;
  phoneTel: string;
  connectionToNext?: {
    distance: string;
    label: string;
  };
}

const networkOffices: OfficeNode[] = [
  {
    index: "01",
    code: "IND — MAA",
    city: "CHENNAI, TAMIL NADU",
    country: "INDIA",
    type: "INDIA — HEAD OFFICE",
    typeBadge: "GLOBAL HEADQUARTERS",
    addressLines: [
      "Minimac Center #118, First Floor, Arcot Road,",
      "Valasaravakkam, Tamil Nadu, Chennai – 600087",
    ],
    phoneDisplay: "248-455 3855",
    phoneTel: "tel:2484553855",
    connectionToNext: {
      distance: "295 KM",
      label: "REGIONAL CORRIDOR",
    },
  },
  {
    index: "02",
    code: "IND — HSR",
    city: "HOSUR, TAMIL NADU",
    country: "INDIA",
    type: "INDIA — BRANCH OFFICE",
    typeBadge: "REGIONAL OFFICE",
    addressLines: [
      "Plot No. 22, 23, 24, 2nd Floor, Durga Bhavani Towers,",
      "Thirsul Layout, Near RTO Check Post, NH 207, Bagalur Road,",
      "TamilNadu, Hosur – 635103",
    ],
    phoneDisplay: "04344610637",
    phoneTel: "tel:04344610637",
    connectionToNext: {
      distance: "14,320 KM",
      label: "INTERNATIONAL LINK",
    },
  },
  {
    index: "03",
    code: "USA — FCO",
    city: "FRISCO, TEXAS",
    country: "USA",
    type: "USA — INTERNATIONAL OFFICE",
    typeBadge: "INTERNATIONAL EXTENSION",
    addressLines: [
      "Caldim Tech Services LLC",
      "8668 John Hickman Pkwy, Suite 903",
      "Frisco, Texas 75034",
      "USA",
    ],
    phoneDisplay: "+1 (248) 455-3855",
    phoneTel: "tel:+12484553855",
  },
];

export default function GlobalEngineeringNetwork() {
  const [activeNode, setActiveNode] = useState<number | null>(null);

  return (
    <div
      id="global-network"
      aria-label="Global Engineering Network"
      className="relative mt-14 mb-8 border-t border-blueprint pt-12 pb-6"
    >
      {/* Background blueprint grid texture */}
      <div
        className="pointer-events-none absolute inset-0 bp-grid-fine opacity-20 [html.light_&]:opacity-15"
        aria-hidden="true"
      />

      {/* Blueprint corner crosshairs & datum marks */}
      <div
        className="pointer-events-none absolute top-4 left-0 font-mono text-[10px] text-paper-dim/40 tracking-widest"
        aria-hidden="true"
      >
        + DATUM: WGS84 / ELEV. REF: 00-NET
      </div>
      <div
        className="pointer-events-none absolute top-4 right-0 font-mono text-[10px] text-paper-dim/40 tracking-widest hidden sm:block"
        aria-hidden="true"
      >
        DWG: CE-LOC-2026-REV5 +
      </div>

      {/* Header Composition */}
      <div className="relative mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="label-mono-sm font-bold uppercase tracking-widest text-accent">
              GLOBAL ENGINEERING NETWORK
            </span>
            <span className="text-paper-dim/40">/</span>
            <span className="label-mono-sm text-paper-dim/70">3 ACTIVE HUBS</span>
          </div>

          <h2 className="font-display text-2xl font-bold tracking-tight text-paper sm:text-3xl lg:text-4xl">
            OUR CORPORATE OFFICES &amp; LOCATIONS
          </h2>

          <p className="mt-2 text-sm text-accent sm:text-base font-medium">
            Headquarters in Chennai, Regional Branch in Hosur &amp; US Office in Frisco, TX
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 rounded-full border border-blueprint px-4 py-1.5 text-xs text-paper-dim backdrop-blur-xs">
          <span className="text-accent" aria-hidden="true">📍</span>
          <span>Direct Contact &amp; On-Site Consultation</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP VIEW: Continuous Horizontal Engineering Datum Composition (NO CARDS) */}
      {/* ========================================================================= */}
      <div className="relative hidden lg:block">
        {/* Horizontal Engineering Baseline / Elevation Line */}
        <div className="relative mb-8 h-12">
          {/* Main 1px steel datum beam line */}
          <div
            className="absolute top-6 left-0 right-0 h-px bg-blueprint"
            aria-hidden="true"
          />

          {/* Dimension ticks & connecting path overlay */}
          <svg
            className="absolute inset-0 h-full w-full pointer-events-none overflow-visible"
            aria-hidden="true"
          >
            {/* Datum line with subtle glow */}
            <line
              x1="5%"
              y1="24"
              x2="95%"
              y2="24"
              stroke="currentColor"
              className="text-accent/30"
              strokeWidth="1"
              strokeDasharray="4 4"
            />

            {/* Traveling energy beam pulses (disabled on reduced motion) */}
            <circle
              r="2.5"
              className="fill-accent motion-reduce:hidden"
              style={{
                filter: "drop-shadow(0 0 6px rgb(63,169,232))",
              }}
            >
              <animateMotion
                path="M 70 24 L 1370 24"
                dur="8s"
                repeatCount="indefinite"
              />
            </circle>

            {/* Dimension marks between Node 01 (Chennai) and Node 02 (Hosur) */}
            <text
              x="33%"
              y="14"
              textAnchor="middle"
              className="fill-paper-dim/60 font-mono text-[9px] tracking-widest uppercase"
            >
              ← DIM: CHENNAI → HOSUR · 295 KM REGIONAL CORRIDOR →
            </text>

            {/* Dimension marks between Node 02 (Hosur) and Node 03 (Frisco, Texas) */}
            <text
              x="69%"
              y="14"
              textAnchor="middle"
              className="fill-paper-dim/60 font-mono text-[9px] tracking-widest uppercase"
            >
              ← DIM: HOSUR → FRISCO · 14,320 KM INTERNATIONAL LINK →
            </text>
          </svg>

          {/* Three Datum Points */}
          <div className="relative flex justify-between px-[5%]">
            {networkOffices.map((office, idx) => {
              const isActive = activeNode === idx;
              return (
                <button
                  key={office.index}
                  type="button"
                  onMouseEnter={() => setActiveNode(idx)}
                  onMouseLeave={() => setActiveNode(null)}
                  onFocus={() => setActiveNode(idx)}
                  onBlur={() => setActiveNode(null)}
                  className="group relative flex flex-col items-center focus:outline-none"
                  aria-label={`Focus ${office.city}`}
                >
                  {/* Concentric Datum Circle */}
                  <div
                    className={`relative flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300 ${
                      isActive
                        ? "border-accent bg-accent/20 scale-125 shadow-[0_0_16px_rgba(63,169,232,0.45)]"
                        : "border-blueprint bg-steel-950 hover:border-accent hover:scale-110"
                    }`}
                  >
                    {/* Center point */}
                    <div
                      className={`h-2.5 w-2.5 rounded-full transition-colors duration-300 ${
                        isActive ? "bg-accent" : "bg-accent/80 group-hover:bg-accent"
                      }`}
                    />

                    {/* Concentric outer radar ring when active */}
                    {isActive && (
                      <span className="absolute -inset-1.5 animate-ping rounded-full border border-accent/60 motion-reduce:hidden" />
                    )}
                  </div>

                  {/* Vertical drop leader line to content */}
                  <div
                    className={`h-6 w-px transition-colors duration-300 ${
                      isActive ? "bg-accent" : "bg-blueprint/60"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Three Columns of Blueprint Information (NO CARDS) */}
        <div className="grid grid-cols-3 gap-12 divide-x divide-blueprint/50">
          {networkOffices.map((office, idx) => {
            const isActive = activeNode === idx;
            return (
              <div
                key={office.index}
                onMouseEnter={() => setActiveNode(idx)}
                onMouseLeave={() => setActiveNode(null)}
                className={`relative flex flex-col justify-between pl-8 first:pl-0 transition-opacity duration-300 ${
                  activeNode !== null && !isActive ? "opacity-60" : "opacity-100"
                }`}
              >
                {/* Node Index & Office Designation */}
                <div>
                  <div className="flex items-center justify-between border-b border-blueprint/50 pb-3">
                    <div className="flex items-baseline gap-2.5">
                      <span className="font-mono text-2xl font-bold tracking-tight text-accent">
                        {office.index}
                      </span>
                      <span className="label-mono font-semibold uppercase tracking-wider text-paper text-xs">
                        {office.type}
                      </span>
                    </div>

                    <span className="label-mono-sm rounded border border-blueprint px-2 py-0.5 text-[10px] text-paper-dim/80">
                      {office.typeBadge}
                    </span>
                  </div>

                  {/* Technical leader mark & address - sits immediately below header */}
                  <div className="relative mt-4 pl-3.5 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:bg-accent/70">
                    {office.addressLines.map((line, lIdx) => (
                      <p key={lIdx} className="text-sm leading-relaxed text-paper-dim">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Bottom Contact Link */}
                <div className="mt-6 border-t border-blueprint/50 pt-3.5">
                  {/* Interactive Phone Link */}
                  <a
                    href={office.phoneTel}
                    className="group/btn inline-flex items-center gap-2 label-mono text-xs font-semibold text-accent transition-all duration-200 hover:text-paper"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-accent transition-all duration-200 group-hover/btn:border-accent group-hover/btn:bg-accent group-hover/btn:text-white">
                      <Phone size={11} aria-hidden="true" />
                    </div>
                    <span className="border-b border-accent/40 pb-0.5 transition-colors group-hover/btn:border-paper">
                      {office.phoneDisplay}
                    </span>
                    <ArrowUpRight
                      size={13}
                      className="transition-transform duration-200 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
                      aria-hidden="true"
                    />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE / TABLET VIEW: Vertical Engineering Timeline / Ruler Composition   */}
      {/* ========================================================================= */}
      <div className="relative block lg:hidden">
        {/* Continuous Vertical Blueprint Datum Line */}
        <div
          className="absolute top-4 bottom-8 left-4 w-px bg-blueprint"
          aria-hidden="true"
        />

        <div className="space-y-12 pl-10">
          {networkOffices.map((office, idx) => (
            <div key={office.index} className="relative">
              {/* Vertical Datum Node Marker */}
              <div
                className="absolute -left-10 top-0.5 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border border-accent bg-steel-950 shadow-[0_0_10px_rgba(63,169,232,0.3)]"
                aria-hidden="true"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-accent animate-pulse motion-reduce:animate-none" />
              </div>

              {/* Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blueprint/60 pb-2.5">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-xl font-bold text-accent">
                    {office.index}
                  </span>
                  <span className="label-mono font-semibold uppercase tracking-wider text-paper text-xs">
                    {office.type}
                  </span>
                </div>

                <span className="label-mono-sm rounded border border-blueprint px-2 py-0.5 text-[10px] text-paper-dim/80">
                  {office.typeBadge}
                </span>
              </div>

              {/* Address - sits directly under header */}
              <div className="relative mt-3 pl-3 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:bg-accent/70">
                {office.addressLines.map((line, lIdx) => (
                  <p key={lIdx} className="text-sm leading-relaxed text-paper-dim">
                    {line}
                  </p>
                ))}
              </div>

              {/* Phone */}
              <div className="mt-3.5 border-t border-blueprint/40 pt-3">
                <a
                  href={office.phoneTel}
                  className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3.5 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
                >
                  <Phone size={12} aria-hidden="true" />
                  <span>{office.phoneDisplay}</span>
                  <ArrowUpRight size={12} aria-hidden="true" />
                </a>
              </div>

              {/* Distance Callout to Next Hub */}
              {office.connectionToNext && (
                <div className="mt-6 flex items-center gap-2 label-mono-sm text-[10px] text-paper-dim/50">
                  <div className="h-px w-6 bg-blueprint" />
                  <span>
                    DIM: {office.connectionToNext.distance} · {office.connectionToNext.label}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
