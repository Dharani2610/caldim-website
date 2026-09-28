import * as THREE from 'three';

// ── Structure Dimensions & Elevations ────────────────────────────────────
const COL_W = 0.28;
const BEAM_D = 0.44;
const BAY_X = 3.2;
const BAY_Z = 3.2;

const EAST_DECK_DEPTH = 4.15;
const WEST_DECK_DEPTH = 3.35;
const EAST_DECK_FRONT_EDGE_Z = EAST_DECK_DEPTH / 2; // 2.075
const WEST_DECK_FRONT_EDGE_Z = WEST_DECK_DEPTH / 2; // 1.675

const DECK_LEVELS = [2.4, 4.8, 7.2, 9.6, 12.0];
const DECK_LEVELS_REDUCED = [2.6, 5.2, 7.8, 10.4];

// Staircase engineering constants
const STRINGER_D = 0.26;
const STAIR_W = 1.15;
const LANE_GAP = 0.15;
const TREAD_THICKNESS = 0.045;

const STAIR_CLEARANCE_FROM_DECK = 0.775;
const STAIR_Z_LANE_A = EAST_DECK_FRONT_EDGE_Z + STAIR_CLEARANCE_FROM_DECK; // = 2.85
const STAIR_Z_LANE_B = STAIR_Z_LANE_A + STAIR_W + LANE_GAP; // = 4.15

const LANDING_Z_MIN = STAIR_Z_LANE_A - STAIR_W / 2; // 2.275
const LANDING_Z_MAX = STAIR_Z_LANE_B + STAIR_W / 2; // 4.725
const LANDING_DEPTH_Z = LANDING_Z_MAX - LANDING_Z_MIN; // 2.45
const LANDING_MID_Z = (LANDING_Z_MIN + LANDING_Z_MAX) / 2; // 3.50

const STAIR_X_LEFT = -5.80;
const STAIR_X_RIGHT = -2.60;
const STAIR_FLIGHT_SPAN_X = STAIR_X_RIGHT - STAIR_X_LEFT; // 3.20m

const LANDING_DEPTH_X = 1.20;
const LEFT_LANDING_X_MIN = STAIR_X_LEFT - LANDING_DEPTH_X; // -7.00
const LEFT_LANDING_MID_X = (LEFT_LANDING_X_MIN + STAIR_X_LEFT) / 2; // -6.40

const RIGHT_LANDING_X_MAX = STAIR_X_RIGHT + LANDING_DEPTH_X; // -1.40
const RIGHT_LANDING_MID_X = (STAIR_X_RIGHT + RIGHT_LANDING_X_MAX) / 2; // -2.00

const beamYFor = (deckY) => deckY - 0.025 - BEAM_D / 2;
const railTopFor = (deckY) => deckY + 1.05;
const railMidFor = (deckY) => deckY + 0.55;

// Parts simulation
const parts = [];
const bolts = [];

function pushPrecisionStairFlight(parts, bolts, config, baseTime) {
  const { fromY, toY, startX, endX, z, isReduced } = config;
  const totalRise = toY - fromY;
  const dir = endX > startX ? 1 : -1;
  const totalRun = Math.abs(endX - startX);

  const numRisers = isReduced ? 10 : 12;
  const riserHeight = totalRise / numRisers;
  const numTreads = numRisers - 1;
  const stepGoing = totalRun / numRisers;
  const treadDepth = Math.max(0.24, Math.min(0.28, stepGoing * 1.05));

  const runHypot = Math.hypot(totalRun, totalRise);
  const slope = (dir > 0 ? 1 : -1) * Math.atan2(totalRise, totalRun);
  const midX = (startX + endX) / 2;
  const midY = (fromY + toY) / 2;
  const halfW = STAIR_W / 2;

  // 1. Channel Stringers (left & right)
  [-1, 1].forEach((side, i) => {
    parts.push({
      id: `flight-stringer-${config.id}-${side}`,
      kind: "channel",
      a: runHypot,
      b: STRINGER_D,
      c: 0.085,
      final: [midX, midY - 0.04, z + side * halfW],
      finalRot: [0, 0, slope],
      startTime: baseTime + i * 0.05,
      duration: 0.44,
      dropHeight: 1.6,
    });
  });

  // 2. Precision Stair Treads
  for (let k = 1; k <= numTreads; k += 1) {
    const treadY = fromY + k * riserHeight;
    const treadX = startX + dir * (k * stepGoing);

    parts.push({
      id: `flight-tread-${config.id}-${k}`,
      kind: "tread",
      a: treadDepth,
      b: TREAD_THICKNESS,
      c: STAIR_W - 0.06,
      final: [treadX, treadY, z],
      finalRot: [0, 0, 0],
      startTime: baseTime + 0.12 + k * 0.024,
      duration: 0.32,
      dropHeight: 0.85,
    });
  }

  // 3. Handrails & Stanchions
  [-1, 1].forEach((side, sideIdx) => {
    parts.push({
      id: `flight-toprail-${config.id}-${side}`,
      kind: "rail",
      a: 0.042,
      b: runHypot + 0.15,
      c: 0.042,
      final: [midX, midY + 0.96, z + side * halfW],
      finalRot: [0, 0, Math.PI / 2 + slope],
      startTime: baseTime + 0.42 + sideIdx * 0.04,
      duration: 0.38,
      dropHeight: 1.1,
    });

    if (!isReduced) {
      parts.push({
        id: `flight-midrail-${config.id}-${side}`,
        kind: "rail",
        a: 0.034,
        b: runHypot + 0.15,
        c: 0.034,
        final: [midX, midY + 0.50, z + side * halfW],
        finalRot: [0, 0, Math.PI / 2 + slope],
        startTime: baseTime + 0.46 + sideIdx * 0.04,
        duration: 0.38,
        dropHeight: 1.1,
      });
    }

    const stanchionFracs = isReduced ? [0.15, 0.85] : [0.12, 0.50, 0.88];
    stanchionFracs.forEach((frac, pIdx) => {
      const px = startX + dir * (frac * totalRun);
      const py = fromY + frac * totalRise + 0.52;
      parts.push({
        id: `flight-stanchion-${config.id}-${side}-${pIdx}`,
        kind: "rail",
        a: 0.038,
        b: 1.04,
        c: 0.038,
        final: [px, py, z + side * halfW],
        finalRot: [0, 0, 0],
        startTime: baseTime + 0.36 + sideIdx * 0.03 + pIdx * 0.02,
        duration: 0.34,
        dropHeight: 0.95,
      });
    });
  });
}

function pushStairLandingAndBridge(
  parts,
  bolts,
  landingMidX,
  deckY,
  baseTime,
  isOuterCol,
  isReduced
) {
  const beamY = beamYFor(deckY);
  const zInner = 1.6;
  const bridgeSpanZ = LANDING_Z_MIN - zInner; // 2.275 - 1.6 = 0.675
  const bridgeMidZ = (zInner + LANDING_Z_MIN) / 2; // 1.9375
  const landingWidthX = LANDING_DEPTH_X; // 1.20

  // 1. Landing Platform Plate (Spans BOTH lanes Z=[2.275, 4.725])
  parts.push({
    id: `landing-plate-${deckY}`,
    kind: "plate",
    a: landingWidthX,
    b: 0.045,
    c: LANDING_DEPTH_Z,
    final: [landingMidX, deckY, LANDING_MID_Z],
    finalRot: [0, 0, 0],
    startTime: baseTime + 0.08,
    duration: 0.38,
    dropHeight: 1.2,
  });

  // 2. Supporting steel framing channels under landing
  // Longitudinal outer and inner channels along X (length 1.20)
  [LANDING_Z_MIN, LANDING_MID_Z, LANDING_Z_MAX].forEach((cz, i) => {
    parts.push({
      id: `landing-beam-x-${deckY}-${i}`,
      kind: "channel",
      a: landingWidthX,
      b: 0.22,
      c: 0.08,
      final: [landingMidX, beamY, cz],
      finalRot: [0, 0, 0],
      startTime: baseTime + 0.02 + i * 0.03,
      duration: 0.38,
      dropHeight: 1.3,
    });
  });

  // Transverse outer channel along Z (length 2.45) at far outer edge
  const outerX = isOuterCol ? LEFT_LANDING_X_MIN + 0.04 : RIGHT_LANDING_X_MAX - 0.04;
  parts.push({
    id: `landing-beam-z-${deckY}`,
    kind: "channel",
    a: LANDING_DEPTH_Z,
    b: 0.22,
    c: 0.08,
    final: [outerX, beamY, LANDING_MID_Z],
    finalRot: [0, Math.PI / 2, 0],
    startTime: baseTime + 0.04,
    duration: 0.40,
    dropHeight: 1.3,
  });

  // 3. Connecting Bridge Floor Plate from Building Deck (Z=1.6) to Landing (Z=2.275)
  parts.push({
    id: `bridge-plate-${deckY}`,
    kind: "plate",
    a: landingWidthX,
    b: 0.045,
    c: bridgeSpanZ,
    final: [landingMidX, deckY, bridgeMidZ],
    finalRot: [0, 0, 0],
    startTime: baseTime + 0.10,
    duration: 0.36,
    dropHeight: 1.2,
  });

  // Bridge outrigger cantilever channels (Left & Right along Z)
  [-1, 1].forEach((side, i) => {
    const sideX = landingMidX + side * (landingWidthX / 2 - 0.04);
    parts.push({
      id: `bridge-outrigger-${deckY}-${side}`,
      kind: "channel",
      a: bridgeSpanZ + 0.08,
      b: 0.24,
      c: 0.08,
      final: [sideX, beamY, bridgeMidZ],
      finalRot: [0, Math.PI / 2, 0],
      startTime: baseTime + 0.02 + i * 0.03,
      duration: 0.40,
      dropHeight: 1.3,
    });
  });

  // 4. Diagonal Structural Knee Strut / Cantilever Brace
  const colX = isOuterCol ? -6.4 : -3.2;
  const rise = 1.15;
  const run = LANDING_MID_Z - 1.6; // 3.50 - 1.6 = 1.90
  const strutLen = Math.hypot(run, rise);
  const strutAngle = Math.atan2(run, rise);

  parts.push({
    id: `knee-strut-${deckY}`,
    kind: "pipe",
    a: 0.065,
    b: strutLen,
    c: 0.065,
    final: [isOuterCol ? -6.4 : (landingMidX + colX) / 2, deckY - rise / 2 - 0.05, (1.6 + LANDING_MID_Z) / 2],
    finalRot: [strutAngle, 0, 0],
    startTime: baseTime + 0.14,
    duration: 0.40,
    dropHeight: 1.3,
  });

  // Gusset at column
  parts.push({
    id: `knee-gusset-${deckY}`,
    kind: "gusset",
    a: 0.38,
    b: 0.32,
    c: 0.025,
    final: [colX, deckY - rise + 0.1, 1.62],
    finalRot: [0, Math.PI / 2, 0],
    startTime: baseTime + 0.12,
    duration: 0.32,
    dropHeight: 0.9,
  });

  // 5. Landing Perimeter Safety Guardrails
  // A. Outer long rail along X at Z = LANDING_Z_MAX (4.725)
  parts.push({
    id: `landing-rail-outer-top-${deckY}`,
    kind: "rail",
    a: 0.04,
    b: landingWidthX,
    c: 0.04,
    final: [landingMidX, railTopFor(deckY), LANDING_Z_MAX],
    finalRot: [0, 0, Math.PI / 2],
    startTime: baseTime + 0.22,
    duration: 0.36,
    dropHeight: 1.0,
  });
  if (!isReduced) {
    parts.push({
      id: `landing-rail-outer-mid-${deckY}`,
      kind: "rail",
      a: 0.034,
      b: landingWidthX,
      c: 0.034,
      final: [landingMidX, railMidFor(deckY), LANDING_Z_MAX],
      finalRot: [0, 0, Math.PI / 2],
      startTime: baseTime + 0.25,
      duration: 0.36,
      dropHeight: 1.0,
    });
  }

  // B. Transverse outer end rail along Z at outer edge
  const outerRailX = isOuterCol ? LEFT_LANDING_X_MIN : RIGHT_LANDING_X_MAX;
  parts.push({
    id: `landing-rail-end-top-${deckY}`,
    kind: "rail",
    a: 0.04,
    b: LANDING_DEPTH_Z,
    c: 0.04,
    final: [outerRailX, railTopFor(deckY), LANDING_MID_Z],
    finalRot: [Math.PI / 2, 0, 0],
    startTime: baseTime + 0.24,
    duration: 0.36,
    dropHeight: 1.0,
  });
  if (!isReduced) {
    parts.push({
      id: `landing-rail-end-mid-${deckY}`,
      kind: "rail",
      a: 0.034,
      b: LANDING_DEPTH_Z,
      c: 0.034,
      final: [outerRailX, railMidFor(deckY), LANDING_MID_Z],
      finalRot: [Math.PI / 2, 0, 0],
      startTime: baseTime + 0.27,
      duration: 0.36,
      dropHeight: 1.0,
    });
  }

  // C. Bridge outer side guardrail along Z from 1.6 to 2.275
  const bridgeRailX = isOuterCol ? landingMidX - landingWidthX / 2 : landingMidX + landingWidthX / 2;
  parts.push({
    id: `bridge-rail-top-${deckY}`,
    kind: "rail",
    a: 0.04,
    b: bridgeSpanZ,
    c: 0.04,
    final: [bridgeRailX, railTopFor(deckY), bridgeMidZ],
    finalRot: [Math.PI / 2, 0, 0],
    startTime: baseTime + 0.28,
    duration: 0.36,
    dropHeight: 1.0,
  });

  // D. Stanchions at perimeter corners & joints
  const stanchionPoints = [
    [outerRailX, LANDING_Z_MAX],
    [outerRailX, LANDING_MID_Z],
    [outerRailX, LANDING_Z_MIN],
    [isOuterCol ? STAIR_X_LEFT : STAIR_X_RIGHT, LANDING_Z_MAX],
    [bridgeRailX, zInner + 0.05],
  ];
  stanchionPoints.forEach(([sx, sz], pIdx) => {
    parts.push({
      id: `landing-stanchion-${deckY}-${pIdx}`,
      kind: "rail",
      a: 0.038,
      b: 1.05,
      c: 0.038,
      final: [sx, deckY + 0.525, sz],
      finalRot: [0, 0, 0],
      startTime: baseTime + 0.30 + pIdx * 0.02,
      duration: 0.32,
      dropHeight: 0.9,
    });
  });
}

// Build 4 switchback flights & landings
const flights = [
  { id: 0, fromY: 0.02, toY: 2.4, startX: STAIR_X_LEFT, endX: STAIR_X_RIGHT, z: STAIR_Z_LANE_A, lane: "A" },
  { id: 1, fromY: 2.4, toY: 4.8, startX: STAIR_X_RIGHT, endX: STAIR_X_LEFT, z: STAIR_Z_LANE_B, lane: "B" },
  { id: 2, fromY: 4.8, toY: 7.2, startX: STAIR_X_LEFT, endX: STAIR_X_RIGHT, z: STAIR_Z_LANE_A, lane: "A" },
  { id: 3, fromY: 7.2, toY: 9.6, startX: STAIR_X_RIGHT, endX: STAIR_X_LEFT, z: STAIR_Z_LANE_B, lane: "B" },
];

flights.forEach((flight, fIdx) => {
  const flightStartTime = 1.8 + fIdx * 1.35;
  const isRightLanding = flight.endX > flight.startX;
  const landingMidX = isRightLanding ? RIGHT_LANDING_MID_X : LEFT_LANDING_MID_X;
  const isOuterCol = !isRightLanding;

  pushStairLandingAndBridge(
    parts,
    bolts,
    landingMidX,
    flight.toY,
    flightStartTime,
    isOuterCol,
    false
  );

  pushPrecisionStairFlight(parts, bolts, flight, flightStartTime + 0.18);
});

console.log(`Generated ${parts.length} stair parts successfully.`);

// Check bounding box overlaps between consecutive flight treads
let unintendedCollisions = 0;
const treadParts = parts.filter(p => p.kind === 'tread');
for (let i = 0; i < treadParts.length; i++) {
  for (let j = i + 1; j < treadParts.length; j++) {
    const t1 = treadParts[i];
    const t2 = treadParts[j];
    // Check if tread AABB overlaps tread B AABB
    const dx = Math.abs(t1.final[0] - t2.final[0]);
    const dy = Math.abs(t1.final[1] - t2.final[1]);
    const dz = Math.abs(t1.final[2] - t2.final[2]);
    const overlapX = dx < (t1.a + t2.a) / 2;
    const overlapY = dy < (t1.b + t2.b) / 2;
    const overlapZ = dz < (t1.c + t2.c) / 2;
    if (overlapX && overlapY && overlapZ) {
      console.log(`UNINTENDED INTERSECTION: ${t1.id} vs ${t2.id}`);
      unintendedCollisions++;
    }
  }
}
console.log(`Bounding-box tread-to-tread collision count: ${unintendedCollisions} (Target: 0)`);
