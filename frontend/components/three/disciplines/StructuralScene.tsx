"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * 02 — STRUCTURAL STEEL DETAILING 3D ANIMATION (FEATURED CARD)
 * Concept: MODEL → DETAIL → SHOP DRAWING
 * Features:
 * - Columns, beams, chevron cross braces, floor infill framing
 * - Connection shear tabs & gusset plates with hex bolt patterns
 * - Slow rotation and hover highlights
 */
export default function StructuralScene({ isHovered }: { isHovered: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const connPointsRef = useRef<THREE.Group>(null);

  // Materials
  const steelMainMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: isHovered ? "#2563EB" : "#334155",
        metalness: 0.85,
        roughness: 0.2,
      }),
    [isHovered]
  );

  const steelAccentMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#38BDF8",
        emissive: "#0284C7",
        emissiveIntensity: isHovered ? 0.7 : 0.3,
        metalness: 0.75,
        roughness: 0.2,
      }),
    [isHovered]
  );

  const plateMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#64748B",
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

  // Connection node locations
  const connNodes: [number, number, number][] = useMemo(
    () => [
      [-1.2, 0.45, -0.8],
      [1.2, 0.45, -0.8],
      [-1.2, 0.45, 0.8],
      [1.2, 0.45, 0.8],
      [0, 0.45, -0.8],
      [0, 0.45, 0.8],
      [-1.2, 1.3, -0.8],
      [1.2, 1.3, -0.8],
      [-1.2, 1.3, 0.8],
      [1.2, 1.3, 0.8],
    ],
    []
  );

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const speed = isHovered ? 0.75 : 0.4;

    if (groupRef.current) {
      groupRef.current.rotation.y += delta * speed;
      const targetRotX = isHovered ? 0.12 : 0.04;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        targetRotX,
        0.1
      );
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        Math.sin(t * 1.6) * 0.04 - 0.2,
        0.1
      );
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.2, 0]} scale={0.95}>
      {/* 4 Heavy Structural Columns */}
      {[
        [-1.2, -0.8],
        [1.2, -0.8],
        [-1.2, 0.8],
        [1.2, 0.8],
      ].map(([cx, cz], i) => (
        <group key={`col-${i}`} position={[cx, 0.45, cz]}>
          {/* Column Web */}
          <mesh material={steelMainMat}>
            <boxGeometry args={[0.05, 2.0, 0.15]} />
          </mesh>
          {/* Column Flanges */}
          <mesh position={[0.07, 0, 0]} material={steelMainMat}>
            <boxGeometry args={[0.15, 2.0, 0.03]} />
          </mesh>
          <mesh position={[-0.07, 0, 0]} material={steelMainMat}>
            <boxGeometry args={[0.15, 2.0, 0.03]} />
          </mesh>
          {/* Base Plate with Anchor Bolts */}
          <mesh position={[0, -1.0, 0]} material={plateMat}>
            <boxGeometry args={[0.26, 0.04, 0.26]} />
          </mesh>
        </group>
      ))}

      {/* Primary Floor Girders (Lower Level Y=0.45) */}
      <mesh position={[0, 0.45, -0.8]} material={steelMainMat}>
        <boxGeometry args={[2.4, 0.11, 0.07]} />
      </mesh>
      <mesh position={[0, 0.45, 0.8]} material={steelMainMat}>
        <boxGeometry args={[2.4, 0.11, 0.07]} />
      </mesh>
      <mesh position={[-1.2, 0.45, 0]} material={steelMainMat}>
        <boxGeometry args={[0.07, 0.11, 1.6]} />
      </mesh>
      <mesh position={[1.2, 0.45, 0]} material={steelMainMat}>
        <boxGeometry args={[0.07, 0.11, 1.6]} />
      </mesh>
      <mesh position={[0, 0.45, 0]} material={steelMainMat}>
        <boxGeometry args={[0.07, 0.11, 1.6]} />
      </mesh>

      {/* Upper Roof Girders (Level Y=1.3) */}
      <mesh position={[0, 1.3, -0.8]} material={steelMainMat}>
        <boxGeometry args={[2.4, 0.09, 0.06]} />
      </mesh>
      <mesh position={[0, 1.3, 0.8]} material={steelMainMat}>
        <boxGeometry args={[2.4, 0.09, 0.06]} />
      </mesh>
      <mesh position={[-1.2, 1.3, 0]} material={steelMainMat}>
        <boxGeometry args={[0.06, 0.09, 1.6]} />
      </mesh>
      <mesh position={[1.2, 1.3, 0]} material={steelMainMat}>
        <boxGeometry args={[0.06, 0.09, 1.6]} />
      </mesh>

      {/* Chevron / Diagonal Cross Bracing (Back Wall) */}
      <group position={[0, 0.45, -0.8]}>
        <mesh position={[-0.6, 0.42, 0]} rotation={[0, 0, Math.PI / 5]} material={steelAccentMat}>
          <boxGeometry args={[1.4, 0.05, 0.05]} />
        </mesh>
        <mesh position={[0.6, 0.42, 0]} rotation={[0, 0, -Math.PI / 5]} material={steelAccentMat}>
          <boxGeometry args={[1.4, 0.05, 0.05]} />
        </mesh>
        {/* Central Gusset Plate */}
        <mesh position={[0, 0.85, 0]} material={plateMat}>
          <boxGeometry args={[0.2, 0.2, 0.02]} />
        </mesh>
      </group>

      {/* Connection Shear Tabs & Bolt Clusters */}
      <group ref={connPointsRef}>
        {connNodes.map((pos, i) => (
          <group key={`conn-${i}`} position={pos}>
            <mesh material={steelAccentMat}>
              <boxGeometry args={[0.12, 0.12, 0.12]} />
            </mesh>
            {/* Hex Bolt heads */}
            <mesh position={[0.07, 0.035, 0.07]} rotation={[0, 0, Math.PI / 2]} material={boltMat}>
              <cylinderGeometry args={[0.018, 0.018, 0.025, 6]} />
            </mesh>
            <mesh position={[0.07, -0.035, 0.07]} rotation={[0, 0, Math.PI / 2]} material={boltMat}>
              <cylinderGeometry args={[0.018, 0.018, 0.025, 6]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
