"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * 06 — DIGITAL AUTOMATION SERVICES 3D ANIMATION
 * Concept: 3D MODEL → DATA EXTRACTION → BOM / CNC → AUTOMATED PIPELINE
 * Features:
 * - 3D structural steel joint (W14 Column + W18 Beams)
 * - Digital data flow pipeline streams emitting from the model
 * - Data packets / pulses travelling along curves
 */
export default function AutomationScene({ isHovered }: { isHovered: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const dataNodesRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);

  // Materials
  const steelMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#334155",
        metalness: 0.85,
        roughness: 0.25,
      }),
    []
  );

  const neonMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#0284C7",
        emissive: "#0284C7",
        emissiveIntensity: isHovered ? 0.9 : 0.45,
        metalness: 0.6,
        roughness: 0.2,
      }),
    [isHovered]
  );

  const goldMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#F59E0B",
        emissive: "#D97706",
        emissiveIntensity: 0.5,
        metalness: 0.9,
        roughness: 0.15,
      }),
    []
  );

  // Data flow spline lines
  const flowLines = useMemo(() => {
    const curves = [
      new THREE.CubicBezierCurve3(
        new THREE.Vector3(0, 0.35, 0),
        new THREE.Vector3(0.6, 0.8, 0.35),
        new THREE.Vector3(1.1, 0.5, 0.15),
        new THREE.Vector3(1.4, 0.25, 0)
      ),
      new THREE.CubicBezierCurve3(
        new THREE.Vector3(0, -0.35, 0),
        new THREE.Vector3(0.5, -0.7, -0.25),
        new THREE.Vector3(1.0, -0.45, -0.15),
        new THREE.Vector3(1.3, -0.15, 0)
      ),
      new THREE.CubicBezierCurve3(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-0.6, 0.5, 0.3),
        new THREE.Vector3(-1.0, 0.25, 0.15),
        new THREE.Vector3(-1.3, -0.1, 0)
      ),
    ];
    return curves;
  }, []);

  // Particle positions for data stream
  const particleCount = 45;
  const particleData = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const progress = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      progress[i] = Math.random();
      pos[i * 3] = (Math.random() - 0.5) * 2.5;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 1.8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.8;
    }
    return { pos, progress };
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const speed = isHovered ? 0.6 : 0.3;

    if (groupRef.current) {
      groupRef.current.rotation.y += delta * speed;
      groupRef.current.rotation.x = Math.sin(t * 0.9) * 0.04 + 0.2;
    }

    // Animate data points along spline curves
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const curveIdx = i % flowLines.length;
        const curve = flowLines[curveIdx];
        particleData.progress[i] = (particleData.progress[i] + delta * (0.35 + (i % 3) * 0.15)) % 1;
        const pt = curve.getPoint(particleData.progress[i]);
        positions[i * 3] = pt.x + (Math.sin(t * 4 + i) * 0.02);
        positions[i * 3 + 1] = pt.y + (Math.cos(t * 4 + i) * 0.02);
        positions[i * 3 + 2] = pt.z;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.05, 0]} rotation={[0.22, -0.7, 0]} scale={1.05}>
      {/* Central Structural BIM Model Node */}
      <group position={[-0.2, 0, 0]}>
        {/* Main Column Web & Flanges */}
        <mesh material={steelMat}>
          <boxGeometry args={[0.06, 2.0, 0.28]} />
        </mesh>
        <mesh position={[-0.14, 0, 0]} material={steelMat}>
          <boxGeometry args={[0.06, 2.0, 0.34]} />
        </mesh>
        <mesh position={[0.14, 0, 0]} material={steelMat}>
          <boxGeometry args={[0.06, 2.0, 0.34]} />
        </mesh>

        {/* Connecting Beam X */}
        <mesh position={[0.65, 0.2, 0]} material={steelMat}>
          <boxGeometry args={[1.0, 0.3, 0.05]} />
        </mesh>
        <mesh position={[0.65, 0.35, 0]} material={steelMat}>
          <boxGeometry args={[1.0, 0.04, 0.2]} />
        </mesh>
        <mesh position={[0.65, 0.05, 0]} material={steelMat}>
          <boxGeometry args={[1.0, 0.04, 0.2]} />
        </mesh>

        {/* Connecting Beam Z */}
        <mesh position={[0, 0.2, 0.55]} material={steelMat}>
          <boxGeometry args={[0.05, 0.26, 0.8]} />
        </mesh>

        {/* Connection Gusset Plate */}
        <mesh position={[0.18, 0.2, 0]} material={neonMat}>
          <boxGeometry args={[0.24, 0.24, 0.035]} />
        </mesh>
      </group>

      {/* Data Flow Spline Tubes / Paths */}
      {flowLines.map((curve, idx) => {
        const geom = new THREE.TubeGeometry(curve, 32, 0.012, 8, false);
        return (
          <mesh key={`flow-${idx}`} geometry={geom} material={neonMat} />
        );
      })}

      {/* Data Stream Particle Sparks */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={particleData.pos}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#38BDF8"
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Automation Terminal / Node Points */}
      <group ref={dataNodesRef}>
        <mesh position={[-1.1, 0.6, 0]} material={neonMat}>
          <octahedronGeometry args={[0.08, 0]} />
        </mesh>
        <mesh position={[1.3, 0.25, 0]} material={goldMat}>
          <octahedronGeometry args={[0.08, 0]} />
        </mesh>
        <mesh position={[1.1, -0.45, 0]} material={neonMat}>
          <octahedronGeometry args={[0.08, 0]} />
        </mesh>
      </group>
    </group>
  );
}
