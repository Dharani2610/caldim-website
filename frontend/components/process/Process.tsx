"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileCheck,
  Layers,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { processPhases } from "@/shared/data/content";
import SectionHeading from "@/frontend/components/ui/SectionHeading";

// Metadata enhancements per engineering phase
const phaseMetadata = [
  {
    code: "PHASE 01 · INITIATION",
    shortLabel: "RFQ",
    turnaround: "24–48 Hours",
    deliverable: "Fixed-Fee Proposal & Schedule",
    standard: "AISC Code of Standard Practice (AISC 303)",
    cadTool: "Inquiry & Contract Intake",
    statusBadge: "INQUIRY LOGGED",
  },
  {
    code: "PHASE 02 · 3D MODELING",
    shortLabel: "SETUP",
    turnaround: "Schedule-Dependent",
    deliverable: "EOR Grid & Elevation Aligned Model",
    standard: "IFC / DWG / PDF Contract Set",
    cadTool: "Tekla Structures & SDS2",
    statusBadge: "COORDINATES LOCKED",
  },
  {
    code: "PHASE 03 · DRAFTING",
    shortLabel: "DRAFT",
    turnaround: "Per Milestone Schedule",
    deliverable: "Shop Sheets, E-Plans & Advance Bills",
    standard: "Fabricator Custom Standards",
    cadTool: "CAD & Automated BOM Engine",
    statusBadge: "WELD & BOLT LAYOUTS DRAWN",
  },
  {
    code: "PHASE 04 · QUALITY CONTROL",
    shortLabel: "QA/QC",
    turnaround: "Independent Verification",
    deliverable: "Redline Audit & Clash Report",
    standard: "Zero-Defect Internal QA Protocol",
    cadTool: "Dual-Detailer Audit",
    statusBadge: "100% CHECKED & SIGNED OFF",
  },
  {
    code: "PHASE 05 · ENGINEERING",
    shortLabel: "STAMP",
    turnaround: "State-Licensed PE",
    deliverable: "Calculations Package & PE Seal",
    standard: "AISC 360-22 / IBC 2024",
    cadTool: "FEA Connection Calc Sheets",
    statusBadge: "LICENSED PE EMBOSSED",
  },
  {
    code: "PHASE 06 · FAB DISPATCH",
    shortLabel: "ISSUED",
    turnaround: "Immediate Digital Release",
    deliverable: "NC1 / DSTV, DXF, E-Sheets, KISS, FabTrol",
    standard: "CNC Machine-Ready MIS",
    cadTool: "Tekla PowerFab / CNC Pipeline",
    statusBadge: "RELEASED FOR PRODUCTION",
  },
];

export default function Process() {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const totalSteps = processPhases.length;
  const currentPhase = processPhases[activeStep];
  const meta = phaseMetadata[activeStep];

  // Auto-advance slideshow timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % totalSteps);
      }, 5500);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, totalSteps]);


  const handleManualSelect = (index: number) => {
    setActiveStep(index);
    setIsPlaying(false); // Pause on user interaction so they can read at their own pace
  };

  const handlePrev = () => {
    setActiveStep((prev) => (prev - 1 + totalSteps) % totalSteps);
    setIsPlaying(false);
  };

  const handleNext = () => {
    setActiveStep((prev) => (prev + 1) % totalSteps);
    setIsPlaying(false);
  };

  return (
    <section
      id="process"
      className="relative border-y border-blueprint bg-steel-950 py-20 md:py-28 overflow-hidden"
      aria-labelledby="process-heading"
    >
      {/* Background blueprint architectural grid */}
      <div
        className="pointer-events-none absolute inset-0 bp-grid-fine opacity-25 [html.light_&]:opacity-15"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-[1440px] px-6 md:px-10">
        {/* Header with technical sub-indicators */}
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="ENGINEERING PIPELINE"
            title={<span id="process-heading">RFQ to issued-for-fab, in six phases.</span>}
          />

          {/* Controls Bar: Play/Pause, Step indicators */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-blueprint bg-steel-900/60 px-3.5 py-1.5 label-mono-sm text-xs text-paper-dim backdrop-blur-xs">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span>LIVE CAD WORKSPACE</span>
              <span className="text-paper-dim/40">/</span>
              <span className="text-accent font-semibold">
                STEP {activeStep + 1} OF {totalSteps}
              </span>
            </div>

            <div className="flex items-center gap-1.5 rounded-full border border-blueprint bg-steel-900/60 p-1 backdrop-blur-xs">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous Phase"
                className="flex h-8 w-8 items-center justify-center rounded-full text-paper-dim transition-colors hover:bg-steel-800 hover:text-paper"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                aria-label={isPlaying ? "Pause auto-advance" : "Play auto-advance"}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                  isPlaying
                    ? "bg-accent/20 text-accent border border-accent/40"
                    : "text-paper-dim hover:bg-steel-800 hover:text-paper"
                }`}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={handleNext}
                aria-label="Next Phase"
                className="flex h-8 w-8 items-center justify-center rounded-full text-paper-dim transition-colors hover:bg-steel-800 hover:text-paper"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAIN STAGE: Live Interactive CAD & Blueprint Drawing Canvas (NO CARDS)    */}
        {/* ========================================================================= */}
        <div className="relative rounded-2xl border border-blueprint bg-steel-950/80 p-4 sm:p-6 md:p-10 shadow-2xl backdrop-blur-md">
          {/* Top Architectural Viewport HUD Bar */}
          <div className="mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-2.5 border-b border-blueprint/60 pb-3 sm:pb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-6 items-center gap-1.5 rounded border border-accent/40 bg-accent/10 px-2 label-mono-sm text-[10px] sm:text-[11px] font-bold text-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-ping" />
                {meta.code}
              </div>
              <span className="hidden sm:inline font-mono text-xs text-paper-dim/60">
                DWG REF: CE-S201-REV{activeStep + 1}
              </span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-4 label-mono-sm text-[10px] sm:text-[11px] text-paper-dim/80">
              <span className="hidden md:inline">SCALE: 1&quot; = 1&apos;-0&quot;</span>
              <span className="hidden lg:inline">SPEC: AISC 360-22</span>
              <div className="flex items-center gap-1.5 rounded-full border border-blueprint px-2.5 py-0.5 text-paper text-[10px] sm:text-[11px]">
                <span className="h-1.5 w-1.5 rounded-full bg-mark-cool" />
                <span>{meta.statusBadge}</span>
              </div>
            </div>
          </div>

          {/* Central CAD Canvas: The Evolving Structural Steel Member */}
          <div className="relative flex min-h-[220px] sm:min-h-[320px] md:min-h-[380px] w-full items-center justify-center overflow-hidden rounded-xl border border-blueprint/40 bg-steel-900/30 p-2 sm:p-6 md:p-8">
            <div className="pointer-events-none absolute bottom-3 left-4 font-mono text-[9px] text-paper-dim/40 tracking-wider hidden sm:block">
              TOOL: {meta.cadTool}
            </div>


            {/* Main Interactive Scalable Vector Architectural Assembly */}
            <svg
              viewBox="0 0 800 360"
              className="h-full w-full max-w-[820px] select-none overflow-visible"
              aria-label={`CAD illustration for ${currentPhase.label}`}
            >
              <defs>
                {/* Diagonal hatch pattern for cut steel section */}
                <pattern
                  id="steelHatch"
                  width="8"
                  height="8"
                  patternTransform="rotate(45 0 0)"
                  patternUnits="userSpaceOnUse"
                >
                  <line x1="0" y1="0" x2="0" y2="8" stroke="rgb(var(--color-blueprint))" strokeWidth="1" />
                </pattern>

                {/* Glow filter for active elements */}
                <filter id="cadGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* ------------------------------------------------------------- */}
              {/* PHASE 01: Scope & RFQ (Ghosted Bounding Box + Coordinate Wireframe) */}
              {/* ------------------------------------------------------------- */}
              <g
                className="transition-all duration-700 ease-out"
                opacity={activeStep === 0 ? 1 : 0.25}
              >
                {/* Bounding box guide envelope */}
                <rect
                  x="120"
                  y="110"
                  width="560"
                  height="140"
                  fill="none"
                  stroke="rgb(var(--color-accent))"
                  strokeWidth="1.5"
                  strokeDasharray="6 6"
                  className={activeStep === 0 ? "animate-pulse" : ""}
                />

                {/* Corner crosshairs */}
                <path
                  d="M110 110 H130 M120 100 V120 M670 110 H690 M680 100 V120 M110 250 H130 M120 240 V260 M670 250 H690 M680 240 V260"
                  stroke="rgb(var(--color-accent))"
                  strokeWidth="1.5"
                />

                {/* RFQ Floating Callout when at Phase 0 */}
                {activeStep === 0 && (
                  <g transform="translate(400, 180)" textAnchor="middle">
                    <rect
                      x="-140"
                      y="-24"
                      width="280"
                      height="48"
                      rx="6"
                      fill="rgb(var(--color-steel-950))"
                      stroke="rgb(var(--color-accent))"
                      strokeWidth="1.5"
                      filter="url(#cadGlow)"
                    />
                    <text
                      y="-3"
                      fill="rgb(var(--color-accent))"
                      fontSize="12"
                      fontWeight="bold"
                      fontFamily="var(--font-jetbrains-mono), monospace"
                      letterSpacing="1"
                    >
                      [ INCOMING RFQ PACKAGE ]
                    </text>
                    <text
                      y="14"
                      fill="rgb(var(--color-paper-dim))"
                      fontSize="10"
                      fontFamily="var(--font-jetbrains-mono), monospace"
                    >
                      AISC Scope · Tonnage &amp; Schedule Intake
                    </text>
                  </g>
                )}
              </g>

              {/* ------------------------------------------------------------- */}
              {/* PHASE 02+: Solid 3D Steel Beam Geometry Extrusion             */}
              {/* ------------------------------------------------------------- */}
              <g
                className="transition-all duration-700 ease-out"
                opacity={activeStep >= 1 ? 1 : 0}
                transform={activeStep >= 1 ? "scale(1)" : "scale(0.97)"}
                style={{ transformOrigin: "400px 180px" }}
              >
                {/* Center Web of W12x26 Beam */}
                <rect
                  x="140"
                  y="138"
                  width="520"
                  height="84"
                  fill="url(#steelHatch)"
                  stroke="rgb(var(--color-blueprint-light))"
                  strokeWidth="1.5"
                  className="transition-colors duration-500"
                />

                {/* Top Flange */}
                <rect
                  x="120"
                  y="118"
                  width="560"
                  height="20"
                  fill="rgb(var(--color-steel-900))"
                  stroke="rgb(var(--color-accent))"
                  strokeWidth="2"
                  rx="1"
                  filter={activeStep >= 1 ? "url(#cadGlow)" : undefined}
                />

                {/* Bottom Flange */}
                <rect
                  x="120"
                  y="222"
                  width="560"
                  height="20"
                  fill="rgb(var(--color-steel-900))"
                  stroke="rgb(var(--color-accent))"
                  strokeWidth="2"
                  rx="1"
                  filter={activeStep >= 1 ? "url(#cadGlow)" : undefined}
                />

                {/* Centerline datum axis */}
                <line
                  x1="80"
                  y1="180"
                  x2="720"
                  y2="180"
                  stroke="rgb(var(--color-paper-dim))"
                  strokeWidth="1"
                  strokeDasharray="16 4 4 4"
                  opacity="0.4"
                />
              </g>

              {/* ------------------------------------------------------------- */}
              {/* PHASE 03+: Dimensioning, Copes, Weld Notes & Connection Plate */}
              {/* ------------------------------------------------------------- */}
              <g
                className="transition-all duration-700 ease-out"
                opacity={activeStep >= 2 ? 1 : 0}
              >
                {/* Shear Connection Tab Plate (Welded to right web) */}
                <rect
                  x="630"
                  y="142"
                  width="28"
                  height="76"
                  fill="rgb(var(--color-steel-800))"
                  stroke="rgb(var(--color-blueprint-light))"
                  strokeWidth="1.5"
                  rx="2"
                />

                {/* 3 High-Strength Bolt Holes */}
                <circle cx="644" cy="158" r="5" fill="rgb(var(--color-steel-950))" stroke="rgb(var(--color-accent))" strokeWidth="1.5" />
                <circle cx="644" cy="180" r="5" fill="rgb(var(--color-steel-950))" stroke="rgb(var(--color-accent))" strokeWidth="1.5" />
                <circle cx="644" cy="202" r="5" fill="rgb(var(--color-steel-950))" stroke="rgb(var(--color-accent))" strokeWidth="1.5" />

                {/* Center cross marks on bolt holes */}
                <path d="M640 158 H648 M644 154 V162" stroke="rgb(var(--color-accent))" strokeWidth="1" />
                <path d="M640 180 H648 M644 176 V184" stroke="rgb(var(--color-accent))" strokeWidth="1" />
                <path d="M640 202 H648 M644 198 V206" stroke="rgb(var(--color-accent))" strokeWidth="1" />

                {/* Main Dimension Line along bottom */}
                <line x1="120" y1="268" x2="680" y2="268" stroke="rgb(var(--color-blueprint-light))" strokeWidth="1.5" />
                <line x1="120" y1="258" x2="120" y2="278" stroke="rgb(var(--color-blueprint-light))" strokeWidth="1.5" />
                <line x1="680" y1="258" x2="680" y2="278" stroke="rgb(var(--color-blueprint-light))" strokeWidth="1.5" />

                {/* Dimension Arrows */}
                <polygon points="120,268 132,264 132,272" fill="rgb(var(--color-blueprint-light))" />
                <polygon points="680,268 668,264 668,272" fill="rgb(var(--color-blueprint-light))" />

                {/* Dimension Label Text */}
                <rect x="330" y="258" width="140" height="20" fill="rgb(var(--color-steel-950))" />
                <text
                  x="400"
                  y="272"
                  textAnchor="middle"
                  fill="rgb(var(--color-paper))"
                  fontSize="12"
                  fontWeight="bold"
                  fontFamily="var(--font-jetbrains-mono), monospace"
                >
                  W12x26 - 20&apos;-0&quot;
                </text>

                {/* Vertical Dimension for Depth */}
                <line x1="90" y1="118" x2="90" y2="242" stroke="rgb(var(--color-blueprint-light))" strokeWidth="1" strokeDasharray="4 2" />
                <line x1="84" y1="118" x2="96" y2="118" stroke="rgb(var(--color-blueprint-light))" strokeWidth="1" />
                <line x1="84" y1="242" x2="96" y2="242" stroke="rgb(var(--color-blueprint-light))" strokeWidth="1" />
                <text
                  x="80"
                  y="184"
                  textAnchor="end"
                  fill="rgb(var(--color-paper-dim))"
                  fontSize="10"
                  fontFamily="var(--font-jetbrains-mono), monospace"
                >
                  d=12.22&quot;
                </text>

                {/* AWS A2.4 Fillet Weld Callout */}
                <g transform="translate(630, 110)">
                  <path d="M0 0 L-25 -25 H-90" fill="none" stroke="rgb(var(--color-accent))" strokeWidth="1.5" />
                  <polygon points="0,0 -8,-1 -1,-8" fill="rgb(var(--color-accent))" />
                  {/* Fillet symbol triangle */}
                  <polygon points="-65,-25 -55,-25 -65,-35" fill="none" stroke="rgb(var(--color-accent))" strokeWidth="1.5" />
                  <text
                    x="-68"
                    y="-30"
                    textAnchor="end"
                    fill="rgb(var(--color-accent))"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="var(--font-jetbrains-mono), monospace"
                  >
                    1/4
                  </text>
                  <text
                    x="-50"
                    y="-15"
                    fill="rgb(var(--color-paper-dim))"
                    fontSize="9"
                    fontFamily="var(--font-jetbrains-mono), monospace"
                  >
                    SHOP WELD (AISC)
                  </text>
                </g>
              </g>

              {/* ------------------------------------------------------------- */}
              {/* PHASE 04+: Independent QC Checking & Audit Flags             */}
              {/* ------------------------------------------------------------- */}
              <g
                className="transition-all duration-700 ease-out"
                opacity={activeStep >= 3 ? 1 : 0}
              >
                {/* Bolt Clearance Check Badge */}
                <g transform="translate(644, 82)">
                  <rect x="-45" y="-14" width="90" height="24" rx="4" fill="rgb(var(--color-steel-950))" stroke="rgb(var(--color-mark-cool))" strokeWidth="1.5" />
                  <circle cx="-30" cy="-2" r="6" fill="rgb(var(--color-mark-cool))" />
                  <path d="M-33 -2 L-31 0 L-27 -4" fill="none" stroke="white" strokeWidth="1.5" />
                  <text x="-18" y="2" fill="rgb(var(--color-mark-cool))" fontSize="9" fontWeight="bold" fontFamily="var(--font-jetbrains-mono), monospace">
                    3&quot; PITCH OK
                  </text>
                  <line x1="0" y1="10" x2="0" y2="60" stroke="rgb(var(--color-mark-cool))" strokeWidth="1" strokeDasharray="3 3" />
                </g>

                {/* Length & Camber Verification Callout */}
                <g transform="translate(260, 82)">
                  <rect x="-55" y="-14" width="110" height="24" rx="4" fill="rgb(var(--color-steel-950))" stroke="rgb(var(--color-mark-cool))" strokeWidth="1.5" />
                  <circle cx="-40" cy="-2" r="6" fill="rgb(var(--color-mark-cool))" />
                  <path d="M-43 -2 L-41 0 L-37 -4" fill="none" stroke="white" strokeWidth="1.5" />
                  <text x="-28" y="2" fill="rgb(var(--color-mark-cool))" fontSize="9" fontWeight="bold" fontFamily="var(--font-jetbrains-mono), monospace">
                    TOLERANCE ±1/16&quot;
                  </text>
                  <line x1="0" y1="10" x2="0" y2="36" stroke="rgb(var(--color-mark-cool))" strokeWidth="1" strokeDasharray="3 3" />
                </g>
              </g>

              {/* ------------------------------------------------------------- */}
              {/* PHASE 05+: Licensed PE Seal Stamp Ring (Embossed Hologram)    */}
              {/* ------------------------------------------------------------- */}
              <g
                className="transition-all duration-700 ease-out"
                opacity={activeStep >= 4 ? 1 : 0}
                transform={activeStep >= 4 ? "translate(190, 180) scale(1)" : "translate(190, 180) scale(1.4)"}
                style={{ transformOrigin: "center" }}
              >
                {/* PE Circular Stamp Container */}
                <circle r="44" fill="rgb(var(--color-steel-950))" stroke="rgb(var(--color-accent))" strokeWidth="2.5" />
                <circle r="40" fill="none" stroke="rgb(var(--color-accent))" strokeWidth="1" strokeDasharray="4 2" />
                <circle r="26" fill="none" stroke="rgb(var(--color-accent))" strokeWidth="1.5" />

                {/* Radial Stamp Text */}
                <text
                  textAnchor="middle"
                  y="-12"
                  fontSize="8"
                  fontWeight="bold"
                  fill="rgb(var(--color-accent))"
                  fontFamily="var(--font-jetbrains-mono), monospace"
                  letterSpacing="1"
                >
                  LICENSED P.E.
                </text>
                <text
                  textAnchor="middle"
                  y="5"
                  fontSize="12"
                  fontWeight="900"
                  fill="rgb(var(--color-paper))"
                  fontFamily="var(--font-jetbrains-mono), monospace"
                >
                  STAMPED
                </text>
                <text
                  textAnchor="middle"
                  y="18"
                  fontSize="7"
                  fill="rgb(var(--color-paper-dim))"
                  fontFamily="var(--font-jetbrains-mono), monospace"
                  letterSpacing="0.5"
                >
                  AISC 360-22 · VERIFIED
                </text>
              </g>

              {/* ------------------------------------------------------------- */}
              {/* PHASE 06: Final Issued-for-Fabrication Stamp & Border          */}
              {/* ------------------------------------------------------------- */}
              <g
                className="transition-all duration-700 ease-out"
                opacity={activeStep === 5 ? 1 : 0}
              >
                {/* Full Blueprint Title-Block Outer Boundary */}
                <rect
                  x="20"
                  y="16"
                  width="760"
                  height="328"
                  fill="none"
                  stroke="rgb(var(--color-accent))"
                  strokeWidth="2.5"
                  rx="6"
                  className="animate-pulse"
                />

                {/* Outer Sub-border */}
                <rect
                  x="26"
                  y="22"
                  width="748"
                  height="316"
                  fill="none"
                  stroke="rgb(var(--color-blueprint))"
                  strokeWidth="1"
                  rx="4"
                />

                {/* Bold Red/Cyan ISSUED FOR FABRICATION Stamp Badge */}
                <g transform="translate(560, 180) rotate(-12)">
                  <rect
                    x="-120"
                    y="-28"
                    width="240"
                    height="56"
                    rx="6"
                    fill="rgb(var(--color-steel-950))"
                    stroke="#ef4444"
                    strokeWidth="3"
                    strokeDasharray="14 4"
                    filter="url(#cadGlow)"
                  />
                  <text
                    y="-3"
                    textAnchor="middle"
                    fill="#ef4444"
                    fontSize="13"
                    fontWeight="900"
                    fontFamily="var(--font-jetbrains-mono), monospace"
                    letterSpacing="1.5"
                  >
                    ISSUED FOR FAB
                  </text>
                  <text
                    y="14"
                    textAnchor="middle"
                    fill="rgb(var(--color-paper))"
                    fontSize="8.5"
                    fontWeight="bold"
                    fontFamily="var(--font-jetbrains-mono), monospace"
                    letterSpacing="1"
                  >
                    RELEASED TO CNC / SHOP SAW
                  </text>
                </g>

                {/* DSTV / CNC Machine Data Code readout tag */}
                <g transform="translate(42, 316)">
                  <text
                    fill="rgb(var(--color-accent))"
                    fontSize="9"
                    fontFamily="var(--font-jetbrains-mono), monospace"
                  >
                    DSTV: W12X26_20FT.NC1 · CRC32: 0x8F4C2A1 · READY FOR DRILL LINE
                  </text>
                </g>
              </g>
            </svg>
          </div>

          {/* ===================================================================== */}
          {/* INTERACTIVE CONTROLLER: Continuous Engineering Timeline / Scrubber   */}
          {/* ===================================================================== */}
          <div className="mt-8 border-t border-blueprint/60 pt-8">
            {/* Horizontal Timeline Track */}
            <div className="relative mb-8">
              {/* Main Steel Baseline */}
              <div className="absolute top-4 sm:top-5 left-0 right-0 h-1 bg-blueprint/70 rounded-full" />

              {/* Active filled highlight beam segment */}
              <div
                className="absolute top-4 sm:top-5 left-0 h-1 bg-gradient-to-r from-accent via-accent to-mark-cool rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${(activeStep / (totalSteps - 1)) * 100}%`,
                }}
              />

              {/* 6 Interactive Milestone Phase Nodes */}
              <div className="relative flex justify-between">
                {processPhases.map((phase, idx) => {
                  const isActive = idx === activeStep;
                  const isCompleted = idx < activeStep;

                  return (
                    <button
                      key={phase.step}
                      type="button"
                      onClick={() => handleManualSelect(idx)}
                      className="group flex flex-col items-center focus:outline-none"
                      aria-label={`Select ${phase.phase} (${phase.label})`}
                    >
                      {/* Node Circle */}
                      <div
                        className={`relative flex h-8 w-8 sm:h-11 sm:w-11 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                          isActive
                            ? "border-accent bg-accent/25 scale-110 shadow-[0_0_18px_rgba(63,169,232,0.6)]"
                            : isCompleted
                            ? "border-mark-cool/70 bg-steel-900 text-mark-cool hover:scale-105"
                            : "border-blueprint bg-steel-950 text-paper-dim/60 hover:border-paper-dim hover:text-paper"
                        }`}
                      >
                        <span
                          className={`font-mono text-xs font-bold ${
                            isActive
                              ? "text-white"
                              : isCompleted
                              ? "text-mark-cool"
                              : "text-paper-dim/70 group-hover:text-paper"
                          }`}
                        >
                          {phase.step}
                        </span>

                        {/* Ping radar effect on active node */}
                        {isActive && (
                          <span className="absolute -inset-1 rounded-full border border-accent/70 animate-ping motion-reduce:hidden" />
                        )}
                      </div>

                      {/* Phase Short Tag */}
                      <span
                        className={`mt-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider transition-colors duration-200 hidden sm:block ${
                          isActive
                            ? "text-accent font-bold"
                            : isCompleted
                            ? "text-paper"
                            : "text-paper-dim/60 group-hover:text-paper-dim"
                        }`}
                      >
                        {phaseMetadata[idx].shortLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Active Phase Intelligence Card (Replaces repeated cards) */}
            <div className="rounded-xl border border-blueprint/70 bg-steel-900/40 p-6 md:p-8 backdrop-blur-xs transition-all duration-300">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-center">
                {/* Left 2 Cols: Main Phase Heading & Description */}
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-accent">
                      {currentPhase.step} // {currentPhase.phase.toUpperCase()}
                    </span>
                    <span className="text-paper-dim/40">·</span>
                    <span className="label-mono-sm text-[11px] text-paper-dim/70">
                      MILESTONE {activeStep + 1} OF 6
                    </span>
                  </div>

                  <h3 className="font-display text-2xl font-bold tracking-tight text-paper sm:text-3xl">
                    {currentPhase.label}
                  </h3>

                  <p className="mt-3 text-sm sm:text-base leading-relaxed text-paper-dim max-w-2xl">
                    {currentPhase.description}
                  </p>
                </div>

                {/* Right 1 Col: Key Technical Delivery Specs */}
                <div className="flex flex-col gap-3 rounded-lg border border-blueprint/50 bg-steel-950/60 p-4 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-blueprint/40 pb-2">
                    <span className="text-paper-dim/70 flex items-center gap-1.5">
                      <Clock size={12} className="text-accent" />
                      SPEED / SLA
                    </span>
                    <span className="font-semibold text-paper">{meta.turnaround}</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-blueprint/40 pb-2">
                    <span className="text-paper-dim/70 flex items-center gap-1.5">
                      <Layers size={12} className="text-accent" />
                      STANDARD
                    </span>
                    <span className="font-semibold text-paper text-right">{meta.standard}</span>
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-paper-dim/70 flex items-center gap-1.5">
                      <FileCheck size={12} className="text-accent" />
                      PRIMARY ASSET
                    </span>
                    <span className="font-semibold text-accent text-right truncate max-w-[150px]">
                      {meta.deliverable.split("&")[0]}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
