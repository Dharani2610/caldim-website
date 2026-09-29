"use client";

import { Suspense, useRef } from "react";
import type { JSX } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useNearViewport, useWebGLCapability } from "@/frontend/components/three/useWebGL";

export type Kind =
  | "structural"
  | "misc"
  | "connections"
  | "joist-deck"
  | "bim"
  | "estimation"
  | "digital-automation";

function IBeam() {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.6;
  });
  return (
    <group ref={ref}>
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[1.2, 0.1, 0.5]} />
        <meshStandardMaterial color="#AEB6BF" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.14, 1.1, 0.14]} />
        <meshStandardMaterial color="#AEB6BF" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.55, 0]}>
        <boxGeometry args={[1.2, 0.1, 0.5]} />
        <meshStandardMaterial color="#3FA9E8" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
}

function Stair() {
  const ref = useRef<THREE.Group>(null);
  const postsGroupRef = useRef<THREE.Group>(null);
  const topRailGroupRef = useRef<THREE.Group>(null);
  const midRailGroupRef = useRef<THREE.Group>(null);
  const bracketsGroupRef = useRef<THREE.Group>(null);

  const numTreads = 6;
  const treadRun = 0.22;
  const treadRise = 0.18;
  const slopeAngle = Math.atan2(treadRise, treadRun);
  const postHeight = 0.65;

  // Post positions along stringer [x, y, z]
  const postPositions: [number, number, number][] = [
    [-0.55, -0.45, 0.28],
    [-0.11, -0.09, 0.28],
    [0.33, 0.27, 0.28],
    [0.65, 0.53, 0.28], // Landing entry
    [1.05, 0.53, 0.28], // Landing end
  ];

  useFrame((state, dt) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) {
      ref.current.rotation.y += dt * 0.45;
    }

    // 7-second construction cycle
    const cycle = (t % 7) / 7;

    // 1. Posts appear one-by-one (0.12 to 0.36)
    if (postsGroupRef.current) {
      postsGroupRef.current.children.forEach((post, i) => {
        const start = 0.12 + i * 0.045;
        const end = start + 0.04;
        let progress = 0;
        if (cycle >= end) progress = 1;
        else if (cycle > start) progress = (cycle - start) / (end - start);

        if (cycle >= 0.94) {
          progress = Math.max(0, 1 - (cycle - 0.94) / 0.06);
        }

        post.scale.set(1, Math.max(0.001, progress), 1);
        post.visible = progress > 0.01;
      });
    }

    // 2. Top rail extrudes post-to-post (0.36 to 0.56)
    if (topRailGroupRef.current) {
      topRailGroupRef.current.children.forEach((segment, i) => {
        const start = 0.36 + i * 0.05;
        const end = start + 0.045;
        let progress = 0;
        if (cycle >= end) progress = 1;
        else if (cycle > start) progress = (cycle - start) / (end - start);

        if (cycle >= 0.94) {
          progress = Math.max(0, 1 - (cycle - 0.94) / 0.06);
        }

        segment.scale.set(Math.max(0.001, progress), 1, 1);
        segment.visible = progress > 0.01;
      });
    }

    // 3. Mid rail extrudes post-to-post (0.56 to 0.74)
    if (midRailGroupRef.current) {
      midRailGroupRef.current.children.forEach((segment, i) => {
        const start = 0.56 + i * 0.045;
        const end = start + 0.04;
        let progress = 0;
        if (cycle >= end) progress = 1;
        else if (cycle > start) progress = (cycle - start) / (end - start);

        if (cycle >= 0.94) {
          progress = Math.max(0, 1 - (cycle - 0.94) / 0.06);
        }

        segment.scale.set(Math.max(0.001, progress), 1, 1);
        segment.visible = progress > 0.01;
      });
    }

    // 4. Connection brackets pop in (0.74 to 0.82)
    if (bracketsGroupRef.current) {
      bracketsGroupRef.current.children.forEach((bracket, i) => {
        const start = 0.74 + i * 0.015;
        const end = start + 0.02;
        let progress = 0;
        if (cycle >= end) progress = 1;
        else if (cycle > start) progress = (cycle - start) / (end - start);

        if (cycle >= 0.94) {
          progress = Math.max(0, 1 - (cycle - 0.94) / 0.06);
        }

        bracket.scale.set(progress, progress, progress);
        bracket.visible = progress > 0.01;
      });
    }
  });

  return (
    <group ref={ref} position={[-0.2, -0.15, 0]} scale={0.9}>
      {/* 1. STRUCTURAL BASE: STRINGER CHANNELS */}
      {/* Left Stringer */}
      <mesh
        position={[-0.05, 0.04, -0.28]}
        rotation={[0, 0, slopeAngle]}
      >
        <boxGeometry args={[1.75, 0.12, 0.03]} />
        <meshStandardMaterial color="#64748B" metalness={0.75} roughness={0.25} />
      </mesh>
      {/* Right Stringer */}
      <mesh
        position={[-0.05, 0.04, 0.28]}
        rotation={[0, 0, slopeAngle]}
      >
        <boxGeometry args={[1.75, 0.12, 0.03]} />
        <meshStandardMaterial color="#64748B" metalness={0.75} roughness={0.25} />
      </mesh>

      {/* Stringer Base Plates & Anchors */}
      <mesh position={[-0.68, -0.5, -0.28]}>
        <boxGeometry args={[0.16, 0.025, 0.1]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[-0.68, -0.5, 0.28]}>
        <boxGeometry args={[0.16, 0.025, 0.1]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* 2. STEEL TREADS */}
      {Array.from({ length: numTreads }).map((_, i) => {
        const tx = (i - 2.5) * treadRun - 0.05;
        const ty = (i - 2.5) * treadRise + 0.04;
        return (
          <group key={`tread-${i}`} position={[tx, ty, 0]}>
            {/* Tread Pan */}
            <mesh position={[0, -0.015, 0]}>
              <boxGeometry args={[treadRun, 0.03, 0.54]} />
              <meshStandardMaterial color="#94A3B8" metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Safety Nosing */}
            <mesh position={[treadRun / 2, -0.015, 0]}>
              <boxGeometry args={[0.02, 0.03, 0.54]} />
              <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.25} />
            </mesh>
          </group>
        );
      })}

      {/* 3. LANDING / PLATFORM */}
      <group position={[0.85, (numTreads - 2.5) * treadRise + 0.04, 0]}>
        {/* Grating Platform */}
        <mesh position={[0, -0.015, 0]}>
          <boxGeometry args={[0.55, 0.03, 0.6]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.7} roughness={0.35} />
        </mesh>
        {/* Perimeter Channels */}
        <mesh position={[0, -0.06, 0.3]}>
          <boxGeometry args={[0.55, 0.08, 0.03]} />
          <meshStandardMaterial color="#64748B" metalness={0.75} roughness={0.25} />
        </mesh>
        <mesh position={[0, -0.06, -0.3]}>
          <boxGeometry args={[0.55, 0.08, 0.03]} />
          <meshStandardMaterial color="#64748B" metalness={0.75} roughness={0.25} />
        </mesh>
        <mesh position={[0.275, -0.06, 0]}>
          <boxGeometry args={[0.03, 0.08, 0.6]} />
          <meshStandardMaterial color="#64748B" metalness={0.75} roughness={0.25} />
        </mesh>
      </group>

      {/* 4. HANDRAIL POSTS (Constructed one by one) */}
      <group ref={postsGroupRef}>
        {postPositions.map(([px, py, pz], idx) => (
          <group key={`post-${idx}`} position={[px, py, pz]}>
            {/* Vertical Post (Pivot at bottom) */}
            <mesh position={[0, postHeight / 2, 0]}>
              <cylinderGeometry args={[0.016, 0.016, postHeight, 12]} />
              <meshStandardMaterial
                color="#3FA9E8"
                emissive="#0284C7"
                emissiveIntensity={0.35}
                metalness={0.6}
                roughness={0.2}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* 5. TOP HANDRAIL (Extrudes segment-by-segment) */}
      <group ref={topRailGroupRef}>
        {/* Bay 0: Post 0 -> Post 1 (Inclined) */}
        <group position={[-0.55, -0.45 + postHeight, 0.28]}>
          <group rotation={[0, 0, slopeAngle]}>
            <mesh position={[Math.hypot(0.44, 0.36) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.018, 0.018, Math.hypot(0.44, 0.36), 12]} />
              <meshStandardMaterial color="#3FA9E8" emissive="#0284C7" emissiveIntensity={0.35} metalness={0.6} roughness={0.2} />
            </mesh>
          </group>
        </group>

        {/* Bay 1: Post 1 -> Post 2 (Inclined) */}
        <group position={[-0.11, -0.09 + postHeight, 0.28]}>
          <group rotation={[0, 0, slopeAngle]}>
            <mesh position={[Math.hypot(0.44, 0.36) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.018, 0.018, Math.hypot(0.44, 0.36), 12]} />
              <meshStandardMaterial color="#3FA9E8" emissive="#0284C7" emissiveIntensity={0.35} metalness={0.6} roughness={0.2} />
            </mesh>
          </group>
        </group>

        {/* Bay 2: Post 2 -> Post 3 (Inclined to Landing) */}
        <group position={[0.33, 0.27 + postHeight, 0.28]}>
          <group rotation={[0, 0, slopeAngle]}>
            <mesh position={[Math.hypot(0.32, 0.26) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.018, 0.018, Math.hypot(0.32, 0.26), 12]} />
              <meshStandardMaterial color="#3FA9E8" emissive="#0284C7" emissiveIntensity={0.35} metalness={0.6} roughness={0.2} />
            </mesh>
          </group>
        </group>

        {/* Bay 3: Post 3 -> Post 4 (Horizontal on Landing) */}
        <group position={[0.65, 0.53 + postHeight, 0.28]}>
          <mesh position={[0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.018, 0.018, 0.4, 12]} />
            <meshStandardMaterial color="#3FA9E8" emissive="#0284C7" emissiveIntensity={0.35} metalness={0.6} roughness={0.2} />
          </mesh>
        </group>
      </group>

      {/* 6. MID RAIL (Extrudes segment-by-segment) */}
      <group ref={midRailGroupRef}>
        {/* Bay 0 */}
        <group position={[-0.55, -0.45 + postHeight * 0.5, 0.28]}>
          <group rotation={[0, 0, slopeAngle]}>
            <mesh position={[Math.hypot(0.44, 0.36) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.013, 0.013, Math.hypot(0.44, 0.36), 12]} />
              <meshStandardMaterial color="#3FA9E8" emissive="#0284C7" emissiveIntensity={0.3} metalness={0.6} roughness={0.25} />
            </mesh>
          </group>
        </group>

        {/* Bay 1 */}
        <group position={[-0.11, -0.09 + postHeight * 0.5, 0.28]}>
          <group rotation={[0, 0, slopeAngle]}>
            <mesh position={[Math.hypot(0.44, 0.36) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.013, 0.013, Math.hypot(0.44, 0.36), 12]} />
              <meshStandardMaterial color="#3FA9E8" emissive="#0284C7" emissiveIntensity={0.3} metalness={0.6} roughness={0.25} />
            </mesh>
          </group>
        </group>

        {/* Bay 2 */}
        <group position={[0.33, 0.27 + postHeight * 0.5, 0.28]}>
          <group rotation={[0, 0, slopeAngle]}>
            <mesh position={[Math.hypot(0.32, 0.26) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.013, 0.013, Math.hypot(0.32, 0.26), 12]} />
              <meshStandardMaterial color="#3FA9E8" emissive="#0284C7" emissiveIntensity={0.3} metalness={0.6} roughness={0.25} />
            </mesh>
          </group>
        </group>

        {/* Bay 3 (Landing Horizontal) */}
        <group position={[0.65, 0.53 + postHeight * 0.5, 0.28]}>
          <mesh position={[0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.013, 0.013, 0.4, 12]} />
            <meshStandardMaterial color="#3FA9E8" emissive="#0284C7" emissiveIntensity={0.3} metalness={0.6} roughness={0.25} />
          </mesh>
        </group>
      </group>

      {/* 7. CONNECTION BRACKETS & MOUNTING CLIPS */}
      <group ref={bracketsGroupRef}>
        {postPositions.map(([px, py, pz], idx) => (
          <group key={`bracket-${idx}`} position={[px, py, pz]}>
            {/* Base mounting clip on stringer */}
            <mesh position={[0, 0.02, 0]}>
              <boxGeometry args={[0.06, 0.04, 0.06]} />
              <meshStandardMaterial color="#5B8DEF" metalness={0.7} roughness={0.2} />
            </mesh>
            {/* Top rail saddle bracket */}
            <mesh position={[0, postHeight, 0]}>
              <boxGeometry args={[0.04, 0.03, 0.04]} />
              <meshStandardMaterial color="#5B8DEF" metalness={0.7} roughness={0.2} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

function ExplodedConnection() {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.6;
  });
  return (
    <group ref={ref}>
      <mesh position={[-0.3, 0, 0]}>
        <boxGeometry args={[0.16, 1.1, 0.16]} />
        <meshStandardMaterial color="#AEB6BF" metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[0.3, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.7, 0.14, 0.28]} />
        <meshStandardMaterial color="#AEB6BF" metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[0.02, 0.1, 0]}>
        <boxGeometry args={[0.05, 0.5, 0.32]} />
        <meshStandardMaterial color="#3FA9E8" metalness={0.4} roughness={0.5} />
      </mesh>
      {[0.28, 0.42].map((y, i) => (
        <mesh key={i} position={[0.06, y - 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.18, 12]} />
          <meshStandardMaterial color="#5B8DEF" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function JoistDeck() {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.6;
  });
  return (
    <group ref={ref}>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[1.3, 0.04, 0.9]} />
        <meshStandardMaterial color="#7C8894" metalness={0.3} roughness={0.6} />
      </mesh>
      {[-0.4, 0, 0.4].map((x, i) => (
        <mesh key={i} position={[x, 0.05, 0]}>
          <boxGeometry args={[0.06, 0.5, 0.9]} />
          <meshStandardMaterial color="#3FA9E8" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function WireCube() {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.6;
  });
  return (
    <group ref={ref}>
      <mesh>
        <boxGeometry args={[0.85, 0.85, 0.85]} />
        <meshStandardMaterial color="#5B8DEF" wireframe />
      </mesh>
      <mesh scale={0.5}>
        <boxGeometry args={[0.85, 0.85, 0.85]} />
        <meshStandardMaterial color="#3FA9E8" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

function TakeoffBars() {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.6;
  });
  const heights = [0.3, 0.5, 0.4, 0.75, 0.6];
  return (
    <group ref={ref} position={[0, -0.25, 0]}>
      {heights.map((h, i) => (
        <mesh key={i} position={[(i - 2) * 0.24, h / 2, 0]}>
          <boxGeometry args={[0.16, h, 0.16]} />
          <meshStandardMaterial
            color={i === 3 ? "#3FA9E8" : "#AEB6BF"}
            metalness={0.5}
            roughness={0.4}
          />
        </mesh>
      ))}
      {/* baseline / ruler */}
      <mesh position={[0, 0.02, 0.28]}>
        <boxGeometry args={[1.2, 0.02, 0.02]} />
        <meshStandardMaterial color="#5B8DEF" metalness={0.4} roughness={0.5} />
      </mesh>
    </group>
  );
}

/**
 * Automation: a driving gear turning a ring of satellites, over a wireframe
 * model cube — the script acting on the model, rather than a hand on it.
 */
function AutomationGear() {
  const ref = useRef<THREE.Group>(null);
  const counter = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.6;
    // The satellites turn against the driver, the way meshed teeth do.
    if (counter.current) counter.current.rotation.z -= dt * 1.1;
  });
  return (
    <group ref={ref}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.44, 0.09, 10, 24]} />
        <meshStandardMaterial color="#3FA9E8" metalness={0.6} roughness={0.3} />
      </mesh>
      <group ref={counter} rotation={[Math.PI / 2, 0, 0]}>
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i / 6) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(angle) * 0.44, Math.sin(angle) * 0.44, 0]}>
              <boxGeometry args={[0.14, 0.14, 0.16]} />
              <meshStandardMaterial color="#AEB6BF" metalness={0.7} roughness={0.3} />
            </mesh>
          );
        })}
      </group>
      <mesh scale={0.34}>
        <boxGeometry args={[0.85, 0.85, 0.85]} />
        <meshStandardMaterial color="#5B8DEF" wireframe />
      </mesh>
    </group>
  );
}

function StaticVignette({ kind }: { kind: Kind }) {
  switch (kind) {
    case "structural":
      return (
        <svg viewBox="0 0 160 120" className="h-full w-full max-h-32" aria-hidden="true">
          <rect x="35" y="24" width="90" height="10" rx="2" fill="#AEB6BF" />
          <rect x="74" y="34" width="12" height="52" fill="#AEB6BF" />
          <rect x="35" y="86" width="90" height="10" rx="2" fill="#3FA9E8" />
          <line x1="28" y1="24" x2="28" y2="96" stroke="#5B8DEF" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
          <line x1="24" y1="24" x2="32" y2="24" stroke="#5B8DEF" strokeWidth="1" opacity="0.6" />
          <line x1="24" y1="96" x2="32" y2="96" stroke="#5B8DEF" strokeWidth="1" opacity="0.6" />
        </svg>
      );
    case "misc":
      return (
        <svg viewBox="0 0 160 120" className="h-full w-full max-h-32" aria-hidden="true">
          {/* Stringer base */}
          <line x1="20" y1="96" x2="100" y2="34" stroke="#64748B" strokeWidth="4" strokeLinecap="round" />
          {/* Base plate */}
          <rect x="14" y="94" width="14" height="4" rx="1" fill="#475569" />
          {/* Treads */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <g key={i}>
              <rect
                x={22 + i * 14}
                y={90 - i * 11}
                width="18"
                height="4"
                rx="1"
                fill="#94A3B8"
              />
              <rect
                x={38 + i * 14}
                y={90 - i * 11}
                width="3"
                height="4"
                fill="#475569"
              />
            </g>
          ))}
          {/* Landing platform */}
          <rect x="100" y="32" width="36" height="4" rx="1" fill="#94A3B8" />
          <rect x="100" y="36" width="36" height="5" fill="#64748B" />
          {/* Handrail posts */}
          <line x1="24" y1="90" x2="24" y2="58" stroke="#3FA9E8" strokeWidth="2" />
          <line x1="52" y1="68" x2="52" y2="36" stroke="#3FA9E8" strokeWidth="2" />
          <line x1="80" y1="46" x2="80" y2="14" stroke="#3FA9E8" strokeWidth="2" />
          <line x1="102" y1="32" x2="102" y2="8" stroke="#3FA9E8" strokeWidth="2" />
          <line x1="134" y1="32" x2="134" y2="8" stroke="#3FA9E8" strokeWidth="2" />
          {/* Mid-rail */}
          <path d="M 24 74 L 102 20 L 134 20" stroke="#3FA9E8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.85" />
          {/* Top handrail */}
          <path d="M 24 58 L 102 8 L 134 8" stroke="#3FA9E8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );
    case "connections":
      return (
        <svg viewBox="0 0 160 120" className="h-full w-full max-h-32" aria-hidden="true">
          <rect x="40" y="16" width="22" height="88" rx="2" fill="#AEB6BF" opacity="0.9" />
          <rect x="62" y="32" width="8" height="56" rx="1" fill="#3FA9E8" />
          <rect x="70" y="38" width="60" height="44" rx="2" fill="#AEB6BF" opacity="0.8" />
          <circle cx="66" cy="42" r="2.5" fill="#5B8DEF" />
          <circle cx="66" cy="54" r="2.5" fill="#5B8DEF" />
          <circle cx="66" cy="66" r="2.5" fill="#5B8DEF" />
          <circle cx="66" cy="78" r="2.5" fill="#5B8DEF" />
        </svg>
      );
    case "joist-deck":
      return (
        <svg viewBox="0 0 160 120" className="h-full w-full max-h-32" aria-hidden="true">
          <rect x="25" y="30" width="110" height="8" rx="1.5" fill="#7C8894" />
          {[-1, 0, 1].map((offset, i) => (
            <g key={i} transform={`translate(${80 + offset * 34}, 38)`}>
              <line x1="-12" y1="0" x2="0" y2="46" stroke="#3FA9E8" strokeWidth="3" strokeLinecap="round" />
              <line x1="0" y1="46" x2="12" y2="0" stroke="#3FA9E8" strokeWidth="3" strokeLinecap="round" />
              <line x1="-15" y1="46" x2="15" y2="46" stroke="#3FA9E8" strokeWidth="3" strokeLinecap="round" />
            </g>
          ))}
        </svg>
      );
    case "bim":
      return (
        <svg viewBox="0 0 160 120" className="h-full w-full max-h-32" aria-hidden="true">
          <polygon points="80,24 120,44 80,64 40,44" fill="none" stroke="#5B8DEF" strokeWidth="1.5" />
          <polygon points="40,44 80,64 80,100 40,80" fill="none" stroke="#5B8DEF" strokeWidth="1.5" />
          <polygon points="120,44 80,64 80,100 120,80" fill="none" stroke="#5B8DEF" strokeWidth="1.5" />
          <polygon points="80,48 96,56 80,64 64,56" fill="#3FA9E8" opacity="0.8" />
          <polygon points="64,56 80,64 80,78 64,70" fill="#3FA9E8" opacity="0.9" />
          <polygon points="96,56 80,64 80,78 96,70" fill="#3FA9E8" opacity="0.7" />
        </svg>
      );
    case "estimation":
      return (
        <svg viewBox="0 0 160 120" className="h-full w-full max-h-32" aria-hidden="true">
          {[
            { h: 32, c: "#AEB6BF" },
            { h: 50, c: "#AEB6BF" },
            { h: 40, c: "#AEB6BF" },
            { h: 72, c: "#3FA9E8" },
            { h: 58, c: "#AEB6BF" },
          ].map((bar, i) => (
            <rect
              key={i}
              x={35 + i * 19}
              y={90 - bar.h}
              width="13"
              height={bar.h}
              rx="2"
              fill={bar.c}
            />
          ))}
          <line x1="28" y1="92" x2="132" y2="92" stroke="#5B8DEF" strokeWidth="1.5" />
        </svg>
      );
    case "digital-automation":
      return (
        <svg viewBox="0 0 160 120" className="h-full w-full max-h-32" aria-hidden="true">
          <circle cx="80" cy="60" r="22" fill="none" stroke="#3FA9E8" strokeWidth="5" />
          <circle cx="80" cy="60" r="10" fill="none" stroke="#5B8DEF" strokeWidth="1.5" />
          {[0, 60, 120, 180, 240, 300].map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            const x = 80 + Math.cos(rad) * 22;
            const y = 60 + Math.sin(rad) * 22;
            return <rect key={i} x={x - 4} y={y - 4} width="8" height="8" rx="1.5" fill="#AEB6BF" />;
          })}
        </svg>
      );
    default:
      return null;
  }
}

const map: Record<Kind, () => JSX.Element> = {
  structural: IBeam,
  misc: Stair,
  connections: ExplodedConnection,
  "joist-deck": JoistDeck,
  bim: WireCube,
  estimation: TakeoffBars,
  "digital-automation": AutomationGear,
};

export default function ServiceVignette({ kind, paused = false }: { kind: Kind; paused?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const capability = useWebGLCapability();
  const near = useNearViewport(containerRef);
  const Shape = map[kind];
  const isLive = capability.state === "ready" && capability.tier === "full" && !paused;

  return (
    <div ref={containerRef} className="flex h-32 w-full items-center justify-center" aria-hidden="true">
      {isLive && near ? (
        <Canvas camera={{ position: [1.6, 1.1, 1.8], fov: 40 }} dpr={[1, 1.5]} gl={{ powerPreference: "low-power" }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[2, 3, 2]} intensity={1.2} />
          <directionalLight position={[-2, 1, -2]} intensity={0.3} color="#5B8DEF" />
          <Suspense fallback={null}>
            <Shape />
          </Suspense>
        </Canvas>
      ) : (
        <StaticVignette kind={kind} />
      )}
    </div>
  );
}
