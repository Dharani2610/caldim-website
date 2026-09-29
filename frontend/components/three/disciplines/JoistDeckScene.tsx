"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * 05 — JOIST & DECK DETAILING 3D ANIMATION
 * Concept: BEAMS → JOISTS → DECK → FLOOR SYSTEM
 * Elements: Primary wide-flange support beams, 4 Open-Web Steel Joists (K-Series)
 * with top/bottom double angles and zig-zag web bars, corrugated metal deck sheets.
 * Sequence: Beams anchor → Joists slide in → Deck panels spread across.
 */
export default function JoistDeckScene({ isHovered }: { isHovered: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const joistsGroupRef = useRef<THREE.Group>(null);
  const deckGroupRef = useRef<THREE.Group>(null);

  // Materials
  const beamMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#334155",
        metalness: 0.8,
        roughness: 0.25,
      }),
    []
  );

  const joistMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#2563EB",
        emissive: "#1D4ED8",
        emissiveIntensity: 0.25,
        metalness: 0.75,
        roughness: 0.3,
      }),
    []
  );

  const deckMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#94A3B8",
        metalness: 0.6,
        roughness: 0.35,
      }),
    []
  );

  const joistPositions = [-0.8, -0.27, 0.27, 0.8];

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const speed = isHovered ? 0.75 : 0.4;

    if (groupRef.current) {
      groupRef.current.rotation.y += delta * speed;
      groupRef.current.rotation.x = Math.sin(t * 0.7) * 0.05 + 0.32;
    }

    // Sequence animation cycle (7-second loop)
    const cycle = (t % 7) / 7;

    // Joists slide into place from 0 to 0.3
    let joistSlide = 0;
    if (cycle < 0.3) {
      joistSlide = Math.pow(1 - cycle / 0.3, 2);
    } else {
      joistSlide = 0;
    }

    // Deck sheets spread from 0.3 to 0.65
    let deckSpread = 0;
    if (cycle < 0.3) {
      deckSpread = 0;
    } else if (cycle < 0.65) {
      deckSpread = (cycle - 0.3) / 0.35;
    } else {
      deckSpread = 1;
    }

    if (isHovered) {
      joistSlide = 0;
      deckSpread = 1;
    }

    // Animate joists sliding into position along Z axis
    if (joistsGroupRef.current) {
      joistsGroupRef.current.children.forEach((joist, idx) => {
        joist.position.z = joist.userData.origZ + (idx % 2 === 0 ? 1 : -1) * joistSlide * 0.7;
      });
    }

    // Animate deck panels
    if (deckGroupRef.current) {
      deckGroupRef.current.children.forEach((panel, idx) => {
        const threshold = idx / 4;
        const visible = deckSpread >= threshold;
        panel.visible = visible;
        panel.scale.set(visible ? 1 : 0.01, visible ? 1 : 0.01, visible ? 1 : 0.01);
      });
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.1, 0]} scale={0.95}>
      {/* Primary Supporting Beams (Left and Right Y=0) */}
      <group position={[-1.1, -0.2, 0]}>
        <mesh material={beamMat}>
          <boxGeometry args={[0.09, 0.26, 2.2]} />
        </mesh>
        <mesh position={[0, 0.13, 0]} material={beamMat}>
          <boxGeometry args={[0.2, 0.035, 2.2]} />
        </mesh>
      </group>

      <group position={[1.1, -0.2, 0]}>
        <mesh material={beamMat}>
          <boxGeometry args={[0.09, 0.26, 2.2]} />
        </mesh>
        <mesh position={[0, 0.13, 0]} material={beamMat}>
          <boxGeometry args={[0.2, 0.035, 2.2]} />
        </mesh>
      </group>

      {/* 4 Open-Web Steel Joists */}
      <group ref={joistsGroupRef}>
        {joistPositions.map((zPos, i) => (
          <group
            key={`joist-${i}`}
            position={[0, 0.05, zPos]}
            userData={{ origX: 0, origY: 0.05, origZ: zPos }}
          >
            {/* Top Chord */}
            <mesh position={[0, 0.15, 0]} material={joistMat}>
              <boxGeometry args={[2.2, 0.035, 0.07]} />
            </mesh>
            {/* Bottom Chord */}
            <mesh position={[0, -0.15, 0]} material={joistMat}>
              <boxGeometry args={[1.9, 0.035, 0.07]} />
            </mesh>
            {/* Joist Bearing Shoes */}
            <mesh position={[-1.05, 0.05, 0]} material={joistMat}>
              <boxGeometry args={[0.12, 0.16, 0.07]} />
            </mesh>
            <mesh position={[1.05, 0.05, 0]} material={joistMat}>
              <boxGeometry args={[0.12, 0.16, 0.07]} />
            </mesh>

            {/* Zig-zag Web Diagonal Lattice Bars */}
            {Array.from({ length: 8 }).map((_, j) => {
              const xStart = -0.85 + j * 0.22;
              const angle = j % 2 === 0 ? Math.PI / 4 : -Math.PI / 4;
              return (
                <mesh
                  key={`web-${j}`}
                  position={[xStart + 0.11, 0, 0]}
                  rotation={[0, 0, angle]}
                  material={joistMat}
                >
                  <cylinderGeometry args={[0.01, 0.01, 0.35, 8]} />
                </mesh>
              );
            })}
          </group>
        ))}
      </group>

      {/* Corrugated Metal Decking Sheets */}
      <group ref={deckGroupRef} position={[0, 0.24, 0]}>
        {[-0.75, -0.25, 0.25, 0.75].map((zDeck, dIdx) => (
          <group key={`deck-${dIdx}`} position={[0, 0, zDeck]}>
            {/* Corrugated Fluted Profile */}
            {Array.from({ length: 9 }).map((_, rib) => {
              const xRib = (rib - 4) * 0.24;
              return (
                <group key={`rib-${rib}`} position={[xRib, 0, 0]}>
                  <mesh position={[0, 0.025, 0]} material={deckMat}>
                    <boxGeometry args={[0.11, 0.012, 0.48]} />
                  </mesh>
                  <mesh position={[0.12, 0, 0]} material={deckMat}>
                    <boxGeometry args={[0.11, 0.012, 0.48]} />
                  </mesh>
                  <mesh position={[0.06, 0.012, 0]} rotation={[0, 0, -Math.PI / 4]} material={deckMat}>
                    <boxGeometry args={[0.04, 0.01, 0.48]} />
                  </mesh>
                </group>
              );
            })}
          </group>
        ))}
      </group>
    </group>
  );
}
