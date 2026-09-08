"use client";

import { Suspense, useRef } from "react";
import type { JSX } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

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
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.6;
  });
  return (
    <group ref={ref} position={[-0.6, -0.5, 0]}>
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[i * 0.22, i * 0.18, 0]}>
          <boxGeometry args={[0.22, 0.06, 0.5]} />
          <meshStandardMaterial
            color={i === 0 ? "#3FA9E8" : "#AEB6BF"}
            metalness={0.6}
            roughness={0.35}
          />
        </mesh>
      ))}
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

const map: Record<Kind, () => JSX.Element> = {
  structural: IBeam,
  misc: Stair,
  connections: ExplodedConnection,
  "joist-deck": JoistDeck,
  bim: WireCube,
  estimation: TakeoffBars,
  "digital-automation": AutomationGear,
};

export default function ServiceVignette({ kind }: { kind: Kind }) {
  const Shape = map[kind];
  return (
    <div className="h-32 w-full" aria-hidden="true">
      <Canvas camera={{ position: [1.6, 1.1, 1.8], fov: 40 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 3, 2]} intensity={1.2} />
        <directionalLight position={[-2, 1, -2]} intensity={0.3} color="#5B8DEF" />
        <Suspense fallback={null}>
          <Shape />
        </Suspense>
      </Canvas>
    </div>
  );
}
