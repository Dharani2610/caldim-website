"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function clamp01(t: number): number {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

/**
 * 03 — MISCELLANEOUS STEEL DETAILING LIVE 3D ANIMATION
 * Hero Object: Common architectural steel staircase with landing and narrative handrail assembly.
 *
 * Sequence (8.5s smooth loop):
 * 1. Exploded Start (t=0.0 - 1.7s): Stringers & landing support beams separate, slide together & seat with base bolts.
 * 2. Tread-by-Tread Placement (t=1.7 - 3.7s): Precision treads attach sequentially from bottom to top with clips & bolts.
 * 3. Assembled Structure (t=3.7 - 4.1s): Bare structural stair reads clearly as assembled steelwork.
 * 4. Post-by-Post Handrail (t=4.1 - 5.3s): Vertical handrail posts erect sequentially along the stair pitch onto landing.
 * 5. Rail Extrusion & Brackets (t=5.3 - 6.5s): Top rail & mid rail extrude post-to-post; saddle brackets lock into place.
 * 6. Completed Hold & Inspection Sweep (t=6.5 - 7.7s): Brand-blue emissive inspection wave sweeps along detailing.
 * 7. Smooth Loop Reset (t=7.7 - 8.5s): Graceful reset back to exploded state.
 */
export default function MiscSteelScene({ isHovered }: { isHovered: boolean }) {
  const rootRef = useRef<THREE.Group>(null);
  const leftStringerRef = useRef<THREE.Group>(null);
  const rightStringerRef = useRef<THREE.Group>(null);
  const landingSupportRef = useRef<THREE.Group>(null);
  const landingFloorRef = useRef<THREE.Group>(null);
  const treadsRef = useRef<(THREE.Group | null)[]>([]);
  const postsRef = useRef<(THREE.Group | null)[]>([]);
  const topRailsRef = useRef<(THREE.Group | null)[]>([]);
  const midRailsRef = useRef<(THREE.Group | null)[]>([]);
  const bracketsRef = useRef<(THREE.Group | null)[]>([]);

  // ── Materials (Using steel-gray & brand-blue palette) ─────────────────────
  const mat = useMemo(() => {
    return {
      stringer: new THREE.MeshStandardMaterial({
        color: "#475569", // Slate steel
        metalness: 0.82,
        roughness: 0.28,
      }),
      tread: new THREE.MeshStandardMaterial({
        color: "#94A3B8", // Structural tread plate
        metalness: 0.75,
        roughness: 0.32,
      }),
      nosing: new THREE.MeshStandardMaterial({
        color: "#1E293B", // Dark abrasive nosing strip
        metalness: 0.88,
        roughness: 0.22,
      }),
      handrail: new THREE.MeshStandardMaterial({
        color: "#38BDF8", // Brand sky blue contrasting accent
        emissive: "#0284C7",
        emissiveIntensity: 0.35,
        metalness: 0.65,
        roughness: 0.25,
      }),
      bracket: new THREE.MeshStandardMaterial({
        color: "#F59E0B", // Amber connector clip
        emissive: "#D97706",
        emissiveIntensity: 0.3,
        metalness: 0.8,
        roughness: 0.25,
      }),
      bolt: new THREE.MeshStandardMaterial({
        color: "#E2EDF8", // Zinc coated bright bolt
        metalness: 0.95,
        roughness: 0.15,
      }),
      ladder: new THREE.MeshStandardMaterial({
        color: "#64748B",
        metalness: 0.78,
        roughness: 0.35,
      }),
    };
  }, []);

  const numTreads = 6;
  const treadRun = 0.22;
  const treadRise = 0.18;
  const slopeAngle = Math.atan2(treadRise, treadRun);
  const postHeight = 0.68;

  // Post coordinates along the outer stringer & landing [x, y, z]
  const postPositions: [number, number, number][] = useMemo(
    () => [
      [-0.55, -0.45, 0.28], // Bottom post on stringer
      [-0.11, -0.09, 0.28], // Mid-lower post
      [0.33, 0.27, 0.28],  // Mid-upper post
      [0.65, 0.53, 0.28],  // Landing entry post
      [1.05, 0.53, 0.28],  // Landing end post
    ],
    []
  );

  const railBayLengths = useMemo(
    () => [
      Math.hypot(0.44, 0.36), // Bay 0 (Inclined)
      Math.hypot(0.44, 0.36), // Bay 1 (Inclined)
      Math.hypot(0.32, 0.26), // Bay 2 (Inclined to landing)
      0.40,                   // Bay 3 (Horizontal on landing)
    ],
    []
  );

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const orbitSpeed = isHovered ? 0.6 : 0.32;

    // Isometric 3D framing with gentle turntable sway
    if (rootRef.current) {
      rootRef.current.rotation.y += delta * orbitSpeed;
      rootRef.current.rotation.x = 0.2 + Math.sin(t * 0.8) * 0.04;
      rootRef.current.position.y = Math.sin(t * 1.1) * 0.02 - 0.06;
    }

    const CYCLE_DURATION = 8.5;
    const cycle = (t % CYCLE_DURATION) / CYCLE_DURATION; // 0.0 to 1.0

    // ── 1. Phase 1: Stringers & Landing Supports Settle (0.00 - 0.20) ───────
    const stringerP = isHovered ? 1 : clamp01((cycle - 0.02) / 0.15);
    const easeStr = easeOutCubic(stringerP);

    if (leftStringerRef.current) {
      const zOffset = (1 - easeStr) * -0.45;
      leftStringerRef.current.position.z = -0.28 + zOffset;
      leftStringerRef.current.position.x = -0.05 + (1 - easeStr) * -0.2;
    }
    if (rightStringerRef.current) {
      const zOffset = (1 - easeStr) * 0.45;
      rightStringerRef.current.position.z = 0.28 + zOffset;
      rightStringerRef.current.position.x = -0.05 + (1 - easeStr) * -0.2;
    }
    if (landingSupportRef.current) {
      const xOffset = (1 - easeStr) * 0.35;
      const yOffset = (1 - easeStr) * 0.3;
      landingSupportRef.current.position.x = 0.85 + xOffset;
      landingSupportRef.current.position.y = 0.58 + yOffset;
    }

    // ── 2. Phase 2: Treads Attach Bottom to Top (0.20 - 0.44) ───────────────
    for (let k = 0; k < numTreads; k += 1) {
      const treadNode = treadsRef.current[k];
      if (!treadNode) continue;

      const tStart = 0.20 + k * 0.035;
      const tEnd = tStart + 0.03;
      let p = isHovered ? 1 : clamp01((cycle - tStart) / (tEnd - tStart));

      // Retract on cycle reset
      if (cycle >= 0.92) {
        p = Math.max(0, 1 - (cycle - 0.92) / 0.08);
      }

      const easeT = easeOutCubic(p);
      const tx = (k - 2.5) * treadRun - 0.05;
      const ty = (k - 2.5) * treadRise + 0.04 + (1 - easeT) * 0.22;
      treadNode.position.set(tx, ty, 0);
      treadNode.scale.set(easeT, easeT, easeT);
      treadNode.visible = p > 0.001;
    }

    // Landing floor plate seats
    if (landingFloorRef.current) {
      const lStart = 0.38;
      const lEnd = 0.43;
      let lp = isHovered ? 1 : clamp01((cycle - lStart) / (lEnd - lStart));
      if (cycle >= 0.92) lp = Math.max(0, 1 - (cycle - 0.92) / 0.08);
      const easeL = easeOutCubic(lp);
      landingFloorRef.current.position.y = (numTreads - 2.5) * treadRise + 0.04 + (1 - easeL) * 0.2;
      landingFloorRef.current.scale.set(easeL, easeL, easeL);
      landingFloorRef.current.visible = lp > 0.001;
    }

    // ── 3. Phase 4: Handrail Posts Erect Bottom to Top (0.48 - 0.62) ────────
    for (let i = 0; i < postPositions.length; i += 1) {
      const postNode = postsRef.current[i];
      if (!postNode) continue;

      const pStart = 0.48 + i * 0.024;
      const pEnd = pStart + 0.022;
      let p = isHovered ? 1 : clamp01((cycle - pStart) / (pEnd - pStart));
      if (cycle >= 0.92) p = Math.max(0, 1 - (cycle - 0.92) / 0.08);

      const easeP = easeOutCubic(p);
      postNode.scale.set(1, Math.max(0.001, easeP), 1);
      postNode.visible = p > 0.001;
    }

    // ── 4. Phase 5: Rails Extrude Post to Post (0.62 - 0.76) ────────────────
    for (let i = 0; i < railBayLengths.length; i += 1) {
      const topRailNode = topRailsRef.current[i];
      const midRailNode = midRailsRef.current[i];

      const rStart = 0.62 + i * 0.03;
      const rEnd = rStart + 0.028;
      let rp = isHovered ? 1 : clamp01((cycle - rStart) / (rEnd - rStart));
      if (cycle >= 0.92) rp = Math.max(0, 1 - (cycle - 0.92) / 0.08);

      const easeR = easeOutCubic(rp);
      if (topRailNode) {
        topRailNode.scale.set(Math.max(0.001, easeR), 1, 1);
        topRailNode.visible = rp > 0.001;
      }
      if (midRailNode) {
        midRailNode.scale.set(Math.max(0.001, easeR), 1, 1);
        midRailNode.visible = rp > 0.001;
      }
    }

    // Connection brackets & clips seat
    for (let i = 0; i < postPositions.length; i += 1) {
      const bracketNode = bracketsRef.current[i];
      if (!bracketNode) continue;

      const bStart = 0.65 + i * 0.02;
      const bEnd = bStart + 0.02;
      let bp = isHovered ? 1 : clamp01((cycle - bStart) / (bEnd - bStart));
      if (cycle >= 0.92) bp = Math.max(0, 1 - (cycle - 0.92) / 0.08);

      const easeB = easeOutCubic(bp);
      bracketNode.scale.set(easeB, easeB, easeB);
      bracketNode.visible = bp > 0.001;
    }

    // ── 5. Phase 6: Emissive Inspection Wave Sweep (0.76 - 0.90) ────────────
    let sweepIntensity = isHovered ? 0.65 : 0.35;
    if (cycle >= 0.76 && cycle <= 0.90) {
      const sweepProgress = (cycle - 0.76) / 0.14; // 0 to 1
      const wave = Math.sin(sweepProgress * Math.PI);
      sweepIntensity += wave * 0.55;
    }
    mat.handrail.emissiveIntensity = sweepIntensity;
    mat.bracket.emissiveIntensity = sweepIntensity * 0.75;
  });

  return (
    <group ref={rootRef} position={[-0.1, -0.06, 0]} rotation={[0.2, -0.75, 0]} scale={0.98}>
      {/* ── 1. STRINGER CHANNELS & BASE PLATES (Exploded $\to$ Settle) ─────── */}
      {/* Left Stringer (Inner Z = -0.28) */}
      <group ref={leftStringerRef} position={[-0.05, 0.04, -0.28]}>
        {/* Main C-Channel Body */}
        <mesh rotation={[0, 0, slopeAngle]} material={mat.stringer}>
          <boxGeometry args={[1.75, 0.12, 0.03]} />
        </mesh>
        {/* Top & Bottom Flanges */}
        <mesh position={[0, 0.05, 0.015]} rotation={[0, 0, slopeAngle]} material={mat.stringer}>
          <boxGeometry args={[1.75, 0.02, 0.05]} />
        </mesh>
        <mesh position={[0, -0.05, 0.015]} rotation={[0, 0, slopeAngle]} material={mat.stringer}>
          <boxGeometry args={[1.75, 0.02, 0.05]} />
        </mesh>
        {/* Bottom Base Shoe Plate & Anchor Bolts */}
        <mesh position={[-0.63, -0.54, 0]} material={mat.nosing}>
          <boxGeometry args={[0.18, 0.025, 0.12]} />
        </mesh>
        {[-0.04, 0.04].map((ox, bi) => (
          <mesh key={`l-bolt-${bi}`} position={[-0.63 + ox, -0.51, 0.02]} material={mat.bolt}>
            <cylinderGeometry args={[0.01, 0.01, 0.03, 8]} />
          </mesh>
        ))}
      </group>

      {/* Right Stringer (Outer Z = +0.28) */}
      <group ref={rightStringerRef} position={[-0.05, 0.04, 0.28]}>
        {/* Main C-Channel Body */}
        <mesh rotation={[0, 0, slopeAngle]} material={mat.stringer}>
          <boxGeometry args={[1.75, 0.12, 0.03]} />
        </mesh>
        {/* Top & Bottom Flanges */}
        <mesh position={[0, 0.05, -0.015]} rotation={[0, 0, slopeAngle]} material={mat.stringer}>
          <boxGeometry args={[1.75, 0.02, 0.05]} />
        </mesh>
        <mesh position={[0, -0.05, -0.015]} rotation={[0, 0, slopeAngle]} material={mat.stringer}>
          <boxGeometry args={[1.75, 0.02, 0.05]} />
        </mesh>
        {/* Bottom Base Shoe Plate & Anchor Bolts */}
        <mesh position={[-0.63, -0.54, 0]} material={mat.nosing}>
          <boxGeometry args={[0.18, 0.025, 0.12]} />
        </mesh>
        {[-0.04, 0.04].map((ox, bi) => (
          <mesh key={`r-bolt-${bi}`} position={[-0.63 + ox, -0.51, -0.02]} material={mat.bolt}>
            <cylinderGeometry args={[0.01, 0.01, 0.03, 8]} />
          </mesh>
        ))}
      </group>

      {/* ── 2. LANDING SUPPORT BEAMS & HEADER ───────────────────────────────── */}
      <group ref={landingSupportRef} position={[0.85, 0.58, 0]}>
        {/* Longitudinal Support Channels */}
        <mesh position={[0, -0.06, 0.28]} material={mat.stringer}>
          <boxGeometry args={[0.55, 0.08, 0.03]} />
        </mesh>
        <mesh position={[0, -0.06, -0.28]} material={mat.stringer}>
          <boxGeometry args={[0.55, 0.08, 0.03]} />
        </mesh>
        {/* Transverse End Header Beam */}
        <mesh position={[0.26, -0.06, 0]} material={mat.stringer}>
          <boxGeometry args={[0.03, 0.08, 0.58]} />
        </mesh>
        {/* Connection Clip Angle at Stringer Interface */}
        <mesh position={[-0.26, -0.06, 0.28]} material={mat.bracket}>
          <boxGeometry args={[0.04, 0.07, 0.04]} />
        </mesh>
        <mesh position={[-0.26, -0.06, -0.28]} material={mat.bracket}>
          <boxGeometry args={[0.04, 0.07, 0.04]} />
        </mesh>
      </group>

      {/* Landing Grating / Diamond Plate Floor */}
      <group ref={landingFloorRef} position={[0.85, 0.67, 0]}>
        <mesh position={[0, -0.015, 0]} material={mat.tread}>
          <boxGeometry args={[0.55, 0.028, 0.58]} />
        </mesh>
        {/* Perimeter Safety Kickplate / Toe Guard */}
        <mesh position={[0, 0.03, 0.29]} material={mat.stringer}>
          <boxGeometry args={[0.55, 0.07, 0.015]} />
        </mesh>
        <mesh position={[0.27, 0.03, 0]} material={mat.stringer}>
          <boxGeometry args={[0.015, 0.07, 0.58]} />
        </mesh>
      </group>

      {/* ── 3. STEEL TREADS (Drop in Bottom to Top) ─────────────────────────── */}
      {Array.from({ length: numTreads }).map((_, k) => (
        <group
          key={`tread-group-${k}`}
          ref={(node) => {
            treadsRef.current[k] = node;
          }}
          position={[(k - 2.5) * treadRun - 0.05, (k - 2.5) * treadRise + 0.04, 0]}
        >
          {/* Main Tread Pan */}
          <mesh position={[0, -0.015, 0]} material={mat.tread}>
            <boxGeometry args={[treadRun, 0.028, 0.54]} />
          </mesh>
          {/* Safety Nosing Strip */}
          <mesh position={[treadRun / 2 - 0.01, -0.015, 0]} material={mat.nosing}>
            <boxGeometry args={[0.022, 0.028, 0.54]} />
          </mesh>
          {/* Tread-to-Stringer Attachment Carrier Angles & Bolts */}
          {[-0.27, 0.27].map((sz, si) => (
            <group key={`tread-carrier-${si}`} position={[0, -0.03, sz]}>
              <mesh material={mat.stringer}>
                <boxGeometry args={[treadRun * 0.8, 0.03, 0.02]} />
              </mesh>
              <mesh position={[0, 0, si === 0 ? 0.012 : -0.012]} material={mat.bolt}>
                <cylinderGeometry args={[0.008, 0.008, 0.018, 6]} />
              </mesh>
            </group>
          ))}
        </group>
      ))}

      {/* ── 4. VERTICAL HANDRAIL POSTS (Constructed Sequentially) ───────────── */}
      {postPositions.map(([px, py, pz], idx) => (
        <group
          key={`post-group-${idx}`}
          ref={(node) => {
            postsRef.current[idx] = node;
          }}
          position={[px, py, pz]}
        >
          {/* Round HSS Handrail Stanchion (Pivots upward from base) */}
          <mesh position={[0, postHeight / 2, 0]} material={mat.handrail}>
            <cylinderGeometry args={[0.017, 0.017, postHeight, 14]} />
          </mesh>
        </group>
      ))}

      {/* ── 5. TOP HANDRAIL (Extrudes Bay by Bay) ───────────────────────────── */}
      {/* Bay 0: Post 0 $\to$ Post 1 (Inclined) */}
      <group
        ref={(node) => {
          topRailsRef.current[0] = node;
        }}
        position={[-0.55, -0.45 + postHeight, 0.28]}
      >
        <group rotation={[0, 0, slopeAngle]}>
          <mesh
            position={[railBayLengths[0] / 2, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
            material={mat.handrail}
          >
            <cylinderGeometry args={[0.019, 0.019, railBayLengths[0], 14]} />
          </mesh>
        </group>
      </group>

      {/* Bay 1: Post 1 $\to$ Post 2 (Inclined) */}
      <group
        ref={(node) => {
          topRailsRef.current[1] = node;
        }}
        position={[-0.11, -0.09 + postHeight, 0.28]}
      >
        <group rotation={[0, 0, slopeAngle]}>
          <mesh
            position={[railBayLengths[1] / 2, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
            material={mat.handrail}
          >
            <cylinderGeometry args={[0.019, 0.019, railBayLengths[1], 14]} />
          </mesh>
        </group>
      </group>

      {/* Bay 2: Post 2 $\to$ Post 3 (Inclined to Landing) */}
      <group
        ref={(node) => {
          topRailsRef.current[2] = node;
        }}
        position={[0.33, 0.27 + postHeight, 0.28]}
      >
        <group rotation={[0, 0, slopeAngle]}>
          <mesh
            position={[railBayLengths[2] / 2, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
            material={mat.handrail}
          >
            <cylinderGeometry args={[0.019, 0.019, railBayLengths[2], 14]} />
          </mesh>
        </group>
      </group>

      {/* Bay 3: Post 3 $\to$ Post 4 (Horizontal on Landing) */}
      <group
        ref={(node) => {
          topRailsRef.current[3] = node;
        }}
        position={[0.65, 0.53 + postHeight, 0.28]}
      >
        <mesh
          position={[railBayLengths[3] / 2, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
          material={mat.handrail}
        >
          <cylinderGeometry args={[0.019, 0.019, railBayLengths[3], 14]} />
        </mesh>
      </group>

      {/* ── 6. MID RAIL (Extrudes Bay by Bay) ───────────────────────────────── */}
      {/* Bay 0 */}
      <group
        ref={(node) => {
          midRailsRef.current[0] = node;
        }}
        position={[-0.55, -0.45 + postHeight * 0.52, 0.28]}
      >
        <group rotation={[0, 0, slopeAngle]}>
          <mesh
            position={[railBayLengths[0] / 2, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
            material={mat.handrail}
          >
            <cylinderGeometry args={[0.013, 0.013, railBayLengths[0], 12]} />
          </mesh>
        </group>
      </group>

      {/* Bay 1 */}
      <group
        ref={(node) => {
          midRailsRef.current[1] = node;
        }}
        position={[-0.11, -0.09 + postHeight * 0.52, 0.28]}
      >
        <group rotation={[0, 0, slopeAngle]}>
          <mesh
            position={[railBayLengths[1] / 2, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
            material={mat.handrail}
          >
            <cylinderGeometry args={[0.013, 0.013, railBayLengths[1], 12]} />
          </mesh>
        </group>
      </group>

      {/* Bay 2 */}
      <group
        ref={(node) => {
          midRailsRef.current[2] = node;
        }}
        position={[0.33, 0.27 + postHeight * 0.52, 0.28]}
      >
        <group rotation={[0, 0, slopeAngle]}>
          <mesh
            position={[railBayLengths[2] / 2, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
            material={mat.handrail}
          >
            <cylinderGeometry args={[0.013, 0.013, railBayLengths[2], 12]} />
          </mesh>
        </group>
      </group>

      {/* Bay 3 (Horizontal on Landing) */}
      <group
        ref={(node) => {
          midRailsRef.current[3] = node;
        }}
        position={[0.65, 0.53 + postHeight * 0.52, 0.28]}
      >
        <mesh
          position={[railBayLengths[3] / 2, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
          material={mat.handrail}
        >
          <cylinderGeometry args={[0.013, 0.013, railBayLengths[3], 12]} />
        </mesh>
      </group>

      {/* ── 7. CONNECTION BRACKETS & HARDWARE (Pop in at Post Junctions) ───── */}
      {postPositions.map(([px, py, pz], idx) => (
        <group
          key={`bracket-group-${idx}`}
          ref={(node) => {
            bracketsRef.current[idx] = node;
          }}
          position={[px, py, pz]}
        >
          {/* Base mounting clip on outer stringer */}
          <mesh position={[0, 0.025, 0]} material={mat.bracket}>
            <boxGeometry args={[0.065, 0.045, 0.065]} />
          </mesh>
          {/* Fastening bolt through stringer web */}
          <mesh position={[0, 0.025, -0.035]} rotation={[Math.PI / 2, 0, 0]} material={mat.bolt}>
            <cylinderGeometry args={[0.009, 0.009, 0.03, 6]} />
          </mesh>
          {/* Top rail saddle bracket collar */}
          <mesh position={[0, postHeight, 0]} material={mat.bracket}>
            <boxGeometry args={[0.045, 0.035, 0.045]} />
          </mesh>
        </group>
      ))}

      {/* ── 8. BACKGROUND INDUSTRIAL COMPLEMENT (Safety Caged Ladder) ───────── */}
      <group position={[1.15, 0.25, -0.32]}>
        <mesh position={[-0.1, 0, 0]} material={mat.ladder}>
          <boxGeometry args={[0.022, 1.45, 0.022]} />
        </mesh>
        <mesh position={[0.1, 0, 0]} material={mat.ladder}>
          <boxGeometry args={[0.022, 1.45, 0.022]} />
        </mesh>
        {Array.from({ length: 7 }).map((_, r) => (
          <mesh
            key={`ladder-rung-${r}`}
            position={[0, (r - 3) * 0.21, 0]}
            rotation={[0, 0, Math.PI / 2]}
            material={mat.ladder}
          >
            <cylinderGeometry args={[0.009, 0.009, 0.2, 8]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
