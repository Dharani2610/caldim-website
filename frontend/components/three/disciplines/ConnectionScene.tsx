"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * 04 — CONNECTIONS DESIGN WITH PE STAMP 3D ANIMATION
 * Concept: ENGINEERED MOMENT/SHEAR CONNECTION & VERIFICATION
 * Elements: W14x90 Column, W18x50 Beam with coped flanges, Shear Tab Plate,
 * continuity stiffeners, 6× A490 Hex Bolts.
 * Front-facing perspective angle highlighting connection tab and bolt locking.
 */
export default function ConnectionScene({ isHovered }: { isHovered: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Group>(null);
  const plateRef = useRef<THREE.Mesh>(null);
  const boltsGroupRef = useRef<THREE.Group>(null);

  // Materials
  const columnMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#475569",
        metalness: 0.85,
        roughness: 0.25,
      }),
    []
  );

  const beamMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#2563EB",
        emissive: "#1D4ED8",
        emissiveIntensity: 0.3,
        metalness: 0.8,
        roughness: 0.25,
      }),
    []
  );

  const plateMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#38BDF8",
        emissive: "#0284C7",
        emissiveIntensity: 0.45,
        metalness: 0.9,
        roughness: 0.15,
      }),
    []
  );

  const boltMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#F8FAFC",
        metalness: 0.95,
        roughness: 0.1,
      }),
    []
  );

  const stiffenerMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#64748B",
        metalness: 0.85,
        roughness: 0.25,
      }),
    []
  );

  // Bolt hole positions (2 columns × 3 rows = 6 bolts)
  const boltPositions: [number, number, number][] = useMemo(
    () => [
      [0.08, 0.2, -0.05],
      [0.08, 0.2, 0.05],
      [0.08, 0.0, -0.05],
      [0.08, 0.0, 0.05],
      [0.08, -0.2, -0.05],
      [0.08, -0.2, 0.05],
    ],
    []
  );

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const speed = isHovered ? 0.6 : 0.3;

    if (groupRef.current) {
      groupRef.current.rotation.y += delta * speed;
      groupRef.current.rotation.x = Math.sin(t * 0.8) * 0.04 + 0.22;
    }

    // Connection lock animation cycle (7-second loop)
    const cycle = (t % 7) / 7;

    let approach = 0;
    let boltSlide = 0;

    if (cycle < 0.35) {
      approach = Math.pow(1 - cycle / 0.35, 2);
      boltSlide = 1;
    } else if (cycle < 0.55) {
      approach = 0;
      const boltProgress = (cycle - 0.35) / 0.2;
      boltSlide = Math.pow(1 - boltProgress, 2);
    } else if (cycle < 0.85) {
      approach = 0;
      boltSlide = 0;
    } else {
      const retract = (cycle - 0.85) / 0.15;
      approach = retract;
      boltSlide = retract;
    }

    if (isHovered) {
      approach = 0;
      boltSlide = 0;
    }

    if (beamRef.current) {
      beamRef.current.position.x = 0.55 + approach * 0.75;
    }

    if (boltsGroupRef.current) {
      boltsGroupRef.current.children.forEach((bolt) => {
        bolt.position.x = bolt.userData.origX + boltSlide * 0.3;
      });
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.1, 0]} rotation={[0.22, -0.9, 0]} scale={1.15}>
      {/* Heavy Structural Column (Vertical W14) */}
      <group position={[-0.45, 0, 0]}>
        {/* Column Web */}
        <mesh material={columnMat}>
          <boxGeometry args={[0.06, 2.2, 0.38]} />
        </mesh>
        {/* Column Flange - Left */}
        <mesh position={[-0.18, 0, 0]} material={columnMat}>
          <boxGeometry args={[0.07, 2.2, 0.42]} />
        </mesh>
        {/* Column Flange - Right (Facing Beam) */}
        <mesh position={[0.18, 0, 0]} material={columnMat}>
          <boxGeometry args={[0.07, 2.2, 0.42]} />
        </mesh>

        {/* Continuity Stiffener Plates inside Column */}
        <mesh position={[0, 0.33, 0]} material={stiffenerMat}>
          <boxGeometry args={[0.3, 0.035, 0.36]} />
        </mesh>
        <mesh position={[0, -0.33, 0]} material={stiffenerMat}>
          <boxGeometry args={[0.3, 0.035, 0.36]} />
        </mesh>

        {/* Base Plate */}
        <mesh position={[0, -1.05, 0]} material={stiffenerMat}>
          <boxGeometry args={[0.5, 0.05, 0.5]} />
        </mesh>
      </group>

      {/* Shear Tab / Moment Plate (Welded to Column Flange) */}
      <mesh ref={plateRef} position={[-0.14, 0, 0]} material={plateMat}>
        <boxGeometry args={[0.22, 0.58, 0.035]} />
      </mesh>

      {/* Incoming W18 Cantilever Beam */}
      <group ref={beamRef} position={[0.55, 0, 0]}>
        {/* Beam Web */}
        <mesh material={beamMat}>
          <boxGeometry args={[1.2, 0.6, 0.035]} />
        </mesh>
        {/* Top Flange */}
        <mesh position={[0, 0.31, 0]} material={beamMat}>
          <boxGeometry args={[1.2, 0.05, 0.28]} />
        </mesh>
        {/* Bottom Flange */}
        <mesh position={[0, -0.31, 0]} material={beamMat}>
          <boxGeometry args={[1.2, 0.05, 0.28]} />
        </mesh>
      </group>

      {/* Hex Bolt Group */}
      <group ref={boltsGroupRef} position={[-0.12, 0, 0]}>
        {boltPositions.map((pos, i) => (
          <group
            key={`bolt-${i}`}
            position={pos}
            userData={{ origX: pos[0], origY: pos[1], origZ: pos[2] }}
          >
            {/* Hex Bolt Head */}
            <mesh rotation={[0, Math.PI / 2, 0]} material={boltMat}>
              <cylinderGeometry args={[0.026, 0.026, 0.035, 6]} />
            </mesh>
            {/* Bolt Shank / Washer */}
            <mesh position={[-0.035, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={boltMat}>
              <cylinderGeometry args={[0.016, 0.016, 0.1, 12]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
