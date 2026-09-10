"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";

/**
 * The opening title sequence: a steel platform that falls in, lands, and bolts
 * itself together, in six beats.
 *
 *   1. members held above the frame
 *   2. gravity — they fall, tumbling, stretched by speed
 *   3. impact — a bounced landing, scattered on the ground, rings of light
 *   4. assembly — every piece flies to its place, bolts arriving last
 *   5. the finished platform, on a slow orbit
 *   6. the theme switch: steel-blue and dark, to orange and light
 *
 * Two things keep this affordable. Every mesh in the scene is one of four
 * shared geometries scaled to size, against one of five shared materials — so
 * 150-odd meshes cost four geometry uploads and five shader programs. And all
 * the per-frame work happens in a single `useFrame` on the parent that writes
 * straight onto existing object transforms, rather than sixty components each
 * running their own loop and allocating vectors.
 */

// ── Sequential Construction Timeline, in seconds ────────────────────────
// Every phase follows the logical real-world steel erection sequence:
// 1. Foundations & Anchor Bolts (0.2s - 1.0s)
// 2. Vertical Columns & Splice Plates (0.95s - 2.2s)
// 3. Level 1 Primary Framing & Deck (2.2s - 4.0s)
// 4. Level 2 Primary Framing & Deck (4.0s - 5.8s)
// 5. Vertical Diagonal Bracing & Gussets (5.6s - 6.8s)
// 6. Access Systems — Ladder & Stairs (6.5s - 8.0s)
// 7. Guardrails & Handrails (7.8s - 9.0s)
// 8. Bolt Fastener Seating & Pulse Flashes (8.8s - 9.8s)
// 9. Complete Settle, Split Reveal & Continuous Orbit (9.6s+)

// ── Structure dimensions ────────────────────────────────────────────────
/**
 * A multi-bay industrial framing facility on a 6-column engineered grid.
 *
 * Proportions are calibrated for maximum structural silhouette clarity,
 * distinct member hierarchy, and generous breathing room.
 */
const COL_W = 0.28;
const GRID_X = [-3.4, 0.0, 3.4] as const;
const GRID_Z = [-1.65, 1.65] as const;
const BEAM_D = 0.36;

const PLAT_X = 3.65;
const PLAT_Z = 1.75;
const BAY_LEN_X = 3.4;
const BAY_LEN_Z = 1.65;

/** Deck heights, bottom level first. */
const DECK_Y = 2.85;
const DECK_Y2 = 5.65;
const LEVEL_DECKS = [DECK_Y, DECK_Y2];

/** Beam centreline sits just under its deck. */
const beamYFor = (deckY: number) => deckY - 0.03 - BEAM_D / 2;
/** Column steel stops at the soffit of the upper framing. */
const COL_TOP = beamYFor(DECK_Y2) - BEAM_D / 2;

const railTopFor = (deckY: number) => deckY + 1.1;
const railMidFor = (deckY: number) => deckY + 0.58;

/**
 * Stairs, defined from their stringers outward.
 */
const STAIR_TREADS = 9;
const STRINGER_D = 0.32;
const STAIR_W = 1.28;
const STAIR_RUN_X = 2.75;
/** Treads ride this far above the stringer centre line. */
const TREAD_RISE_OFF = 0.18;
/** Where a platform guardrail returns to meet a stair rail. */
const RETURN_X = 3.6;
const STAIR_RAIL_Z = STAIR_W / 2;

type Vec3 = [number, number, number];

type Kind =
  | "wf" // wide flange I-beam
  | "hss" // square structural tube
  | "pipe" // round steel pipe
  | "channel"
  | "plate"
  | "tread"
  | "gusset" // connection plate at a brace work point
  | "rail"; // railing posts and rails — pipe, drawn in the accent colour

interface Part {
  kind: Kind;
  /** Long-axis length, or plate extents. */
  a: number;
  b: number;
  c: number;
  final: Vec3;
  finalRot: Vec3;
  /** True when the part's long axis runs along its own Y — pipes, columns. */
  axisY: boolean;
  /** Channel flanges face -Z rather than +Z. */
  flip?: boolean;
  accent?: boolean;
  // Sequential construction parameters
  startTime: number;
  duration: number;
  dropHeight: number;
}

interface Bolt {
  tc: boolean; // tension-control bolt (splined tip) vs. hex head
  final: Vec3;
  finalRot: Vec3;
  startTime: number;
  duration: number;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function clamp01(t: number): number {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

/** 6-column grid coordinates */
const COLUMNS_6: [number, number][] = [
  [-3.4, -1.65],
  [0.0, -1.65],
  [3.4, -1.65],
  [-3.4, 1.65],
  [0.0, 1.65],
  [3.4, 1.65],
];

/** A stair flight, described by where it starts and which way it runs. */
interface Flight {
  fromY: number;
  toY: number;
  /** +1 runs outboard in +X, -1 outboard in -X. */
  dir: 1 | -1;
}

/** Every member of the frame, in the exact sequence it gets erected. */
function buildParts(): { parts: Part[]; bolts: Bolt[] } {
  const parts: Part[] = [];
  const bolts: Bolt[] = [];

  // ── Stage 1: Foundations (0.15s - 0.75s) ─────────────────────────────────
  // 6 heavy base plates seat on the ground pad; 24 anchor rods drive in.
  COLUMNS_6.forEach(([gx, gz], i) => {
    parts.push({
      kind: "plate",
      a: 0.72,
      b: 0.045,
      c: 0.72,
      final: [gx, 0.022, gz],
      finalRot: [0, 0, 0],
      axisY: false,
      startTime: 0.15 + i * 0.06,
      duration: 0.45,
      dropHeight: 1.2,
    });
    let bIdx = 0;
    for (const ox of [-0.25, 0.25]) {
      for (const oz of [-0.25, 0.25]) {
        bolts.push({
          tc: false,
          final: [gx + ox, 0.11, gz + oz],
          finalRot: [0, 0, 0],
          startTime: 0.35 + i * 0.05 + bIdx * 0.02,
          duration: 0.3,
        });
        bIdx += 1;
      }
    }
  });

  // ── Stage 2: Vertical Columns & Mid-Level Splice Plates (0.75s - 1.85s) ───
  // 6 Full-height HSS columns lower smoothly along vertical axis onto base plates.
  COLUMNS_6.forEach(([gx, gz], i) => {
    parts.push({
      kind: "hss",
      a: COL_W,
      b: COL_TOP - 0.045,
      c: COL_W,
      final: [gx, (COL_TOP + 0.045) / 2, gz],
      finalRot: [0, 0, 0],
      axisY: true,
      startTime: 0.75 + i * 0.12,
      duration: 0.65,
      dropHeight: 4.5,
    });
    // Column splice / stiffener plates
    parts.push({
      kind: "plate",
      a: COL_W + 0.18,
      b: 0.032,
      c: COL_W + 0.18,
      final: [gx, DECK_Y + 0.65, gz],
      finalRot: [0, 0, 0],
      axisY: false,
      startTime: 1.25 + i * 0.07,
      duration: 0.45,
      dropHeight: 1.8,
    });
  });

  // ── Stage 3: Level 1 Primary Framing, Infill Joists & Deck (1.75s - 3.4s) ──
  const beamY1 = beamYFor(DECK_Y);

  // Longitudinal primary W-girders spanning full 2-bay length (X-axis)
  [-1.65, 1.65].forEach((gz, beamIdx) => {
    parts.push({
      kind: "wf",
      a: 7.2,
      b: BEAM_D,
      c: 0.26,
      final: [0, beamY1, gz],
      finalRot: [0, 0, 0],
      axisY: false,
      startTime: 1.75 + beamIdx * 0.18,
      duration: 0.55,
      dropHeight: 2.4,
    });
    // Moment & shear tab connection bolts at columns
    let bIdx = 0;
    for (const gx of GRID_X) {
      for (const off of [-0.2, 0.2]) {
        bolts.push({
          tc: true,
          final: [gx + off, beamY1 + BEAM_D / 2 + 0.05, gz],
          finalRot: [0, 0, 0],
          startTime: 2.1 + bIdx * 0.025,
          duration: 0.3,
        });
        bIdx += 1;
      }
    }
  });

  // Transverse primary cross-girders across Z at each column line
  GRID_X.forEach((gx, beamIdx) => {
    parts.push({
      kind: "wf",
      a: 3.3,
      b: BEAM_D,
      c: 0.24,
      final: [gx, beamY1 - 0.01, 0],
      finalRot: [0, Math.PI / 2, 0],
      axisY: false,
      startTime: 2.05 + beamIdx * 0.12,
      duration: 0.5,
      dropHeight: 2.2,
    });
  });

  // Secondary infill beams / joists spanning across Z
  [-2.25, -1.15, 1.15, 2.25].forEach((x, beamIdx) => {
    parts.push({
      kind: "wf",
      a: 3.3,
      b: 0.28,
      c: 0.18,
      final: [x, beamY1 - 0.02, 0],
      finalRot: [0, Math.PI / 2, 0],
      axisY: false,
      startTime: 2.3 + beamIdx * 0.08,
      duration: 0.48,
      dropHeight: 2.0,
    });
    [-1.65, 1.65].forEach((gz, bIdx) => {
      bolts.push({
        tc: true,
        final: [x, beamY1 - 0.02, gz > 0 ? gz - 0.15 : gz + 0.15],
        finalRot: [0, 0, Math.PI / 2],
        startTime: 2.6 + beamIdx * 0.05 + bIdx * 0.02,
        duration: 0.28,
      });
    });
  });

  // Level 1 Floor Deck Plate
  parts.push({
    kind: "plate",
    a: 7.2,
    b: 0.05,
    c: 3.5,
    final: [0, DECK_Y, 0],
    finalRot: [0, 0, 0],
    axisY: false,
    startTime: 2.85,
    duration: 0.48,
    dropHeight: 1.8,
  });

  // Perimeter channel trim / kick-plates
  [-1.75, 1.75].forEach((sz, trimIdx) => {
    parts.push({
      kind: "channel",
      a: 7.2,
      b: 0.22,
      c: 0.11,
      final: [0, DECK_Y + 0.09, sz],
      finalRot: [0, 0, 0],
      axisY: false,
      flip: sz > 0,
      startTime: 3.0 + trimIdx * 0.1,
      duration: 0.45,
      dropHeight: 1.5,
    });
  });

  // ── Stage 4: Level 2 Upper Framing, Mezzanine Deck & Open Roof Bay (3.1s - 4.8s)
  const beamY2 = beamYFor(DECK_Y2);

  // Full-length Level 2 Longitudinal Primary Girders across both bays (X-axis)
  [-1.65, 1.65].forEach((gz, beamIdx) => {
    parts.push({
      kind: "wf",
      a: 7.2,
      b: BEAM_D,
      c: 0.26,
      final: [0, beamY2, gz],
      finalRot: [0, 0, 0],
      axisY: false,
      startTime: 3.15 + beamIdx * 0.15,
      duration: 0.55,
      dropHeight: 2.4,
    });
    for (const gx of GRID_X) {
      for (const off of [-0.2, 0.2]) {
        bolts.push({
          tc: true,
          final: [gx + off, beamY2 + BEAM_D / 2 + 0.05, gz],
          finalRot: [0, 0, 0],
          startTime: 3.45 + (gx === 0 ? 0 : 0.08),
          duration: 0.3,
        });
      }
    }
  });

  // Upper Transverse Girders at all 3 column lines x = -3.4, 0.0, 3.4
  GRID_X.forEach((gx, beamIdx) => {
    parts.push({
      kind: "wf",
      a: 3.3,
      b: BEAM_D,
      c: 0.24,
      final: [gx, beamY2 - 0.01, 0],
      finalRot: [0, Math.PI / 2, 0],
      axisY: false,
      startTime: 3.35 + beamIdx * 0.1,
      duration: 0.5,
      dropHeight: 2.2,
    });
  });

  // Upper Infill Beams on Mezzanine Bay at x = 1.15, 2.25
  [1.15, 2.25].forEach((x, beamIdx) => {
    parts.push({
      kind: "wf",
      a: 3.3,
      b: 0.28,
      c: 0.18,
      final: [x, beamY2 - 0.02, 0],
      finalRot: [0, Math.PI / 2, 0],
      axisY: false,
      startTime: 3.55 + beamIdx * 0.08,
      duration: 0.48,
      dropHeight: 2.0,
    });
  });

  // Upper Mezzanine Deck Plate (covering right bay from x = 0 to 3.5)
  parts.push({
    kind: "plate",
    a: 3.7,
    b: 0.05,
    c: 3.5,
    final: [1.7, DECK_Y2, 0],
    finalRot: [0, 0, 0],
    axisY: false,
    startTime: 3.8,
    duration: 0.45,
    dropHeight: 1.8,
  });

  // Upper Perimeter Channel Trim (Right Bay)
  [-1.75, 1.75].forEach((sz, trimIdx) => {
    parts.push({
      kind: "channel",
      a: 3.7,
      b: 0.22,
      c: 0.11,
      final: [1.7, DECK_Y2 + 0.09, sz],
      finalRot: [0, 0, 0],
      axisY: false,
      flip: sz > 0,
      startTime: 3.95 + trimIdx * 0.08,
      duration: 0.45,
      dropHeight: 1.5,
    });
  });

  // Open Structural Roof Purlins on Left Bay (x = -3.4 to 0.0)
  [-1.65, -0.82, 0, 0.82, 1.65].forEach((z, purlinIdx) => {
    parts.push({
      kind: "channel",
      a: 3.7,
      b: 0.18,
      c: 0.09,
      final: [-1.7, beamY2 + 0.15, z],
      finalRot: [0, 0, 0],
      axisY: false,
      startTime: 4.05 + purlinIdx * 0.06,
      duration: 0.45,
      dropHeight: 1.6,
    });
  });

  // ── Stage 5: Vertical Chevron & X-Bracing + Chamfered Gusset Plates (4.3s - 5.6s)
  // Multi-panel chevron bracing on rear bays and X-bracing on end bays
  pushMultiBayBracing(parts, 4.3);

  // ── Stage 6: Access Systems — Stairs & Ladder (5.0s - 6.5s) ──────────────
  pushLadder(parts, bolts, 5.0);
  pushFlight(parts, bolts, { fromY: 0.01, toY: DECK_Y, dir: 1 }, 5.2);

  // ── Stage 7: Perimeter Guardrails & Handrails (5.8s - 7.2s) ──────────────
  pushMultiBayRailings(parts, 5.8);

  return { parts, bolts };
}

/**
 * Multi-bay chevron and X-bracing with engineered gusset plates.
 */
function pushMultiBayBracing(parts: Part[], baseTime: number) {
  const BRACE_R = 0.09;
  const soffitY1 = beamYFor(DECK_Y) - BEAM_D / 2;
  const apexY1 = soffitY1 - 0.1;
  const footY1 = 0.2;
  const rise1 = apexY1 - footY1;
  const halfBayX = BAY_LEN_X / 2;
  const lenChevron = Math.hypot(halfBayX, rise1);

  // 1. Rear Bay 1 Chevron (x = -1.7, z = -1.65)
  [-1, 1].forEach((dir, i) => {
    parts.push({
      kind: "gusset",
      a: 0.56,
      b: 0.48,
      c: 0.03,
      final: [-1.7 + dir * halfBayX, footY1 + 0.22, -1.65],
      finalRot: [0, 0, 0],
      axisY: false,
      flip: true,
      startTime: baseTime + i * 0.05,
      duration: 0.4,
      dropHeight: 1.4,
    });
    parts.push({
      kind: "pipe",
      a: BRACE_R,
      b: lenChevron,
      c: BRACE_R,
      final: [-1.7 + (dir * halfBayX) / 2, (apexY1 + footY1) / 2, -1.65],
      finalRot: [0, 0, dir * Math.atan2(halfBayX, rise1)],
      axisY: true,
      startTime: baseTime + 0.1 + i * 0.05,
      duration: 0.45,
      dropHeight: 1.6,
    });
  });
  parts.push({
    kind: "gusset",
    a: 0.82,
    b: 0.46,
    c: 0.03,
    final: [-1.7, soffitY1 - 0.22, -1.65],
    finalRot: [0, 0, 0],
    axisY: false,
    startTime: baseTime + 0.08,
    duration: 0.4,
    dropHeight: 1.4,
  });

  // 2. Rear Bay 2 Chevron (x = +1.7, z = -1.65)
  [-1, 1].forEach((dir, i) => {
    parts.push({
      kind: "gusset",
      a: 0.56,
      b: 0.48,
      c: 0.03,
      final: [1.7 + dir * halfBayX, footY1 + 0.22, -1.65],
      finalRot: [0, 0, 0],
      axisY: false,
      flip: true,
      startTime: baseTime + 0.15 + i * 0.05,
      duration: 0.4,
      dropHeight: 1.4,
    });
    parts.push({
      kind: "pipe",
      a: BRACE_R,
      b: lenChevron,
      c: BRACE_R,
      final: [1.7 + (dir * halfBayX) / 2, (apexY1 + footY1) / 2, -1.65],
      finalRot: [0, 0, dir * Math.atan2(halfBayX, rise1)],
      axisY: true,
      startTime: baseTime + 0.22 + i * 0.05,
      duration: 0.45,
      dropHeight: 1.6,
    });
  });
  parts.push({
    kind: "gusset",
    a: 0.82,
    b: 0.46,
    c: 0.03,
    final: [1.7, soffitY1 - 0.22, -1.65],
    finalRot: [0, 0, 0],
    axisY: false,
    startTime: baseTime + 0.2,
    duration: 0.4,
    dropHeight: 1.4,
  });

  // 3. Side End-Bay Cross Bracing at x = -3.4 (Z-axis)
  const riseZ = soffitY1 - footY1;
  const lenZ = Math.hypot(BAY_LEN_Z * 2, riseZ);
  [-1, 1].forEach((dir, i) => {
    parts.push({
      kind: "pipe",
      a: 0.075,
      b: lenZ,
      c: 0.075,
      final: [-3.4, (soffitY1 + footY1) / 2, 0],
      finalRot: [dir * Math.atan2(BAY_LEN_Z * 2, riseZ), 0, 0],
      axisY: true,
      startTime: baseTime + 0.28 + i * 0.06,
      duration: 0.45,
      dropHeight: 1.6,
    });
  });
  // Center diamond gusset plate at X-brace intersection
  parts.push({
    kind: "gusset",
    a: 0.62,
    b: 0.52,
    c: 0.03,
    final: [-3.4, (soffitY1 + footY1) / 2, 0],
    finalRot: [0, Math.PI / 2, 0],
    axisY: false,
    startTime: baseTime + 0.32,
    duration: 0.4,
    dropHeight: 1.2,
  });

  // 4. Upper Level Rear Chevron (x = +1.7, z = -1.65, Level 2)
  const soffitY2 = beamYFor(DECK_Y2) - BEAM_D / 2;
  const apexY2 = soffitY2 - 0.1;
  const footY2 = DECK_Y + 0.1;
  const rise2 = apexY2 - footY2;
  const lenChevron2 = Math.hypot(halfBayX, rise2);

  [-1, 1].forEach((dir, i) => {
    parts.push({
      kind: "pipe",
      a: BRACE_R,
      b: lenChevron2,
      c: BRACE_R,
      final: [1.7 + (dir * halfBayX) / 2, (apexY2 + footY2) / 2, -1.65],
      finalRot: [0, 0, dir * Math.atan2(halfBayX, rise2)],
      axisY: true,
      startTime: baseTime + 0.38 + i * 0.05,
      duration: 0.45,
      dropHeight: 1.6,
    });
  });
  parts.push({
    kind: "gusset",
    a: 0.78,
    b: 0.44,
    c: 0.03,
    final: [1.7, soffitY2 - 0.22, -1.65],
    finalRot: [0, 0, 0],
    axisY: false,
    startTime: baseTime + 0.35,
    duration: 0.4,
    dropHeight: 1.4,
  });
}

/**
 * Fixed vertical ladder with fall-arrest cable system.
 */
function pushLadder(parts: Part[], bolts: Bolt[], baseTime: number) {
  const LADDER_X = 0.45;
  const LADDER_Z = 1.75 + 0.36;
  const STILE_GAP = 0.48;
  const TOP = DECK_Y2 + 1.1;
  const BOTTOM = DECK_Y + 0.06;
  const height = TOP - BOTTOM;

  // Stiles
  [-1, 1].forEach((sx, i) => {
    parts.push({
      kind: "pipe",
      a: 0.052,
      b: height,
      c: 0.052,
      final: [LADDER_X + (sx * STILE_GAP) / 2, (TOP + BOTTOM) / 2, LADDER_Z],
      finalRot: [0, 0, 0],
      axisY: true,
      startTime: baseTime + i * 0.08,
      duration: 0.55,
      dropHeight: 3.0,
    });
  });

  // Rungs
  const PITCH = 0.3;
  const first = BOTTOM + 0.25;
  const rungs = Math.floor((DECK_Y2 - 0.04 - first) / PITCH);
  for (let i = 0; i <= rungs; i += 1) {
    parts.push({
      kind: "pipe",
      a: 0.03,
      b: STILE_GAP,
      c: 0.03,
      final: [LADDER_X, first + i * PITCH, LADDER_Z],
      finalRot: [0, 0, Math.PI / 2],
      axisY: true,
      startTime: baseTime + 0.2 + i * 0.02,
      duration: 0.35,
      dropHeight: 1.0,
    });
  }

  // Brackets
  [DECK_Y + 0.45, DECK_Y + 1.6, DECK_Y2 - 0.3].forEach((y, i) => {
    parts.push({
      kind: "plate",
      a: STILE_GAP + 0.18,
      b: 0.05,
      c: 0.36,
      final: [LADDER_X, y, LADDER_Z - 0.18],
      finalRot: [0, 0, 0],
      axisY: false,
      startTime: baseTime + 0.32 + i * 0.05,
      duration: 0.4,
      dropHeight: 1.0,
    });
    [-1, 1].forEach((sx, bIdx) => {
      bolts.push({
        tc: false,
        final: [LADDER_X + (sx * STILE_GAP) / 2, y + 0.06, LADDER_Z - 0.3],
        finalRot: [0, 0, 0],
        startTime: baseTime + 0.45 + i * 0.05 + bIdx * 0.02,
        duration: 0.25,
      });
    });
  });

  // Fall-arrest cable system (accent colour)
  const CABLE_Z = LADDER_Z + 0.15;
  const cableTop = TOP - 0.18;
  const cableBottom = BOTTOM + 0.34;

  [
    [cableTop, 0.32],
    [cableBottom, 0.28],
  ].forEach(([y, width], i) => {
    parts.push({
      kind: "plate",
      a: 0.16,
      b: 0.045,
      c: width,
      final: [LADDER_X, y, CABLE_Z - 0.06],
      finalRot: [0, 0, 0],
      axisY: false,
      accent: true,
      startTime: baseTime + 0.55 + i * 0.05,
      duration: 0.4,
      dropHeight: 0.9,
    });
  });

  parts.push({
    kind: "pipe",
    a: 0.014,
    b: cableTop - cableBottom,
    c: 0.014,
    final: [LADDER_X, (cableTop + cableBottom) / 2, CABLE_Z],
    finalRot: [0, 0, 0],
    axisY: true,
    accent: true,
    startTime: baseTime + 0.65,
    duration: 0.45,
    dropHeight: 1.8,
  });

  [0.3, 0.6].forEach((at, i) => {
    parts.push({
      kind: "plate",
      a: 0.1,
      b: 0.035,
      c: 0.18,
      final: [LADDER_X, cableBottom + (cableTop - cableBottom) * at, CABLE_Z - 0.05],
      finalRot: [0, 0, 0],
      axisY: false,
      accent: true,
      startTime: baseTime + 0.7 + i * 0.04,
      duration: 0.35,
      dropHeight: 0.9,
    });
  });

  parts.push({
    kind: "hss",
    a: 0.09,
    b: 0.2,
    c: 0.09,
    final: [LADDER_X, DECK_Y + 0.7, CABLE_Z],
    finalRot: [0, 0, 0],
    axisY: true,
    accent: true,
    startTime: baseTime + 0.78,
    duration: 0.35,
    dropHeight: 0.9,
  });
}

/**
 * One flight of stairs: stringers, treads, guardrails, and stanchions.
 */
function pushFlight(parts: Part[], bolts: Bolt[], flight: Flight, baseTime: number) {
  const { dir, fromY, toY } = flight;
  const topX = dir * (PLAT_X + 0.02);
  const topY = toY - TREAD_RISE_OFF;
  const botX = dir * (PLAT_X + 0.02 + STAIR_RUN_X);
  const botY = fromY + STRINGER_D / 2 + 0.01;

  const runLen = Math.hypot(botX - topX, botY - topY);
  const slope = Math.atan2(botY - topY, Math.abs(botX - topX)) * dir;
  const midX = (topX + botX) / 2;
  const midY = (topY + botY) / 2;

  // Stringers
  [-1, 1].forEach((sz, i) => {
    parts.push({
      kind: "channel",
      a: runLen,
      b: STRINGER_D,
      c: 0.1,
      final: [midX, midY, (sz * STAIR_W) / 2],
      finalRot: [0, 0, slope],
      axisY: false,
      flip: sz > 0,
      startTime: baseTime + i * 0.1,
      duration: 0.55,
      dropHeight: 2.2,
    });
    bolts.push({
      tc: false,
      final: [botX - dir * 0.14, botY - STRINGER_D / 2 + 0.08, (sz * STAIR_W) / 2],
      finalRot: [0, 0, 0],
      startTime: baseTime + 0.55 + i * 0.05,
      duration: 0.3,
    });
  });

  // Treads: bottom to top sequential placement
  for (let i = 0; i < STAIR_TREADS; i += 1) {
    const f = i / (STAIR_TREADS - 1);
    parts.push({
      kind: "tread",
      a: 0.32,
      b: 0.05,
      c: STAIR_W - 0.1,
      final: [topX + (botX - topX) * f, topY + (botY - topY) * f + TREAD_RISE_OFF, 0],
      finalRot: [0, 0, 0],
      axisY: false,
      startTime: baseTime + 0.2 + (STAIR_TREADS - 1 - i) * 0.04,
      duration: 0.4,
      dropHeight: 1.2,
    });
  }

  // Stair railings
  [-1, 1].forEach((sz, sideIdx) => {
    const rails = [
      { rise: 1.1, inset: 0, radius: 0.048 },
      { rise: 0.9, inset: 0.1, radius: 0.04 },
      { rise: 0.55, inset: 0, radius: 0.048 },
    ];
    rails.forEach((rail, rIdx) => {
      parts.push({
        kind: "rail",
        a: rail.radius,
        b: runLen,
        c: rail.radius,
        final: [midX, midY + TREAD_RISE_OFF + rail.rise, sz * (STAIR_RAIL_Z - rail.inset)],
        finalRot: [0, 0, Math.PI / 2 + slope],
        axisY: true,
        accent: true,
        startTime: baseTime + 0.6 + sideIdx * 0.08 + rIdx * 0.04,
        duration: 0.45,
        dropHeight: 1.4,
      });
    });
    [0.1, 0.5, 0.9].forEach((at, pIdx) => {
      parts.push({
        kind: "rail",
        a: 0.048,
        b: 1.12,
        c: 0.048,
        final: [topX + (botX - topX) * at, topY + (botY - topY) * at + TREAD_RISE_OFF + 0.56, sz * STAIR_RAIL_Z],
        finalRot: [0, 0, 0],
        axisY: true,
        accent: true,
        startTime: baseTime + 0.55 + sideIdx * 0.06 + pIdx * 0.03,
        duration: 0.4,
        dropHeight: 1.2,
      });
    });
  });
}

/**
 * Guardrails around the multi-bay levels.
 */
function pushMultiBayRailings(parts: Part[], baseTime: number) {
  const postH = 1.15;
  const rail = (
    final: Vec3,
    length: number,
    finalRot: Vec3,
    startTime: number,
    duration: number,
    dropHeight: number
  ): Part => ({
    kind: "rail",
    a: 0.048,
    b: length,
    c: 0.048,
    final,
    finalRot,
    axisY: true,
    accent: true,
    startTime,
    duration,
    dropHeight,
  });

  // Level 1 Railings (deckY = DECK_Y)
  const postY1 = DECK_Y + postH / 2;
  const railTop1 = railTopFor(DECK_Y);
  const railMid1 = railMidFor(DECK_Y);

  let pCount = 0;
  // Front & Back vertical posts along Level 1
  for (const sz of [-1.75, 1.75]) {
    for (const x of [-3.5, -2.3, -1.1, 0.0, 1.1, 2.3, 3.5]) {
      parts.push(rail([x, postY1, sz], postH, [0, 0, 0], baseTime + pCount * 0.02, 0.4, 1.2));
      pCount += 1;
    }
    // Stair return posts
    parts.push(rail([3.5, postY1, sz * STAIR_RAIL_Z], postH, [0, 0, 0], baseTime + pCount * 0.02, 0.4, 1.2));
    pCount += 1;
  }
  // Left end closed posts
  for (const z of [-0.85, 0.85]) {
    parts.push(rail([-3.5, postY1, z], postH, [0, 0, 0], baseTime + pCount * 0.02, 0.4, 1.2));
    pCount += 1;
  }

  // Level 1 Front and Back horizontal rails
  let rCount = 0;
  for (const sz of [-1.75, 1.75]) {
    for (const y of [railTop1, railMid1]) {
      parts.push(rail([0, y, sz], 7.0, [0, 0, Math.PI / 2], baseTime + 0.3 + rCount * 0.025, 0.45, 1.4));
      rCount += 1;
    }
  }
  // Left end rails
  for (const y of [railTop1, railMid1]) {
    parts.push(rail([-3.5, y, 0], 3.5, [Math.PI / 2, 0, 0], baseTime + 0.38 + rCount * 0.025, 0.45, 1.4));
    rCount += 1;
  }
  // Stair returns
  const returnLen = 1.75 - STAIR_RAIL_Z;
  for (const sz of [-1, 1]) {
    for (const y of [railTop1, railMid1]) {
      parts.push(
        rail([3.5, y, (sz * (1.75 + STAIR_RAIL_Z)) / 2], returnLen, [Math.PI / 2, 0, 0], baseTime + 0.42 + rCount * 0.025, 0.45, 1.4)
      );
      rCount += 1;
    }
  }

  // Level 2 Railings (deckY = DECK_Y2, spanning right bay x = 0 to 3.5)
  const postY2 = DECK_Y2 + postH / 2;
  const railTop2 = railTopFor(DECK_Y2);
  const railMid2 = railMidFor(DECK_Y2);

  for (const sz of [-1.75, 1.75]) {
    for (const x of [0.0, 1.15, 2.3, 3.5]) {
      parts.push(rail([x, postY2, sz], postH, [0, 0, 0], baseTime + 0.45 + pCount * 0.015, 0.4, 1.2));
      pCount += 1;
    }
    for (const y of [railTop2, railMid2]) {
      parts.push(rail([1.75, y, sz], 3.5, [0, 0, Math.PI / 2], baseTime + 0.55 + rCount * 0.02, 0.45, 1.4));
      rCount += 1;
    }
  }
  for (const y of [railTop2, railMid2]) {
    parts.push(rail([3.5, y, 0], 3.5, [Math.PI / 2, 0, 0], baseTime + 0.6 + rCount * 0.02, 0.45, 1.4));
    rCount += 1;
  }
}

export interface SceneTheme {
  steel: string;
  secondary: string;
  steelDark: string;
  accent: string;
  bolt: string;
  /** Ambient level — the light side is a bright studio, the dark a shop floor. */
  ambient: number;
  /** Key light strength. */
  key: number;
}

/** One member, built from shared unit geometries scaled to size. */
function PartMeshes({
  part,
  geo,
  mat,
}: {
  part: Part;
  geo: Geometries;
  mat: Materials;
}) {
  const { kind, a, b, c } = part;
  const steel = part.accent ? mat.accent : mat.steel;

  switch (kind) {
    case "wf":
      return (
        <>
          {/* Top Flange (Primary structural steel) */}
          <mesh geometry={geo.box} material={steel} position={[0, b / 2, 0]} scale={[a, 0.058, c]} />
          {/* Bottom Flange (Primary structural steel) */}
          <mesh geometry={geo.box} material={steel} position={[0, -b / 2, 0]} scale={[a, 0.058, c]} />
          {/* Central Web (uses darker core material for structural depth) */}
          <mesh geometry={geo.box} material={mat.dark} scale={[a, b, 0.038]} />
        </>
      );
    case "hss":
      return (
        <>
          {/* Column Outer Walls (Primary structural steel) */}
          <mesh geometry={geo.box} material={steel} scale={[a, b, c]} />
          {/* A darker inset on the end reads as the hollow tube wall profile. */}
          <mesh
            geometry={geo.box}
            material={mat.dark}
            position={[0, b / 2 + 0.002, 0]}
            scale={[a * 0.64, 0.012, c * 0.64]}
          />
        </>
      );
    case "pipe":
      return (
        <mesh
          geometry={geo.cyl}
          material={part.accent ? mat.accent : mat.secondary}
          scale={[a, b, c]}
        />
      );
    case "rail":
      return <mesh geometry={geo.cyl} material={mat.accent} scale={[a, b, c]} />;
    case "channel":
      return (
        <>
          {/* Secondary channel body (Purlins, Kickplates) */}
          <mesh geometry={geo.box} material={mat.secondary} scale={[a, b, 0.042]} />
          <mesh
            geometry={geo.box}
            material={mat.secondary}
            position={[0, b / 2 - 0.03, (part.flip ? -1 : 1) * (c / 2)]}
            scale={[a, 0.065, c]}
          />
          <mesh
            geometry={geo.box}
            material={mat.secondary}
            position={[0, -(b / 2 - 0.03), (part.flip ? -1 : 1) * (c / 2)]}
            scale={[a, 0.065, c]}
          />
        </>
      );
    case "gusset":
      return (
        <mesh
          geometry={geo.gusset}
          material={mat.secondary}
          scale={[a, part.flip ? -b : b, c]}
        />
      );
    case "tread":
      return (
        <>
          {/* Step body */}
          <mesh geometry={geo.box} material={mat.secondary} scale={[a, b, c]} />
          {/* High-visibility safety nosing on the leading step edge */}
          <mesh
            geometry={geo.box}
            material={mat.accent}
            position={[a / 2 - 0.025, b / 2, 0]}
            scale={[0.055, 0.024, c]}
          />
        </>
      );
    case "plate":
    default:
      return <mesh geometry={geo.box} material={part.accent ? mat.accent : mat.secondary} scale={[a, b, c]} />;
  }
}

function BoltMeshes({ tc, geo, mat }: { tc: boolean; geo: Geometries; mat: Materials }) {
  return (
    <>
      {/* Washer plate */}
      <mesh geometry={geo.cyl} material={mat.bolt} position={[0, 0.016, 0]} scale={[0.082, 0.022, 0.082]} />
      {/* Heavy Hex Head */}
      <mesh geometry={geo.hex} material={mat.bolt} position={[0, 0.068, 0]} scale={[0.062, 0.058, 0.062]} />
      {/* Bolt Shank */}
      <mesh geometry={geo.cyl} material={mat.bolt} position={[0, -0.045, 0]} scale={[0.036, 0.17, 0.036]} />
      {tc && (
        // Splined tip on tension-control (TC) bolts
        <mesh
          geometry={geo.cyl}
          material={mat.bolt}
          position={[0, -0.142, 0]}
          scale={[0.026, 0.058, 0.026]}
        />
      )}
    </>
  );
}

/**
 * A connection plate: rectangular where it bolts to the steel, tapering to a
 * clipped point where the brace lands. Built once as a unit shape with subtle
 * chamfer bevels for a manufactured, premium look.
 */
function gussetGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.5, 0.5);
  shape.lineTo(0.5, 0.5);
  shape.lineTo(0.32, -0.34);
  shape.lineTo(0.16, -0.5);
  shape.lineTo(-0.16, -0.5);
  shape.lineTo(-0.32, -0.34);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 1,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.018,
    bevelSegments: 3,
  });
  geometry.translate(0, 0, -0.5);
  return geometry;
}

interface Geometries {
  box: THREE.BoxGeometry;
  gusset: THREE.ExtrudeGeometry;
  cyl: THREE.CylinderGeometry;
  hex: THREE.CylinderGeometry;
  sphere: THREE.SphereGeometry;
  ring: THREE.RingGeometry;
}

interface Materials {
  steel: THREE.MeshStandardMaterial;
  secondary: THREE.MeshStandardMaterial;
  dark: THREE.MeshStandardMaterial;
  accent: THREE.MeshStandardMaterial;
  bolt: THREE.MeshStandardMaterial;
  glow: THREE.MeshBasicMaterial;
}

function Assembly({
  startRef,
  splitRef,
  shadowOpacityRef,
  matRef,
  onComplete,
}: {
  startRef: React.MutableRefObject<number>;
  /** Fraction of the viewport width still rendered in the dark palette. */
  splitRef: React.MutableRefObject<number>;
  shadowOpacityRef: React.MutableRefObject<number>;
  matRef: React.MutableRefObject<Materials | null>;
  onComplete: () => void;
}) {
  const { parts, bolts } = useMemo(buildParts, []);

  const completeAt = useMemo(() => {
    const maxPart = Math.max(...parts.map((p) => p.startTime + p.duration));
    const maxBolt = Math.max(...bolts.map((b) => b.startTime + b.duration));
    return Math.max(maxPart, maxBolt) + 0.8;
  }, [parts, bolts]);

  const geo = useMemo<Geometries>(
    () => ({
      box: new THREE.BoxGeometry(1, 1, 1),
      gusset: gussetGeometry(),
      cyl: new THREE.CylinderGeometry(1, 1, 1, 32),
      hex: new THREE.CylinderGeometry(1, 1, 1, 6),
      sphere: new THREE.SphereGeometry(1, 24, 16),
      ring: new THREE.RingGeometry(0.82, 1, 48),
    }),
    []
  );

  const mat = useMemo<Materials>(
    () => ({
      steel: new THREE.MeshStandardMaterial({
        color: "#94A1B0",
        metalness: 0.46,
        roughness: 0.26,
        envMapIntensity: 1.6,
      }),
      secondary: new THREE.MeshStandardMaterial({
        color: "#626F7D",
        metalness: 0.35,
        roughness: 0.46,
        envMapIntensity: 1.1,
      }),
      dark: new THREE.MeshStandardMaterial({
        color: "#48535E",
        metalness: 0.52,
        roughness: 0.38,
        envMapIntensity: 1.3,
      }),
      accent: new THREE.MeshStandardMaterial({
        color: "#38BDF8",
        metalness: 0.28,
        roughness: 0.25,
        envMapIntensity: 1.45,
      }),
      bolt: new THREE.MeshStandardMaterial({
        color: "#E2EDF8",
        metalness: 0.96,
        roughness: 0.16,
        envMapIntensity: 2.5,
      }),
      glow: new THREE.MeshBasicMaterial({
        color: "#38BDF8",
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    }),
    []
  );

  const groups = useRef<(THREE.Group | null)[]>([]);
  const glows = useRef<(THREE.Mesh | null)[]>([]);

  useEffect(() => {
    return () => {
      Object.values(geo).forEach((item) => item.dispose());
      Object.values(mat).forEach((item) => item.dispose());
    };
  }, [geo, mat]);

  // The split renderer needs these to swap palettes between passes.
  matRef.current = mat;

  const fired = useRef(false);
  const { camera } = useThree();
  const lookAt = useMemo(() => new THREE.Vector3(0.18, 3.25, 0), []);

  useFrame((state) => {
    if (startRef.current === 0) startRef.current = state.clock.elapsedTime;
    const t = state.clock.elapsedTime - startRef.current;

    // ── 1. Sequential Member Construction Loop ─────────────────────────────
    for (let i = 0; i < parts.length; i += 1) {
      const group = groups.current[i];
      if (!group) continue;
      const part = parts[i];
      const { startTime, duration, dropHeight, final, finalRot } = part;

      if (t < startTime) {
        group.position.set(final[0], final[1] + dropHeight, final[2]);
        group.rotation.set(finalRot[0], finalRot[1], finalRot[2]);
        group.scale.set(0, 0, 0);
        continue;
      }

      const p = clamp01((t - startTime) / duration);
      const ease = easeOutCubic(p);

      if (p < 1) {
        const currentY = final[1] + (1 - ease) * dropHeight;
        group.position.set(final[0], currentY, final[2]);
        group.rotation.set(finalRot[0], finalRot[1], finalRot[2]);
        const scale = Math.min(1, easeOutCubic(p * 1.8));
        group.scale.set(scale, scale, scale);
      } else {
        group.position.set(final[0], final[1], final[2]);
        group.rotation.set(finalRot[0], finalRot[1], finalRot[2]);
        group.scale.set(1, 1, 1);
      }
    }

    // ── 2. Sequential Fastener & Bolt Erection ─────────────────────────────
    for (let i = 0; i < bolts.length; i += 1) {
      const group = groups.current[parts.length + i];
      if (!group) continue;
      const bolt = bolts[i];
      const { startTime, duration, final, finalRot } = bolt;

      if (t < startTime) {
        group.position.set(final[0], final[1] + 0.35, final[2]);
        group.rotation.set(finalRot[0], finalRot[1], finalRot[2]);
        group.scale.set(0, 0, 0);
        continue;
      }

      const p = clamp01((t - startTime) / duration);
      const ease = easeOutCubic(p);

      if (p < 1) {
        const currentY = final[1] + (1 - ease) * 0.35;
        group.position.set(final[0], currentY, final[2]);
        group.rotation.set(finalRot[0], finalRot[1], finalRot[2]);
        const scale = Math.min(1, easeOutCubic(p * 2.0));
        group.scale.set(scale, scale, scale);
      } else {
        group.position.set(final[0], final[1], final[2]);
        group.rotation.set(finalRot[0], finalRot[1], finalRot[2]);
        group.scale.set(1, 1, 1);
      }
    }

    // ── 3. Connection Indicators & Seating Highlights ──────────────────────
    for (let i = 0; i < bolts.length; i += 1) {
      const glow = glows.current[i];
      if (!glow) continue;
      const bolt = bolts[i];
      const seatedT = (t - (bolt.startTime + bolt.duration)) / 0.35;
      if (seatedT < 0) {
        glow.scale.setScalar(0);
      } else if (seatedT < 1) {
        glow.scale.setScalar((1 - Math.abs(seatedT - 0.25) / 0.75) * 0.18 + 0.03);
      } else {
        glow.scale.setScalar(0.03 + Math.sin(t * 2.2 + i) * 0.012);
      }
    }

    // ── 4. Dynamic Camera Choreography & Framing ───────────────────────────
    const aspect = state.size.width / Math.max(1, state.size.height);
    // Responsive scaling ensures the full model is framed with breathing room on all screens
    const aspectFactor = aspect < 0.8 ? Math.max(1.36, 1.10 / aspect) : aspect < 1.2 ? 1.20 : 1.0;

    const settleT = clamp01(t / completeAt);
    const ease = easeInOutCubic(settleT);
    
    // Contact shadow fades in smoothly with structural foundation placement
    const shadowT = clamp01((t - 0.6) / (completeAt - 0.6));
    shadowOpacityRef.current = easeInOutCubic(shadowT);

    // Fixed steady camera framing so the animation runs strictly in-place on the right side
    const orbit = 1.00;
    const radius = 17.0 * aspectFactor;
    const height = 7.2 * aspectFactor;

    // Subtle pointer parallax for gentle organic depth
    const parallaxY = state.pointer.y * 0.15;
    const parallaxX = state.pointer.x * 0.15;
    camera.position.set(
      Math.cos(orbit) * radius + parallaxX,
      height + parallaxY,
      Math.sin(orbit) * radius
    );
    lookAt.set(0.25, 2.95, 0);
    camera.lookAt(lookAt);

    // ── 5. Split Theme Reveal Wipe ─────────────────────────────────────────
    const sweep = clamp01((t - (completeAt - 1.2)) / 1.6);
    splitRef.current = 1 - 0.5 * easeInOutCubic(sweep);

    if (!fired.current && t >= completeAt) {
      fired.current = true;
      onComplete();
    }
  });

  return (
    <group>
      {parts.map((part, i) => (
        <group
          key={`part-${i}`}
          ref={(node) => {
            groups.current[i] = node;
          }}
        >
          <PartMeshes part={part} geo={geo} mat={mat} />
        </group>
      ))}

      {bolts.map((bolt, i) => (
        <group
          key={`bolt-${i}`}
          ref={(node) => {
            groups.current[parts.length + i] = node;
          }}
        >
          <BoltMeshes tc={bolt.tc} geo={geo} mat={mat} />
        </group>
      ))}

      {bolts.map((bolt, i) => (
        <mesh
          key={`glow-${i}`}
          ref={(node) => {
            glows.current[i] = node;
          }}
          geometry={geo.sphere}
          material={mat.glow}
          position={bolt.final}
          scale={0}
        />
      ))}
    </group>
  );
}

/**
 * Procedural Soft Contact Shadows:
 * Replaces noisy screen-space quads with a smooth diffuse ambient occlusion
 * footprint and localized base-plate contact pools.
 */
function StructureShadows({
  shadowOpacityRef,
}: {
  shadowOpacityRef: React.MutableRefObject<number>;
}) {
  const { shadowTexture, spotTexture } = useMemo(() => {
    // 1. Diffuse soft oval shadow for the overall frame + stairs
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
      grad.addColorStop(0, "rgba(0, 0, 0, 0.44)");
      grad.addColorStop(0.3, "rgba(0, 0, 0, 0.28)");
      grad.addColorStop(0.6, "rgba(0, 0, 0, 0.09)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);
    }
    const shadowTexture = new THREE.CanvasTexture(canvas);

    // 2. Focused contact spot for column base plates and stair shoe
    const spotCanvas = document.createElement("canvas");
    spotCanvas.width = 256;
    spotCanvas.height = 256;
    const spotCtx = spotCanvas.getContext("2d");
    if (spotCtx) {
      const spotGrad = spotCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
      spotGrad.addColorStop(0, "rgba(0, 0, 0, 0.58)");
      spotGrad.addColorStop(0.35, "rgba(0, 0, 0, 0.34)");
      spotGrad.addColorStop(0.7, "rgba(0, 0, 0, 0.08)");
      spotGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      spotCtx.fillStyle = spotGrad;
      spotCtx.fillRect(0, 0, 256, 256);
    }
    const spotTexture = new THREE.CanvasTexture(spotCanvas);

    return { shadowTexture, spotTexture };
  }, []);

  const planeGeo = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  const mainMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.NormalBlending,
      }),
    [shadowTexture]
  );
  const spotMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: spotTexture,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.NormalBlending,
      }),
    [spotTexture]
  );

  useEffect(() => {
    return () => {
      shadowTexture.dispose();
      spotTexture.dispose();
      planeGeo.dispose();
      mainMat.dispose();
      spotMat.dispose();
    };
  }, [shadowTexture, spotTexture, planeGeo, mainMat, spotMat]);

  useFrame(() => {
    const opacity = shadowOpacityRef.current;
    mainMat.opacity = opacity * 0.45;
    spotMat.opacity = opacity * 0.65;
  });

  return (
    <group position={[0, 0.003, 0]}>
      {/* Main footprint soft ambient occlusion */}
      <mesh
        geometry={planeGeo}
        material={mainMat}
        position={[0.2, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[10.8, 5.8, 1]}
      />
      {/* Stair run diffuse shadow */}
      <mesh
        geometry={planeGeo}
        material={mainMat}
        position={[5.1, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[3.6, 2.4, 1]}
      />
      {/* Individual column base plate contact spots (6 columns) */}
      {COLUMNS_6.map(([gx, gz], i) => (
        <mesh
          key={`col-spot-${i}`}
          geometry={planeGeo}
          material={spotMat}
          position={[gx, 0.001, gz]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[1.2, 1.2, 1]}
        />
      ))}
      {/* Stair shoe contact spot */}
      <mesh
        geometry={planeGeo}
        material={spotMat}
        position={[6.4, 0.001, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[1.4, 1.5, 1]}
      />
    </group>
  );
}

interface LightRig {
  key: THREE.DirectionalLight | null;
  rim: THREE.DirectionalLight | null;
  fill: THREE.DirectionalLight | null;
  bounce: THREE.DirectionalLight | null;
  ambient: THREE.AmbientLight | null;
}

/**
 * Renders the scene twice per frame, once per palette, each pass scissored to
 * its half of the canvas.
 */
function SplitRender({
  dark,
  light,
  splitRef,
  matRef,
  lights,
}: {
  dark: SceneTheme;
  light: SceneTheme;
  splitRef: React.MutableRefObject<number>;
  matRef: React.MutableRefObject<Materials | null>;
  lights: React.MutableRefObject<LightRig>;
}) {
  const { gl, scene, camera } = useThree();
  const size = useMemo(() => new THREE.Vector2(), []);

  useFrame(() => {
    const mat = matRef.current;
    if (!mat) return;

    const apply = (palette: SceneTheme, isLightPass: boolean) => {
      mat.steel.color.set(palette.steel);
      mat.secondary.color.set(palette.secondary);
      mat.dark.color.set(palette.steelDark);
      mat.accent.color.set(palette.accent);
      mat.bolt.color.set(palette.bolt);
      mat.glow.color.set(palette.accent);

      const rig = lights.current;
      if (rig.rim) {
        rig.rim.color.set(palette.accent);
        rig.rim.intensity = 1.7;
      }
      if (rig.fill) {
        rig.fill.color.set(isLightPass ? "#FFFFFF" : "#A8CBFF");
        rig.fill.intensity = isLightPass ? 0.95 : 0.7;
      }
      if (rig.bounce) {
        rig.bounce.color.set(palette.accent);
        rig.bounce.intensity = 0.38;
      }
      if (rig.ambient) rig.ambient.intensity = palette.ambient;
      if (rig.key) {
        rig.key.intensity = palette.key;
        rig.key.color.set(isLightPass ? "#FFFFFF" : "#FFF8F0");
      }
    };

    gl.getDrawingBufferSize(size);
    const width = Math.round(size.x);
    const height = Math.round(size.y);
    const seam = Math.round(width * splitRef.current);

    gl.autoClear = false;
    gl.setScissorTest(true);

    if (seam > 0) {
      apply(dark, false);
      gl.setScissor(0, 0, seam, height);
      gl.clear(true, true, true);
      gl.render(scene, camera);
    }
    if (seam < width) {
      apply(light, true);
      gl.setScissor(seam, 0, width - seam, height);
      gl.clear(true, true, true);
      gl.render(scene, camera);
    }

    gl.setScissorTest(false);
  }, 1);

  return null;
}

/**
 * Caps the device pixel ratio.
 */
function AdaptiveDpr() {
  const setDpr = useThree((state) => state.setDpr);
  useEffect(() => {
    setDpr(Math.min(window.devicePixelRatio, 1.4));
  }, [setDpr]);
  return null;
}


/**
 * Smooth in-place turntable rotation around the structure's geometric center.
 * Keeps the model rotating continuously strictly in the right half of the viewport.
 */
function TurntablePlatform({
  children,
  startRef,
}: {
  children: React.ReactNode;
  startRef: React.MutableRefObject<number>;
}) {
  const rotRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!rotRef.current) return;
    const t = startRef.current > 0 ? state.clock.elapsedTime - startRef.current : 0;
    if (t > 1.2) {
      const rotProgress = (t - 1.2) * 0.18;
      rotRef.current.rotation.y = rotProgress;
    }
  });

  return (
    <group position={[5.0, 0, -1.65]}>
      {/* Pivot around structural center [1.5, 0, 0] */}
      <group position={[1.5, 0, 0]}>
        <group ref={rotRef} position={[-1.5, 0, 0]}>
          {children}
        </group>
      </group>
    </group>
  );
}

export default function SteelAssemblyScene({
  dark,
  light,
  splitEnabled,
  singlePalette,
  runKey,
  onComplete,
}: {
  dark: SceneTheme;
  light: SceneTheme;
  /** False on narrow viewports, where a split has no room to read. */
  splitEnabled: boolean;
  /** Which palette to use when the split is off. */
  singlePalette: "dark" | "light";
  /** Changing this restarts the sequence from frame 1. */
  runKey: number;
  onComplete: () => void;
}) {
  const startRef = useRef(0);
  // 1 = entirely dark; 0.5 = an even split; 0 = entirely light.
  const splitRef = useRef(1);
  const shadowOpacityRef = useRef(0);
  const matRef = useRef<Materials | null>(null);
  const lights = useRef<LightRig>({ key: null, rim: null, fill: null, bounce: null, ambient: null });

  // The Canvas remounts on runKey, so its clock restarts at zero
  const lastRun = useRef(runKey);
  if (lastRun.current !== runKey) {
    lastRun.current = runKey;
    startRef.current = 0;
    splitRef.current = 1;
    shadowOpacityRef.current = 0;
  }

  return (
    <Canvas
      key={runKey}
      camera={{ position: [5.5, 8.5, 16.5], fov: 40, near: 0.1, far: 140 }}
      dpr={[1, 1.4]}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: true }}
      frameloop="always"
    >
      <AdaptiveDpr />

      {/* Modern 3-Point + Bounce Lighting Rig */}
      <ambientLight
        ref={(node) => {
          lights.current.ambient = node;
        }}
        intensity={dark.ambient}
      />
      {/* Key light: high-angle warm illumination creating crisp cast shadows */}
      <directionalLight
        ref={(node) => {
          lights.current.key = node;
        }}
        position={[9, 15, 8]}
        intensity={dark.key}
        color="#FFF8F0"
      />
      {/* Rim light: sharp back-angle accent providing edge highlights on structural profiles */}
      <directionalLight
        ref={(node) => {
          lights.current.rim = node;
        }}
        position={[-11, 9, -9]}
        intensity={1.7}
        color={dark.accent}
      />
      {/* Fill light: cool ambient reflection filling shadow crevices */}
      <directionalLight
        ref={(node) => {
          lights.current.fill = node;
        }}
        position={[-7, 5, 9]}
        intensity={0.7}
        color="#A8CBFF"
      />
      {/* Ground bounce: subtle upward reflection */}
      <directionalLight
        ref={(node) => {
          lights.current.bounce = node;
        }}
        position={[3, -5, 3.5]}
        intensity={0.38}
        color={dark.accent}
      />

      <Suspense fallback={null}>
        {/*
          Lightformers provide crisp realistic specular ribbons across steel I-beam
          flanges and railings without external CDN HDR dependencies (fully CSP compliant).
        */}
        <Environment resolution={256} frames={1}>
          <Lightformer
            form="rect"
            intensity={6.8}
            color="#FFF6EA"
            position={[7, 11, 6]}
            scale={[15, 15, 1]}
            target={[0, 3, 0]}
          />
          <Lightformer
            form="rect"
            intensity={3.5}
            color="#A3CAFF"
            position={[-10, 5, -8]}
            scale={[13, 10, 1]}
            target={[0, 3, 0]}
          />
          <Lightformer
            form="rect"
            intensity={4.8}
            color={dark.accent}
            position={[0, -2, 10]}
            scale={[11, 2.5, 1]}
            target={[0, 3, 0]}
          />
          <Lightformer
            form="ring"
            intensity={2.8}
            color="#FFFFFF"
            position={[0, 15, 0]}
            scale={18}
            target={[0, 3, 0]}
          />
        </Environment>

        <TurntablePlatform startRef={startRef}>
          <Assembly
            startRef={startRef}
            splitRef={splitRef}
            shadowOpacityRef={shadowOpacityRef}
            matRef={matRef}
            onComplete={onComplete}
          />

          <StructureShadows shadowOpacityRef={shadowOpacityRef} />
        </TurntablePlatform>
      </Suspense>

      <SplitRender
        dark={dark}
        light={light}
        splitRef={splitEnabled ? splitRef : { current: singlePalette === "dark" ? 1 : 0 }}
        matRef={matRef}
        lights={lights}
      />
    </Canvas>
  );
}
