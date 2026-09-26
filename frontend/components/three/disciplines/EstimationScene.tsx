"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * 01 — ESTIMATION & TAKEOFF 3D ANIMATION
 * Concept: 3D MODEL → MEASURE → COUNT → TAKEOFF
 * Sequence:
 * 1. Columns appear
 * 2. Beams appear
 * 3. Members highlight one by one with a scanning laser plane
 * 4. Dimension lines appear with measurement ticks
 * 5. Quantity markers / count indicators
 * 6. Model rotates smoothly
 */
export default function EstimationScene({ isHovered }: { isHovered: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const scanRef = useRef<THREE.Mesh>(null);

  // Column positions: 4 corner columns + 2 center columns
  const columnPositions: [number, number, number][] = useMemo(
    () => [
      [-1.3, 0, -0.9],
      [1.3, 0, -0.9],
      [-1.3, 0, 0.9],
      [1.3, 0, 0.9],
      [0, 0, -0.9],
      [0, 0, 0.9],
    ],
    []
  );

  // Beam definitions
  const beams: { pos: [number, number, number]; size: [number, number, number] }[] = useMemo(
    () => [
      // Lower perimeter girders
      { pos: [0, 0.5, -0.9], size: [2.6, 0.08, 0.08] },
      { pos: [0, 0.5, 0.9], size: [2.6, 0.08, 0.08] },
      { pos: [-1.3, 0.5, 0], size: [0.08, 0.08, 1.8] },
      { pos: [1.3, 0.5, 0], size: [0.08, 0.08, 1.8] },
      { pos: [0, 0.5, 0], size: [0.08, 0.08, 1.8] },
      // Upper roof girders
      { pos: [0, 1.3, -0.9], size: [2.6, 0.08, 0.08] },
      { pos: [0, 1.3, 0.9], size: [2.6, 0.08, 0.08] },
      { pos: [-1.3, 1.3, 0], size: [0.08, 0.08, 1.8] },
      { pos: [1.3, 1.3, 0], size: [0.08, 0.08, 1.8] },
      { pos: [0, 1.3, 0], size: [0.08, 0.08, 1.8] },
      // Intermediate joists
      { pos: [-0.65, 1.3, 0], size: [0.06, 0.06, 1.8] },
      { pos: [0.65, 1.3, 0], size: [0.06, 0.06, 1.8] },
    ],
    []
  );

  // Materials
  const steelMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#475569",
        metalness: 0.8,
        roughness: 0.25,
      }),
    []
  );

  const activeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#2563EB",
        emissive: "#1D4ED8",
        emissiveIntensity: 0.45,
        metalness: 0.7,
        roughness: 0.2,
      }),
    []
  );

  const gridMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#94A3B8",
        transparent: true,
        opacity: 0.35,
      }),
    []
  );

  // Foundation grid line geometry
  const gridLines = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let x = -2; x <= 2; x += 0.5) {
      pts.push(new THREE.Vector3(x, -0.7, -1.4), new THREE.Vector3(x, -0.7, 1.4));
    }
    for (let z = -1.4; z <= 1.4; z += 0.5) {
      pts.push(new THREE.Vector3(-2, -0.7, z), new THREE.Vector3(2, -0.7, z));
    }
    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    return geom;
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const speed = isHovered ? 0.7 : 0.35;

    if (groupRef.current) {
      groupRef.current.rotation.y += delta * speed;
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        Math.sin(t * 1.5) * 0.04 - 0.1,
        0.1
      );
    }

    // Scanning laser plane oscillation
    if (scanRef.current) {
      scanRef.current.position.x = Math.sin(t * 1.8) * 1.5;
      scanRef.current.position.y = 0.3 + Math.cos(t * 1.2) * 0.5;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.1, 0]} scale={0.95}>
      {/* Foundation Base Grid */}
      <lineSegments geometry={gridLines} material={gridMat} />

      {/* Concrete Foundation Footings */}
      {columnPositions.map((pos, i) => (
        <mesh key={`footing-${i}`} position={[pos[0], -0.65, pos[2]]}>
          <boxGeometry args={[0.34, 0.1, 0.34]} />
          <meshStandardMaterial color="#CBD5E1" roughness={0.7} metalness={0.1} />
        </mesh>
      ))}

      {/* Steel Columns */}
      {columnPositions.map((pos, i) => (
        <group key={`col-${i}`} position={[pos[0], 0.3, pos[2]]}>
          {/* I-Beam Web */}
          <mesh material={i % 2 === 0 ? activeMat : steelMat}>
            <boxGeometry args={[0.04, 1.9, 0.14]} />
          </mesh>
          {/* I-Beam Flanges */}
          <mesh position={[0.07, 0, 0]} material={i % 2 === 0 ? activeMat : steelMat}>
            <boxGeometry args={[0.12, 1.9, 0.03]} />
          </mesh>
          <mesh position={[-0.07, 0, 0]} material={i % 2 === 0 ? activeMat : steelMat}>
            <boxGeometry args={[0.12, 1.9, 0.03]} />
          </mesh>
          {/* Base plate */}
          <mesh position={[0, -0.93, 0]}>
            <boxGeometry args={[0.22, 0.04, 0.22]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Steel Beams & Girders */}
      {beams.map((b, i) => (
        <mesh key={`beam-${i}`} position={b.pos} material={i < 4 ? activeMat : steelMat}>
          <boxGeometry args={b.size} />
        </mesh>
      ))}

      {/* Scanning Measurement Laser Plane */}
      <mesh ref={scanRef} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[2.0, 2.0]} />
        <meshBasicMaterial
          color="#38BDF8"
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
