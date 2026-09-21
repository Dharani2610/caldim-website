"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import type { DetailTier } from "./useWebGL";

/**
 * Procedural Dual-Wing Multi-Story Structural Steel Complex Assembly Scene.
 *
 * Engineering Features:
 * - Dual connected structures: Building A (East Stair Spine Tower) & Building B (West Wing)
 * - Multi-level structural link bridges connecting both wings at intermediate floor levels
 * - Incremental floor-by-floor column lift erection (columns grow upward story by story)
 * - Precision architectural stairflights: exact 200mm risers and 260mm goings with zero overlap
 * - High visual hierarchy: bold primary W-girders & HSS columns vs. secondary joists, purlins, gussets
 * - Dynamic hardware capability tiering ("full" vs "reduced" for mobile performance)
 * - Fastener seating pulse highlights & soft contact ambient occlusion
 */

// ── Structure Dimensions & Elevations ────────────────────────────────────
const COL_W = 0.28;
const BEAM_D = 0.44;
const BAY_X = 3.2;
const BAY_Z = 3.2;

/** Deck heights for 5 levels (ground = 0) */
const DECK_LEVELS = [2.4, 4.8, 7.2, 9.6, 12.0] as const;
const DECK_LEVELS_REDUCED = [2.6, 5.2, 7.8, 10.4] as const;

/** Beam centreline sits just below deck plate */
const beamYFor = (deckY: number) => deckY - 0.025 - BEAM_D / 2;
const railTopFor = (deckY: number) => deckY + 1.05;
const railMidFor = (deckY: number) => deckY + 0.55;

/** Staircase engineering constants */
const STRINGER_D = 0.26;
const STAIR_W = 1.15;
const TREAD_GOING = 0.26; // 260mm standard tread depth
const TREAD_THICKNESS = 0.045;

type Vec3 = [number, number, number];

type Kind =
  | "wf" // Wide flange W-shape girder
  | "hss" // Hollow structural section column
  | "pipe" // Round steel pipe (bracing, cables)
  | "channel" // C-channel (purlins, kickplates, stringers)
  | "plate" // Steel deck & base plates
  | "tread" // Precision stair tread with safety nosing
  | "gusset" // Chamfered connection gusset plate
  | "rail"; // Safety guardrail / handrail

interface Part {
  kind: Kind;
  a: number;
  b: number;
  c: number;
  final: Vec3;
  finalRot: Vec3;
  axisY: boolean;
  flip?: boolean;
  accent?: boolean;
  startTime: number;
  duration: number;
  dropHeight: number;
}

interface Bolt {
  tc: boolean;
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

/** 10-column foundation grid coordinates across both buildings */
const COLUMN_GRID_10: [number, number][] = [
  // West Wing (Building B)
  [-6.4, -1.6],
  [-3.2, -1.6],
  // Shared Central Spine Line
  [0.0, -1.6],
  // East Tower (Building A)
  [3.2, -1.6],
  [6.4, -1.6],

  // Front Grid Line (Z = +1.6)
  [-6.4, 1.6],
  [-3.2, 1.6],
  [0.0, 1.6],
  [3.2, 1.6],
  [6.4, 1.6],
];

interface FlightConfig {
  fromY: number;
  toY: number;
  startX: number;
  endX: number;
  z: number;
  isReduced?: boolean;
}

/**
 * Builds the structural parts and bolts for the dual-wing building complex.
 */
function buildComplex(tier: DetailTier): { parts: Part[]; bolts: Bolt[] } {
  const parts: Part[] = [];
  const bolts: Bolt[] = [];
  const isReduced = tier === "reduced";
  const decks = isReduced ? DECK_LEVELS_REDUCED : DECK_LEVELS;
  const numFloors = decks.length;

  // Active columns (streamlined on reduced tier)
  const activeCols = isReduced
    ? COLUMN_GRID_10.filter(([x]) => x >= -3.2) // 6 columns on reduced mobile
    : COLUMN_GRID_10; // 10 columns for dual-wing full tier

  // ── Stage 1: Foundations & Anchor Rods (0.15s - 0.75s) ───────────────────
  activeCols.forEach(([gx, gz], i) => {
    // Heavy ground base plate
    parts.push({
      kind: "plate",
      a: 0.68,
      b: 0.045,
      c: 0.68,
      final: [gx, 0.022, gz],
      finalRot: [0, 0, 0],
      axisY: false,
      startTime: 0.15 + i * 0.04,
      duration: 0.42,
      dropHeight: 1.2,
    });

    // 4 Anchor bolts per column
    let bIdx = 0;
    for (const ox of [-0.22, 0.22]) {
      for (const oz of [-0.22, 0.22]) {
        if (isReduced && (ox < 0 && oz < 0)) continue;
        bolts.push({
          tc: false,
          final: [gx + ox, 0.1, gz + oz],
          finalRot: [0, 0, 0],
          startTime: 0.3 + i * 0.03 + bIdx * 0.015,
          duration: 0.26,
        });
        bIdx += 1;
      }
    }
  });

  // ── Stage 2 to 6: Incremental Floor-by-Floor Construction (1.2s - 8.2s) ──
  // Each floor story erects sequentially:
  // 1. That floor's column lift segments (story height)
  // 2. Primary W-girders & transverse cross beams
  // 3. Secondary infill joists & link bridges
  // 4. Floor deck plates & perimeter kickplates
  // 5. Connecting precision staircase flight for that tier
  decks.forEach((deckY, floorIdx) => {
    const isGroundTier = floorIdx === 0;
    const isTopFloor = floorIdx === numFloors - 1;
    const prevDeckY = isGroundTier ? 0.045 : decks[floorIdx - 1];
    const floorStartTime = 1.0 + floorIdx * 1.35;
    const beamY = beamYFor(deckY);
    const colLiftHeight = deckY - prevDeckY;

    // 1. Column Lift Segments for this floor (Incremental Story Lifts)
    activeCols.forEach(([gx, gz], cIdx) => {
      // Top floor on West Wing has setback terrace
      if (isTopFloor && !isReduced && gx < -3.2) return;

      parts.push({
        kind: "hss",
        a: COL_W,
        b: colLiftHeight,
        c: COL_W,
        final: [gx, prevDeckY + colLiftHeight / 2, gz],
        finalRot: [0, 0, 0],
        axisY: true,
        startTime: floorStartTime + cIdx * 0.03,
        duration: 0.52,
        dropHeight: 2.8,
      });

      // Splice plates at story joints
      if (!isGroundTier) {
        parts.push({
          kind: "plate",
          a: COL_W + 0.12,
          b: 0.028,
          c: COL_W + 0.12,
          final: [gx, prevDeckY + 0.02, gz],
          finalRot: [0, 0, 0],
          axisY: false,
          startTime: floorStartTime + 0.15 + cIdx * 0.02,
          duration: 0.35,
          dropHeight: 1.0,
        });
      }
    });

    // 2. Primary Longitudinal Girders (East Tower & West Wing)
    const wings = isReduced
      ? [{ name: "East", minX: 0.0, maxX: 6.4, midX: 3.2, len: 6.6 }]
      : [
        { name: "East", minX: 0.0, maxX: 6.4, midX: 3.2, len: 6.6 },
        {
          name: "West",
          minX: isTopFloor ? -3.2 : -6.4,
          maxX: 0.0,
          midX: isTopFloor ? -1.6 : -3.2,
          len: isTopFloor ? 3.4 : 6.6,
        },
      ];

    wings.forEach((wing, wIdx) => {
      [-1.6, 1.6].forEach((gz, sideIdx) => {
        parts.push({
          kind: "wf",
          a: wing.len,
          b: BEAM_D,
          c: 0.24,
          final: [wing.midX, beamY, gz],
          finalRot: [0, 0, 0],
          axisY: false,
          startTime: floorStartTime + 0.22 + (wIdx * 2 + sideIdx) * 0.08,
          duration: 0.48,
          dropHeight: 2.0,
        });

        // Connection bolts at column intersections
        const colPoints = wing.name === "East"
          ? [0.0, 3.2, 6.4]
          : isTopFloor ? [-3.2, 0.0] : [-6.4, -3.2, 0.0];

        colPoints.forEach((cx, cxIdx) => {
          for (const off of [-0.16, 0.16]) {
            bolts.push({
              tc: true,
              final: [cx + off, beamY + BEAM_D / 2 + 0.04, gz],
              finalRot: [0, 0, 0],
              startTime: floorStartTime + 0.4 + cxIdx * 0.03,
              duration: 0.24,
            });
          }
        });
      });

      // Transverse Girders at each column line
      const colXLines = wing.name === "East"
        ? [0.0, 3.2, 6.4]
        : isTopFloor ? [-3.2] : [-6.4, -3.2];

      colXLines.forEach((cx, gIdx) => {
        // High-capacity deep W-beam profiles on highlighted exterior front-edge framing (cx === 6.4)
        const isFrontEdge = cx === 6.4;
        const isExterior = cx === 6.4 || cx === -6.4;
        const beamLength = isFrontEdge ? 4.10 : 3.10; // +32.2% length/span on the 5 front-edge beams
        const beamDepth = isFrontEdge ? 0.68 : (isExterior ? 0.54 : 0.44); // +25.9% web depth
        const flangeWidth = isFrontEdge ? 0.50 : (isExterior ? 0.38 : 0.28); // +31.6% flange width

        parts.push({
          kind: "wf",
          a: beamLength,
          b: beamDepth,
          c: flangeWidth,
          final: [cx, beamY - 0.01, 0],
          finalRot: [0, Math.PI / 2, 0],
          axisY: false,
          startTime: floorStartTime + 0.32 + gIdx * 0.06,
          duration: 0.46,
          dropHeight: 1.8,
        });
      });

      // Secondary Infill Joists
      const joistX = wing.name === "East"
        ? (isReduced ? [1.6, 4.8] : [1.05, 2.15, 4.25, 5.35])
        : (isTopFloor ? [-1.6] : [-5.35, -4.25, -2.15, -1.05]);

      joistX.forEach((jx, jIdx) => {
        parts.push({
          kind: "wf",
          a: 3.1,
          b: 0.24,
          c: 0.16,
          final: [jx, beamY - 0.02, 0],
          finalRot: [0, Math.PI / 2, 0],
          axisY: false,
          startTime: floorStartTime + 0.42 + jIdx * 0.04,
          duration: 0.42,
          dropHeight: 1.6,
        });
      });

      // Floor Deck Plate (aligned with beam span)
      parts.push({
        kind: "plate",
        a: wing.len,
        b: 0.048,
        c: wing.name === "East" ? 4.15 : 3.35,
        final: [wing.midX, deckY, 0],
        finalRot: [0, 0, 0],
        axisY: false,
        startTime: floorStartTime + 0.62 + wIdx * 0.06,
        duration: 0.42,
        dropHeight: 1.6,
      });

      // Perimeter Channel Kickplates
      [-1.6, 1.6].forEach((sz, trimIdx) => {
        parts.push({
          kind: "channel",
          a: wing.len,
          b: 0.18,
          c: 0.09,
          final: [wing.midX, deckY + 0.08, sz > 0 ? sz + 0.075 : sz - 0.075],
          finalRot: [0, 0, 0],
          axisY: false,
          flip: sz > 0,
          startTime: floorStartTime + 0.72 + trimIdx * 0.05,
          duration: 0.38,
          dropHeight: 1.4,
        });
      });
    });

    // 3. Multi-Level Connecting Link Bridge between Building A and Building B
    // (At Levels 2, 3, 4 across the central corridor)
    if (!isReduced && floorIdx >= 1 && floorIdx <= 3) {
      pushConnectingBridge(parts, bolts, deckY, floorStartTime + 0.8);
    }

    // 4. Roof Architectural Purlins on Crown Level
    if (isTopFloor) {
      const purlinZ = [-1.55, -0.75, 0, 0.75, 1.55];
      purlinZ.forEach((pz, pIdx) => {
        parts.push({
          kind: "channel",
          a: 3.3,
          b: 0.16,
          c: 0.08,
          final: [-1.6, beamY + 0.12, pz],
          finalRot: [0, 0, 0],
          axisY: false,
          startTime: floorStartTime + 0.82 + pIdx * 0.04,
          duration: 0.38,
          dropHeight: 1.4,
        });
      });
    }
  });

  // ── Stage 7: Precision Staircase Spine (1.8s - 7.5s) ──────────────────────
  // Continuous interconnected stair flights with mathematically exact riser & going
  const stairFlights: FlightConfig[] = isReduced
    ? [
      { fromY: 0.02, toY: decks[0], startX: 6.45, endX: 3.85, z: 1.68, isReduced: true },
      { fromY: decks[0], toY: decks[1], startX: 3.85, endX: 6.45, z: 1.68, isReduced: true },
      { fromY: decks[1], toY: decks[2], startX: 6.45, endX: 3.85, z: 1.68, isReduced: true },
    ]
    : [
      { fromY: 0.02, toY: decks[0], startX: 6.45, endX: 3.75, z: 1.68 },
      { fromY: decks[0], toY: decks[1], startX: 3.75, endX: 6.45, z: 1.68 },
      { fromY: decks[1], toY: decks[2], startX: 6.45, endX: 3.75, z: 1.68 },
      { fromY: decks[2], toY: decks[3], startX: 3.75, endX: 6.45, z: 1.68 },
    ];

  stairFlights.forEach((flight, fIdx) => {
    const flightStartTime = 1.8 + fIdx * 1.35;
    pushPrecisionStairFlight(parts, bolts, flight, flightStartTime);
  });

  // Roof Access Safety Ladder (Level 4 to Roof Terrace)
  const ladderBottom = decks[numFloors - 2];
  const ladderTop = decks[numFloors - 1] + 1.05;
  pushAccessLadder(parts, bolts, ladderBottom, ladderTop, 6.8);

  // ── Stage 8: Vertical Chevron & X-Bracing across Wings (7.2s - 8.6s) ──────
  pushComplexBracing(parts, decks, isReduced, 7.2);

  // ── Stage 9: Perimeter Safety Guardrails & Handrails (7.8s - 9.2s) ────────
  pushComplexRailings(parts, decks, isReduced, 7.8);

  return { parts, bolts };
}

/**
 * Precision Staircase Flight Generator:
 * Calculates exact riser height and going depth per tread to guarantee zero overlap.
 */
function pushPrecisionStairFlight(
  parts: Part[],
  bolts: Bolt[],
  config: FlightConfig,
  baseTime: number
) {
  const { fromY, toY, startX, endX, z, isReduced } = config;
  const totalRise = toY - fromY;
  const dir = endX > startX ? 1 : -1;
  const totalRun = Math.abs(endX - startX);

  // Exact architectural riser height: ~200mm per step
  const numRisers = isReduced ? 10 : 12;
  const riserHeight = totalRise / numRisers;
  const numTreads = numRisers - 1; // 11 treads for 12 risers
  const stepGoing = totalRun / numRisers; // horizontal step spacing
  const treadDepth = Math.max(0.24, Math.min(0.28, stepGoing * 1.05));

  const runHypot = Math.hypot(totalRun, totalRise);
  const slope = Math.atan2(totalRise, totalRun) * (dir > 0 ? -1 : 1);
  const midX = (startX + endX) / 2;
  const midY = (fromY + toY) / 2;
  const halfW = STAIR_W / 2;

  // 1. Channel Stringers (left & right)
  [-1, 1].forEach((side, i) => {
    parts.push({
      kind: "channel",
      a: runHypot + 0.15,
      b: STRINGER_D,
      c: 0.085,
      final: [midX, midY - 0.06, z + side * halfW],
      finalRot: [0, 0, slope],
      axisY: false,
      flip: side > 0,
      startTime: baseTime + i * 0.06,
      duration: 0.48,
      dropHeight: 1.8,
    });

    // Base shoe mounting bolts
    bolts.push({
      tc: false,
      final: [endX - dir * 0.1, fromY + 0.08, z + side * halfW],
      finalRot: [0, 0, 0],
      startTime: baseTime + 0.38 + i * 0.04,
      duration: 0.24,
    });
  });

  // 2. Precision Stair Treads (Calculated uniformly from bottom landing to top)
  for (let k = 1; k <= numTreads; k += 1) {
    const treadY = fromY + k * riserHeight;
    const treadX = endX - dir * (k * stepGoing);

    parts.push({
      kind: "tread",
      a: treadDepth,
      b: TREAD_THICKNESS,
      c: STAIR_W - 0.06,
      final: [treadX, treadY, z],
      finalRot: [0, 0, 0],
      axisY: false,
      startTime: baseTime + 0.14 + k * 0.028,
      duration: 0.34,
      dropHeight: 0.9,
    });
  }

  // 3. Continuous Handrails & Railing Stanchions
  [-1, 1].forEach((side, sideIdx) => {
    // Top handrail (accent safety color)
    parts.push({
      kind: "rail",
      a: 0.042,
      b: runHypot + 0.2,
      c: 0.042,
      final: [midX, midY + 0.96, z + side * halfW],
      finalRot: [0, 0, Math.PI / 2 + slope],
      axisY: true,
      accent: true,
      startTime: baseTime + 0.42 + sideIdx * 0.05,
      duration: 0.4,
      dropHeight: 1.2,
    });

    if (!isReduced) {
      // Mid safety rail
      parts.push({
        kind: "rail",
        a: 0.034,
        b: runHypot + 0.2,
        c: 0.034,
        final: [midX, midY + 0.48, z + side * halfW],
        finalRot: [0, 0, Math.PI / 2 + slope],
        axisY: true,
        accent: true,
        startTime: baseTime + 0.46 + sideIdx * 0.05,
        duration: 0.4,
        dropHeight: 1.2,
      });
    }

    // Vertical railing stanchions
    const stanchionFracs = isReduced ? [0.15, 0.85] : [0.1, 0.5, 0.9];
    stanchionFracs.forEach((frac, pIdx) => {
      const px = endX - dir * (frac * totalRun);
      const py = fromY + frac * totalRise + 0.52;
      parts.push({
        kind: "rail",
        a: 0.038,
        b: 1.04,
        c: 0.038,
        final: [px, py, z + side * halfW],
        finalRot: [0, 0, 0],
        axisY: true,
        accent: true,
        startTime: baseTime + 0.38 + sideIdx * 0.04 + pIdx * 0.02,
        duration: 0.36,
        dropHeight: 1.0,
      });
    });
  });

  // Intermediate landing plate at top of flight
  parts.push({
    kind: "plate",
    a: 1.2,
    b: 0.045,
    c: STAIR_W + 0.1,
    final: [startX, toY, z],
    finalRot: [0, 0, 0],
    axisY: false,
    startTime: baseTime + 0.5,
    duration: 0.36,
    dropHeight: 1.1,
  });
}

/**
 * Structural Link Bridge spanning between Building A and Building B.
 */
function pushConnectingBridge(
  parts: Part[],
  bolts: Bolt[],
  deckY: number,
  baseTime: number
) {
  const beamY = beamYFor(deckY);
  const bridgeSpanX = 2.4;
  const bridgeX = 0.0;

  // Bridge primary longitudinal channel girders
  [-1.2, 1.2].forEach((gz, sideIdx) => {
    parts.push({
      kind: "channel",
      a: bridgeSpanX,
      b: BEAM_D * 0.85,
      c: 0.1,
      final: [bridgeX, beamY, gz],
      finalRot: [0, 0, 0],
      axisY: false,
      flip: gz > 0,
      startTime: baseTime + sideIdx * 0.06,
      duration: 0.42,
      dropHeight: 1.6,
    });
  });

  // Bridge floor plate
  parts.push({
    kind: "plate",
    a: bridgeSpanX,
    b: 0.045,
    c: 2.3,
    final: [bridgeX, deckY, 0],
    finalRot: [0, 0, 0],
    axisY: false,
    startTime: baseTime + 0.14,
    duration: 0.38,
    dropHeight: 1.4,
  });

  // Bridge safety handrails (accent color)
  [-1.2, 1.2].forEach((sz, sideIdx) => {
    // Top rail
    parts.push({
      kind: "rail",
      a: 0.04,
      b: bridgeSpanX,
      c: 0.04,
      final: [bridgeX, railTopFor(deckY), sz],
      finalRot: [0, 0, Math.PI / 2],
      axisY: true,
      accent: true,
      startTime: baseTime + 0.22 + sideIdx * 0.04,
      duration: 0.38,
      dropHeight: 1.2,
    });
    // Vertical bridge stanchions
    [-0.9, 0.0, 0.9].forEach((px, pIdx) => {
      parts.push({
        kind: "rail",
        a: 0.038,
        b: 1.05,
        c: 0.038,
        final: [px, deckY + 0.52, sz],
        finalRot: [0, 0, 0],
        axisY: true,
        accent: true,
        startTime: baseTime + 0.26 + pIdx * 0.02,
        duration: 0.34,
        dropHeight: 1.0,
      });
    });
  });
}

/**
 * Vertical safety access ladder with fall-arrest cable.
 */
function pushAccessLadder(
  parts: Part[],
  bolts: Bolt[],
  bottomY: number,
  topY: number,
  baseTime: number
) {
  const LADDER_X = 2.4;
  const LADDER_Z = 1.75;
  const STILE_GAP = 0.46;
  const height = topY - bottomY;

  // Stiles
  [-1, 1].forEach((sx, i) => {
    parts.push({
      kind: "pipe",
      a: 0.048,
      b: height,
      c: 0.048,
      final: [LADDER_X + (sx * STILE_GAP) / 2, (topY + bottomY) / 2, LADDER_Z],
      finalRot: [0, 0, 0],
      axisY: true,
      startTime: baseTime + i * 0.06,
      duration: 0.46,
      dropHeight: 2.0,
    });
  });

  // Rungs
  const PITCH = 0.32;
  const rungs = Math.floor((height - 0.3) / PITCH);
  for (let i = 0; i <= rungs; i += 1) {
    parts.push({
      kind: "pipe",
      a: 0.026,
      b: STILE_GAP,
      c: 0.026,
      final: [LADDER_X, bottomY + 0.2 + i * PITCH, LADDER_Z],
      finalRot: [0, 0, Math.PI / 2],
      axisY: true,
      startTime: baseTime + 0.12 + i * 0.02,
      duration: 0.3,
      dropHeight: 0.8,
    });
  }

  // Fall-arrest safety cable (Accent color)
  const CABLE_Z = LADDER_Z + 0.12;
  parts.push({
    kind: "pipe",
    a: 0.014,
    b: height - 0.3,
    c: 0.014,
    final: [LADDER_X, (topY + bottomY) / 2, CABLE_Z],
    finalRot: [0, 0, 0],
    axisY: true,
    accent: true,
    startTime: baseTime + 0.38,
    duration: 0.36,
    dropHeight: 1.0,
  });
}

/**
 * Structural chevron and X-bracing across dual building bays.
 */
function pushComplexBracing(
  parts: Part[],
  decks: readonly number[],
  isReduced: boolean,
  baseTime: number
) {
  const BRACE_R = 0.082;
  const halfBay = BAY_X / 2;

  // Bay centers for bracing
  const braceBays = isReduced
    ? [{ x: 1.6, z: -1.6, tiers: [0, 2] }]
    : [
      { x: 1.6, z: -1.6, tiers: [0, 1, 2, 3] }, // East Wing Rear
      { x: -4.8, z: -1.6, tiers: [0, 2] }, // West Wing Rear
      { x: -6.4, z: 0, isSide: true, tiers: [0, 2] }, // West Far End X-Bracing
    ];

  braceBays.forEach((bay, bIdx) => {
    bay.tiers.forEach((tierIdx, tIdx) => {
      if (tierIdx >= decks.length) return;
      const footY = tierIdx === 0 ? 0.18 : decks[tierIdx - 1] + 0.1;
      const soffitY = beamYFor(decks[tierIdx]) - BEAM_D / 2;
      const apexY = soffitY - 0.08;
      const rise = apexY - footY;
      const tierTime = baseTime + (bIdx * 2 + tIdx) * 0.16;

      if ((bay as { isSide?: boolean }).isSide) {
        // X-Bracing across side end
        const lenZ = Math.hypot(BAY_Z, rise);
        [-1, 1].forEach((dir, i) => {
          parts.push({
            kind: "pipe",
            a: 0.068,
            b: lenZ,
            c: 0.068,
            final: [bay.x, (soffitY + footY) / 2, 0],
            finalRot: [dir * Math.atan2(BAY_Z, rise), 0, 0],
            axisY: true,
            startTime: tierTime + i * 0.04,
            duration: 0.4,
            dropHeight: 1.4,
          });
        });
        // Center gusset plate
        parts.push({
          kind: "gusset",
          a: 0.54,
          b: 0.46,
          c: 0.028,
          final: [bay.x, (soffitY + footY) / 2, 0],
          finalRot: [0, Math.PI / 2, 0],
          axisY: false,
          startTime: tierTime + 0.1,
          duration: 0.34,
          dropHeight: 1.0,
        });
      } else {
        // Chevron bracing across bay
        const lenChevron = Math.hypot(halfBay, rise);
        [-1, 1].forEach((dir, i) => {
          // Gusset plate at column foot
          parts.push({
            kind: "gusset",
            a: 0.5,
            b: 0.42,
            c: 0.028,
            final: [bay.x + dir * halfBay, footY + 0.2, bay.z],
            finalRot: [0, 0, 0],
            axisY: false,
            flip: true,
            startTime: tierTime + i * 0.03,
            duration: 0.35,
            dropHeight: 1.2,
          });

          // Diagonal pipe brace
          parts.push({
            kind: "pipe",
            a: BRACE_R,
            b: lenChevron,
            c: BRACE_R,
            final: [bay.x + (dir * halfBay) / 2, (apexY + footY) / 2, bay.z],
            finalRot: [0, 0, dir * Math.atan2(halfBay, rise)],
            axisY: true,
            startTime: tierTime + 0.06 + i * 0.03,
            duration: 0.4,
            dropHeight: 1.4,
          });
        });

        // Apex gusset plate
        parts.push({
          kind: "gusset",
          a: 0.72,
          b: 0.4,
          c: 0.028,
          final: [bay.x, soffitY - 0.2, bay.z],
          finalRot: [0, 0, 0],
          axisY: false,
          startTime: tierTime + 0.05,
          duration: 0.35,
          dropHeight: 1.2,
        });
      }
    });
  });
}

/**
 * Perimeter safety guardrails across both building wings.
 */
function pushComplexRailings(
  parts: Part[],
  decks: readonly number[],
  isReduced: boolean,
  baseTime: number
) {
  const postH = 1.08;
  const rail = (
    final: Vec3,
    length: number,
    finalRot: Vec3,
    startTime: number,
    duration: number,
    dropHeight: number
  ): Part => ({
    kind: "rail",
    a: 0.042,
    b: length,
    c: 0.042,
    final,
    finalRot,
    axisY: true,
    accent: true,
    startTime,
    duration,
    dropHeight,
  });

  decks.forEach((deckY, floorIdx) => {
    const isTopFloor = floorIdx === decks.length - 1;
    const railTime = baseTime + floorIdx * 0.14;
    const postY = deckY + postH / 2;
    const rTop = railTopFor(deckY);
    const rMid = railMidFor(deckY);

    // Rear posts along East Wing (and West Wing if full tier)
    const postXRear = isReduced
      ? [0.0, 3.2, 6.4]
      : [-6.4, -3.2, 0.0, 3.2, 6.4];

    postXRear.forEach((x, pIdx) => {
      if (isTopFloor && !isReduced && x < -3.2) return;
      parts.push(rail([x, postY, -1.6], postH, [0, 0, 0], railTime + pIdx * 0.015, 0.35, 1.0));
    });

    // Front column posts
    const postXFront = isReduced
      ? [0.0, 3.2, 6.4]
      : [-6.4, -3.2, 0.0, 3.2, 6.4];

    postXFront.forEach((x, pIdx) => {
      if (isTopFloor && !isReduced && x < -3.2) return;
      parts.push(rail([x, postY, 1.6], postH, [0, 0, 0], railTime + pIdx * 0.015, 0.35, 1.0));
    });

    // Rear Horizontal Rails
    const spanEast = 6.4;
    parts.push(rail([3.2, rTop, -1.6], spanEast, [0, 0, Math.PI / 2], railTime + 0.16, 0.4, 1.2));
    if (!isReduced) {
      parts.push(rail([3.2, rMid, -1.6], spanEast, [0, 0, Math.PI / 2], railTime + 0.2, 0.4, 1.2));
      const spanWest = isTopFloor ? 3.2 : 6.4;
      const midWest = isTopFloor ? -1.6 : -3.2;
      parts.push(rail([midWest, rTop, -1.6], spanWest, [0, 0, Math.PI / 2], railTime + 0.18, 0.4, 1.2));
      parts.push(rail([midWest, rMid, -1.6], spanWest, [0, 0, Math.PI / 2], railTime + 0.22, 0.4, 1.2));
    }

    // Front Rails (West Wing)
    if (!isReduced) {
      const spanWest = isTopFloor ? 3.2 : 6.4;
      const midWest = isTopFloor ? -1.6 : -3.2;
      parts.push(rail([midWest, rTop, 1.6], spanWest, [0, 0, Math.PI / 2], railTime + 0.22, 0.4, 1.2));
    }

    // Transverse End Rails at West side
    const endX = !isReduced && !isTopFloor ? -6.4 : -3.2;
    parts.push(rail([endX, rTop, 0], 3.2, [Math.PI / 2, 0, 0], railTime + 0.26, 0.4, 1.2));
  });
}

export interface SceneTheme {
  steel: string;
  secondary: string;
  steelDark: string;
  accent: string;
  bolt: string;
  ambient: number;
  key: number;
}

/** One structural member built from shared unit geometries */
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
    case "wf": {
      const flangeThick = Math.max(0.054, c * 0.18);
      const webThick = Math.max(0.036, c * 0.12);
      return (
        <>
          {/* Top Flange */}
          <mesh geometry={geo.box} material={steel} position={[0, b / 2, 0]} scale={[a, flangeThick, c]} />
          {/* Bottom Flange */}
          <mesh geometry={geo.box} material={steel} position={[0, -b / 2, 0]} scale={[a, flangeThick, c]} />
          {/* Central Web */}
          <mesh geometry={geo.box} material={mat.dark} scale={[a, b, webThick]} />
        </>
      );
    }
    case "hss":
      return (
        <>
          {/* Column Body */}
          <mesh geometry={geo.box} material={steel} scale={[a, b, c]} />
          {/* Dark top cap reading as hollow profile */}
          <mesh
            geometry={geo.box}
            material={mat.dark}
            position={[0, b / 2 + 0.002, 0]}
            scale={[a * 0.65, 0.012, c * 0.65]}
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
          <mesh geometry={geo.box} material={mat.secondary} scale={[a, b, 0.038]} />
          <mesh
            geometry={geo.box}
            material={mat.secondary}
            position={[0, b / 2 - 0.025, (part.flip ? -1 : 1) * (c / 2)]}
            scale={[a, 0.058, c]}
          />
          <mesh
            geometry={geo.box}
            material={mat.secondary}
            position={[0, -(b / 2 - 0.025), (part.flip ? -1 : 1) * (c / 2)]}
            scale={[a, 0.058, c]}
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
          <mesh geometry={geo.box} material={mat.secondary} scale={[a, b, c]} />
          {/* High-visibility safety nosing */}
          <mesh
            geometry={geo.box}
            material={mat.accent}
            position={[a / 2 - 0.022, b / 2, 0]}
            scale={[0.048, 0.02, c]}
          />
        </>
      );
    case "plate":
    default:
      return (
        <mesh
          geometry={geo.box}
          material={part.accent ? mat.accent : mat.secondary}
          scale={[a, b, c]}
        />
      );
  }
}

function BoltMeshes({ tc, geo, mat }: { tc: boolean; geo: Geometries; mat: Materials }) {
  return (
    <>
      <mesh geometry={geo.cyl} material={mat.bolt} position={[0, 0.014, 0]} scale={[0.076, 0.02, 0.076]} />
      <mesh geometry={geo.hex} material={mat.bolt} position={[0, 0.058, 0]} scale={[0.056, 0.052, 0.056]} />
      <mesh geometry={geo.cyl} material={mat.bolt} position={[0, -0.04, 0]} scale={[0.032, 0.15, 0.032]} />
      {tc && (
        <mesh
          geometry={geo.cyl}
          material={mat.bolt}
          position={[0, -0.125, 0]}
          scale={[0.024, 0.05, 0.024]}
        />
      )}
    </>
  );
}

/** Engineered chamfered gusset connection plate */
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
    bevelThickness: 0.022,
    bevelSize: 0.016,
    bevelSegments: 2,
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
  tier,
  startRef,
  splitRef,
  shadowOpacityRef,
  matRef,
  onComplete,
}: {
  tier: DetailTier;
  startRef: React.MutableRefObject<number>;
  splitRef: React.MutableRefObject<number>;
  shadowOpacityRef: React.MutableRefObject<number>;
  matRef: React.MutableRefObject<Materials | null>;
  onComplete: () => void;
}) {
  const { parts, bolts } = useMemo(() => buildComplex(tier), [tier]);

  const completeAt = useMemo(() => {
    const maxPart = Math.max(...parts.map((p) => p.startTime + p.duration));
    const maxBolt = Math.max(...bolts.map((b) => b.startTime + b.duration));
    return Math.max(maxPart, maxBolt) + 0.85;
  }, [parts, bolts]);

  const geo = useMemo<Geometries>(
    () => ({
      box: new THREE.BoxGeometry(1, 1, 1),
      gusset: gussetGeometry(),
      cyl: new THREE.CylinderGeometry(1, 1, 1, tier === "reduced" ? 16 : 28),
      hex: new THREE.CylinderGeometry(1, 1, 1, 6),
      sphere: new THREE.SphereGeometry(1, tier === "reduced" ? 10 : 18, tier === "reduced" ? 8 : 12),
    }),
    [tier]
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

  matRef.current = mat;

  const fired = useRef(false);
  const { camera } = useThree();
  const lookAt = useMemo(() => new THREE.Vector3(0.0, 5.8, 0), []);

  const partStates = useRef<Uint8Array | null>(null);
  const boltStates = useRef<Uint8Array | null>(null);
  if (!partStates.current || partStates.current.length !== parts.length) {
    partStates.current = new Uint8Array(parts.length);
  }
  if (!boltStates.current || boltStates.current.length !== bolts.length) {
    boltStates.current = new Uint8Array(bolts.length);
  }

  useFrame((state) => {
    if (startRef.current === 0) {
      startRef.current = state.clock.elapsedTime;
      partStates.current?.fill(0);
      boltStates.current?.fill(0);
    }
    const t = state.clock.elapsedTime - startRef.current;
    const isAssembled = t >= completeAt;

    // ── 1. Incremental Member Construction Loop ────────────────────────────
    if (!isAssembled) {
      const pStates = partStates.current!;
      for (let i = 0; i < parts.length; i += 1) {
        if (pStates[i] === 2) continue;

        const group = groups.current[i];
        if (!group) continue;
        const part = parts[i];
        const { startTime, duration, dropHeight, final, finalRot } = part;

        if (t < startTime) {
          if (pStates[i] === 0) {
            group.position.set(final[0], final[1] + dropHeight, final[2]);
            group.rotation.set(finalRot[0], finalRot[1], finalRot[2]);
            group.scale.set(0, 0, 0);
          }
          continue;
        }

        pStates[i] = 1;
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
          pStates[i] = 2; // marked settled
        }
      }

      // ── 2. Sequential Fastener & Bolt Placement ────────────────────────────
      const bStates = boltStates.current!;
      for (let i = 0; i < bolts.length; i += 1) {
        if (bStates[i] === 2) continue;

        const group = groups.current[parts.length + i];
        if (!group) continue;
        const bolt = bolts[i];
        const { startTime, duration, final, finalRot } = bolt;

        if (t < startTime) {
          if (bStates[i] === 0) {
            group.position.set(final[0], final[1] + 0.35, final[2]);
            group.rotation.set(finalRot[0], finalRot[1], finalRot[2]);
            group.scale.set(0, 0, 0);
          }
          continue;
        }

        bStates[i] = 1;
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
          bStates[i] = 2; // marked settled
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
          glow.scale.setScalar((1 - Math.abs(seatedT - 0.25) / 0.75) * 0.16 + 0.025);
        } else {
          glow.scale.setScalar(0.025 + Math.sin(t * 2.2 + i) * 0.01);
        }
      }
    }

    // ── 4. Wide Complex Camera Choreography ────────────────────────────────
    const aspect = state.size.width / Math.max(1, state.size.height);
    const aspectFactor =
      aspect < 0.65 ? Math.max(1.68, 1.25 / aspect) : aspect < 1.0 ? 1.38 : 1.0;

    const shadowT = clamp01((t - 0.6) / (completeAt - 0.6));
    shadowOpacityRef.current = easeInOutCubic(shadowT);

    // Dynamic isometric perspective covering dual buildings
    const orbit = 1.04;
    const radius = 31.5 * aspectFactor;
    const height = 13.0 * aspectFactor;

    const parallaxY = state.pointer.y * 0.12;
    const parallaxX = state.pointer.x * 0.12;
    camera.position.set(
      Math.cos(orbit) * radius + parallaxX,
      height + parallaxY,
      Math.sin(orbit) * radius
    );
    lookAt.set(0.0, 5.8, 0);
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
 * Procedural Soft Contact Shadows for the Dual-Wing Complex.
 */
function StructureShadows({
  shadowOpacityRef,
}: {
  shadowOpacityRef: React.MutableRefObject<number>;
}) {
  const { shadowTexture, spotTexture } = useMemo(() => {
    // 1. Diffuse soft shadow footprint
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
      grad.addColorStop(0, "rgba(0, 0, 0, 0.46)");
      grad.addColorStop(0.35, "rgba(0, 0, 0, 0.28)");
      grad.addColorStop(0.68, "rgba(0, 0, 0, 0.08)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);
    }
    const shadowTexture = new THREE.CanvasTexture(canvas);

    // 2. Focused contact spot for column base plates
    const spotCanvas = document.createElement("canvas");
    spotCanvas.width = 256;
    spotCanvas.height = 256;
    const spotCtx = spotCanvas.getContext("2d");
    if (spotCtx) {
      const spotGrad = spotCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
      spotGrad.addColorStop(0, "rgba(0, 0, 0, 0.58)");
      spotGrad.addColorStop(0.35, "rgba(0, 0, 0, 0.32)");
      spotGrad.addColorStop(0.7, "rgba(0, 0, 0, 0.07)");
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
    mainMat.opacity = opacity * 0.44;
    spotMat.opacity = opacity * 0.65;
  });

  return (
    <group position={[0, 0.003, 0]}>
      {/* Broad dual-wing footprint ambient occlusion */}
      <mesh
        geometry={planeGeo}
        material={mainMat}
        position={[0.0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[17.5, 6.8, 1]}
      />
      {/* Individual column base plate contact spots (10 columns) */}
      {COLUMN_GRID_10.map(([gx, gz], i) => (
        <mesh
          key={`col-spot-${i}`}
          geometry={planeGeo}
          material={spotMat}
          position={[gx, 0.001, gz]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[1.15, 1.15, 1]}
        />
      ))}
      {/* Ground stair base contact spot */}
      <mesh
        geometry={planeGeo}
        material={spotMat}
        position={[4.8, 0.001, 1.68]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[1.4, 1.4, 1]}
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
 * Split rendering manager for dual theme reveal.
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
        rig.rim.intensity = 1.75;
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

/** Adaptive DPR manager calibrated for high-performance rendering */
function AdaptiveDpr({ tier }: { tier: DetailTier }) {
  const setDpr = useThree((state) => state.setDpr);
  useEffect(() => {
    const maxDpr = tier === "reduced" ? 1.15 : 1.35;
    setDpr(Math.min(window.devicePixelRatio, maxDpr));
  }, [setDpr, tier]);
  return null;
}

/**
 * Continuous smooth turntable rotation around the building complex center.
 * Anchors the model gracefully in the right half of the hero viewport.
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
      const rotProgress = (t - 1.2) * 0.15;
      rotRef.current.rotation.y = rotProgress;
    }
  });

  return (
    <group position={[2.5, -0.4, 0]}>
      {/* Pivot around structural building center [0, 0, 0] */}
      <group position={[0, 0, 0]}>
        <group ref={rotRef} position={[0, 0, 0]}>
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
  tier = "full",
  runKey,
  onComplete,
}: {
  dark: SceneTheme;
  light: SceneTheme;
  splitEnabled: boolean;
  singlePalette: "dark" | "light";
  tier?: DetailTier;
  runKey: number;
  onComplete: () => void;
}) {
  const startRef = useRef(0);
  const splitRef = useRef(1);
  const shadowOpacityRef = useRef(0);
  const matRef = useRef<Materials | null>(null);
  const lights = useRef<LightRig>({
    key: null,
    rim: null,
    fill: null,
    bounce: null,
    ambient: null,
  });

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
      camera={{ position: [8.5, 14.0, 28.0], fov: 38, near: 0.1, far: 200 }}
      dpr={[1, tier === "reduced" ? 1.15 : 1.35]}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: true }}
      frameloop="always"
    >
      <AdaptiveDpr tier={tier} />

      {/* 3-Point + Ground Bounce Lighting Rig */}
      <ambientLight
        ref={(node) => {
          lights.current.ambient = node;
        }}
        intensity={dark.ambient}
      />
      <directionalLight
        ref={(node) => {
          lights.current.key = node;
        }}
        position={[15, 25, 12]}
        intensity={dark.key}
        color="#FFF8F0"
      />
      <directionalLight
        ref={(node) => {
          lights.current.rim = node;
        }}
        position={[-18, 16, -14]}
        intensity={1.75}
        color={dark.accent}
      />
      <directionalLight
        ref={(node) => {
          lights.current.fill = node;
        }}
        position={[-12, 10, 15]}
        intensity={0.7}
        color="#A8CBFF"
      />
      <directionalLight
        ref={(node) => {
          lights.current.bounce = node;
        }}
        position={[5, -8, 5]}
        intensity={0.38}
        color={dark.accent}
      />

      <Suspense fallback={null}>
        <Environment resolution={256} frames={1}>
          <Lightformer
            form="rect"
            intensity={6.8}
            color="#FFF6EA"
            position={[10, 18, 10]}
            scale={[24, 20, 1]}
            target={[0, 6, 0]}
          />
          <Lightformer
            form="rect"
            intensity={3.5}
            color="#A3CAFF"
            position={[-16, 10, -12]}
            scale={[20, 16, 1]}
            target={[0, 6, 0]}
          />
          <Lightformer
            form="rect"
            intensity={4.8}
            color={dark.accent}
            position={[0, -4, 15]}
            scale={[18, 4, 1]}
            target={[0, 6, 0]}
          />
          <Lightformer
            form="ring"
            intensity={2.8}
            color="#FFFFFF"
            position={[0, 26, 0]}
            scale={28}
            target={[0, 6, 0]}
          />
        </Environment>

        <TurntablePlatform startRef={startRef}>
          <Assembly
            tier={tier}
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
