"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * 03 — MISCELLANEOUS STEEL DETAILING 3D ANIMATION
 * Concept: COMPONENTS → ASSEMBLY → DETAIL
 * Elements: Industrial stairs, C-channel stringers, diamond-plate treads,
 * intermediate landing platform, 42" OSHA safety handrails, caged ladder.
 * Sequence: Exploded components glide into assembled lock position.
 */
export default function MiscSteelScene({ isHovered }: { isHovered: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const explodedGroupRef = useRef<THREE.Group>(null);

  // Materials
  const stringerMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#475569",
        metalness: 0.8,
        roughness: 0.25,
      }),
    []
  );

  const treadMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#38BDF8",
        emissive: "#0369A1",
        emissiveIntensity: 0.3,
        metalness: 0.7,
        roughness: 0.3,
      }),
    []
  );

  const handrailMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#F59E0B",
        metalness: 0.6,
        roughness: 0.2,
      }),
    []
  );

  const ladderMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#94A3B8",
        metalness: 0.85,
        roughness: 0.2,
      }),
    []
  );

  const numTreads = 7;
  const treadRise = 0.16;
  const treadRun = 0.2;

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const speed = isHovered ? 0.75 : 0.4;

    if (groupRef.current) {
      groupRef.current.rotation.y += delta * speed;
      groupRef.current.position.y = Math.sin(t * 1.2) * 0.03 - 0.15;
    }

    // Exploded-to-assembled animation cycle (6-second loop)
    if (explodedGroupRef.current) {
      const cycle = (t % 6) / 6;
      let explodeFactor = 0;
      if (cycle < 0.4) {
        explodeFactor = Math.pow(1 - cycle / 0.4, 2);
      } else if (cycle < 0.8) {
        explodeFactor = 0;
      } else {
        explodeFactor = (cycle - 0.8) / 0.2;
      }

      if (isHovered) explodeFactor = 0;

      explodedGroupRef.current.children.forEach((child, idx) => {
        const offsetDirection = (idx % 3) - 1;
        child.position.x = child.userData.origX + offsetDirection * explodeFactor * 0.35;
        child.position.y = child.userData.origY + (idx % 2 === 0 ? 1 : -1) * explodeFactor * 0.25;
        child.position.z = child.userData.origZ + (idx > 4 ? 1 : -1) * explodeFactor * 0.3;
      });
    }
  });

  return (
    <group ref={groupRef} position={[-0.1, -0.2, 0]} scale={0.95}>
      <group ref={explodedGroupRef}>
        {/* Left Stringer Channel (Sloped) */}
        <mesh
          position={[-0.35, (numTreads * treadRise) / 2, -0.4]}
          rotation={[0, 0, Math.atan2(numTreads * treadRise, numTreads * treadRun)]}
          material={stringerMat}
          userData={{ origX: -0.35, origY: (numTreads * treadRise) / 2, origZ: -0.4 }}
        >
          <boxGeometry args={[1.6, 0.12, 0.03]} />
        </mesh>

        {/* Right Stringer Channel (Sloped) */}
        <mesh
          position={[-0.35, (numTreads * treadRise) / 2, 0.4]}
          rotation={[0, 0, Math.atan2(numTreads * treadRise, numTreads * treadRun)]}
          material={stringerMat}
          userData={{ origX: -0.35, origY: (numTreads * treadRise) / 2, origZ: 0.4 }}
        >
          <boxGeometry args={[1.6, 0.12, 0.03]} />
        </mesh>

        {/* Stair Treads */}
        {Array.from({ length: numTreads }).map((_, i) => {
          const tx = (i - numTreads / 2) * treadRun - 0.35;
          const ty = i * treadRise - 0.1;
          return (
            <group
              key={`tread-${i}`}
              position={[tx, ty, 0]}
              userData={{ origX: tx, origY: ty, origZ: 0 }}
            >
              {/* Pan */}
              <mesh material={treadMat}>
                <boxGeometry args={[treadRun, 0.035, 0.8]} />
              </mesh>
              {/* Nose bar */}
              <mesh position={[treadRun / 2, -0.02, 0]} material={stringerMat}>
                <boxGeometry args={[0.02, 0.035, 0.8]} />
              </mesh>
            </group>
          );
        })}

        {/* Top Intermediate Landing Platform */}
        <group
          position={[0.5, numTreads * treadRise - 0.1, 0]}
          userData={{ origX: 0.5, origY: numTreads * treadRise - 0.1, origZ: 0 }}
        >
          {/* Platform Floor Grating */}
          <mesh material={treadMat}>
            <boxGeometry args={[0.8, 0.04, 1.0]} />
          </mesh>
          {/* Perimeter Channel Frame */}
          <mesh position={[0, -0.05, 0.5]} material={stringerMat}>
            <boxGeometry args={[0.8, 0.08, 0.03]} />
          </mesh>
          <mesh position={[0, -0.05, -0.5]} material={stringerMat}>
            <boxGeometry args={[0.8, 0.08, 0.03]} />
          </mesh>
          <mesh position={[0.4, -0.05, 0]} material={stringerMat}>
            <boxGeometry args={[0.03, 0.08, 1.0]} />
          </mesh>
        </group>

        {/* Handrails & Guardrails (Yellow Safety Accent) */}
        <group
          position={[-0.35, (numTreads * treadRise) / 2 + 0.4, 0.42]}
          rotation={[0, 0, Math.atan2(numTreads * treadRise, numTreads * treadRun)]}
          userData={{ origX: -0.35, origY: (numTreads * treadRise) / 2 + 0.4, origZ: 0.42 }}
        >
          {/* Top Rail (42" Height) */}
          <mesh position={[0, 0.1, 0]} rotation={[0, 0, Math.PI / 2]} material={handrailMat}>
            <cylinderGeometry args={[0.018, 0.018, 1.6, 12]} />
          </mesh>
          {/* Mid Rail (21" Height) */}
          <mesh position={[0, -0.07, 0]} rotation={[0, 0, Math.PI / 2]} material={handrailMat}>
            <cylinderGeometry args={[0.014, 0.014, 1.6, 12]} />
          </mesh>
        </group>

        {/* Industrial Safety Caged Ladder */}
        <group
          position={[0.95, 0.35, -0.35]}
          userData={{ origX: 0.95, origY: 0.35, origZ: -0.35 }}
        >
          {/* Side Rails */}
          <mesh position={[-0.12, 0, 0]} material={ladderMat}>
            <boxGeometry args={[0.025, 1.5, 0.025]} />
          </mesh>
          <mesh position={[0.12, 0, 0]} material={ladderMat}>
            <boxGeometry args={[0.025, 1.5, 0.025]} />
          </mesh>
          {/* Rungs */}
          {Array.from({ length: 7 }).map((_, r) => (
            <mesh key={`rung-${r}`} position={[0, (r - 3) * 0.2, 0]} rotation={[0, 0, Math.PI / 2]} material={ladderMat}>
              <cylinderGeometry args={[0.01, 0.01, 0.24, 8]} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}
