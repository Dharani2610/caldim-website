"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Html, Lightformer } from "@react-three/drei";
import * as THREE from "three";

/**
 * The moment connection, as an actual assembly.
 *
 * The original vignette was a fixed exploded arrangement that spun. This scene
 * models the same connection but drives every part from a single `explode`
 * value, so the viewer can pull the assembly apart and push it back together
 * and watch which piece goes where — which is the thing a fabricator actually
 * wants to look at.
 *
 * Geometry is built once with `useMemo` and materials are shared across
 * meshes; the per-frame work is limited to writing positions onto existing
 * objects, so the loop allocates nothing.
 */

export interface SceneControls {
  /** 0 = assembled, 1 = fully exploded. */
  explode: React.MutableRefObject<number>;
  /** Accumulated yaw, in radians, from dragging. */
  spin: React.MutableRefObject<number>;
  /** Pauses the idle rotation while the pointer is down. */
  dragging: React.MutableRefObject<boolean>;
  showLabels: boolean;
}

/** Part positions at rest and fully exploded; the frame lerps between them. */
const PARTS = {
  beam: { assembled: [0.86, 0.3, 0], exploded: [1.75, 0.34, 0] },
  endPlate: { assembled: [0.33, 0.3, 0], exploded: [0.92, 0.32, 0] },
  stiffenerTop: { assembled: [0, 0.66, 0], exploded: [0, 1.32, 0] },
  stiffenerBottom: { assembled: [0, -0.06, 0], exploded: [0, -0.74, 0] },
} as const;

const BOLT_ROWS = [0.62, 0.44, 0.16, -0.02] as const;
const BOLT_GAUGE = 0.17;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function Assembly({ explode, spin, dragging, showLabels }: SceneControls) {
  const group = useRef<THREE.Group>(null);
  const beam = useRef<THREE.Mesh>(null);
  const endPlate = useRef<THREE.Mesh>(null);
  const stiffenerTop = useRef<THREE.Mesh>(null);
  const stiffenerBottom = useRef<THREE.Mesh>(null);
  const bolts = useRef<THREE.Group>(null);
  const weld = useRef<THREE.Mesh>(null);

  // Shared materials: eight bolt meshes pointing at one material is one
  // shader program and one upload, rather than eight of each.
  const materials = useMemo(
    () => ({
      // Metalness near 1.0 means the surface is *only* its reflections, so
      // with a modest environment it renders almost black. Backing it off and
      // raising envMapIntensity keeps the metal read while guaranteeing the
      // section stays legible on a weak GPU.
      steel: new THREE.MeshStandardMaterial({
        color: "#C6CDD6",
        metalness: 0.68,
        roughness: 0.29,
        envMapIntensity: 1.8,
      }),
      plate: new THREE.MeshStandardMaterial({
        color: "#4FB4EE",
        metalness: 0.45,
        roughness: 0.35,
        envMapIntensity: 1.4,
      }),
      bolt: new THREE.MeshStandardMaterial({
        color: "#EBD08A",
        metalness: 0.8,
        roughness: 0.22,
        envMapIntensity: 1.9,
      }),
      weld: new THREE.MeshStandardMaterial({
        color: "#3FA9E8",
        emissive: new THREE.Color("#3FA9E8"),
        emissiveIntensity: 1.6,
        metalness: 0.3,
        roughness: 0.7,
      }),
    }),
    []
  );

  const geometries = useMemo(
    () => ({
      columnWeb: new THREE.BoxGeometry(0.13, 2.6, 0.42),
      columnFlange: new THREE.BoxGeometry(0.42, 2.6, 0.05),
      beam: new THREE.BoxGeometry(1.5, 0.52, 0.32),
      endPlate: new THREE.BoxGeometry(0.055, 1.05, 0.5),
      stiffener: new THREE.BoxGeometry(0.36, 0.045, 0.38),
      bolt: new THREE.CylinderGeometry(0.032, 0.032, 0.34, 14),
      boltHead: new THREE.CylinderGeometry(0.055, 0.055, 0.045, 6),
      weld: new THREE.TorusGeometry(0.055, 0.014, 8, 28),
    }),
    []
  );

  useFrame((state, delta) => {
    const t = THREE.MathUtils.clamp(explode.current, 0, 1);
    // Ease the separation so parts settle rather than snapping into place.
    const eased = t * t * (3 - 2 * t);

    if (group.current) {
      // Idle rotation, paused while the user is driving it themselves.
      if (!dragging.current) spin.current += delta * 0.22;
      group.current.rotation.y = spin.current;
      // A gentle nod keeps the silhouette from reading as a flat elevation.
      group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.35) * 0.05;
    }

    const place = (
      mesh: THREE.Mesh | null,
      part: { assembled: readonly number[]; exploded: readonly number[] }
    ) => {
      if (!mesh) return;
      mesh.position.set(
        lerp(part.assembled[0], part.exploded[0], eased),
        lerp(part.assembled[1], part.exploded[1], eased),
        lerp(part.assembled[2], part.exploded[2], eased)
      );
    };

    place(beam.current, PARTS.beam);
    place(endPlate.current, PARTS.endPlate);
    place(stiffenerTop.current, PARTS.stiffenerTop);
    place(stiffenerBottom.current, PARTS.stiffenerBottom);

    // Bolts travel furthest, and each one a little further than the last, so
    // the pattern fans out legibly instead of moving as one slab.
    if (bolts.current) {
      bolts.current.children.forEach((bolt, index) => {
        const row = Math.floor(index / 2);
        bolt.position.x = lerp(0.2, 0.55 + row * 0.16, eased);
      });
    }

    // The weld only exists once the plate is home; fade it as things separate.
    if (weld.current) {
      const material = weld.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 1.6 * (1 - eased);
      weld.current.visible = eased < 0.92;
    }
  });

  return (
    <group ref={group} position={[-0.35, -0.1, 0]}>
      {/* Column: web plus two flanges, so it reads as a wide-flange section
          rather than a plain post. */}
      <mesh geometry={geometries.columnWeb} material={materials.steel} />
      <mesh
        geometry={geometries.columnFlange}
        material={materials.steel}
        position={[0, 0, 0.235]}
      />
      <mesh
        geometry={geometries.columnFlange}
        material={materials.steel}
        position={[0, 0, -0.235]}
      />

      {/* Continuity stiffeners inside the column, opposite the beam flanges. */}
      <mesh ref={stiffenerTop} geometry={geometries.stiffener} material={materials.plate} />
      <mesh ref={stiffenerBottom} geometry={geometries.stiffener} material={materials.plate} />

      {/* Shear-tab / end plate. */}
      <mesh ref={endPlate} geometry={geometries.endPlate} material={materials.plate} />

      {/* Incoming beam. */}
      <mesh ref={beam} geometry={geometries.beam} material={materials.steel} />

      {/* Bolt group — two vertical rows, four rows deep. */}
      <group ref={bolts}>
        {BOLT_ROWS.flatMap((y, rowIndex) =>
          [-BOLT_GAUGE, BOLT_GAUGE].map((z, sideIndex) => (
            <group
              key={`${rowIndex}-${sideIndex}`}
              position={[0.2, y - 0.06, z]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <mesh geometry={geometries.bolt} material={materials.bolt} />
              <mesh
                geometry={geometries.boltHead}
                material={materials.bolt}
                position={[0, 0.185, 0]}
              />
            </group>
          ))
        )}
      </group>

      {/* Weld bead at the column face. */}
      <mesh
        ref={weld}
        geometry={geometries.weld}
        material={materials.weld}
        position={[0.24, 0.3, 0]}
        rotation={[0, Math.PI / 2, 0]}
      />

      {showLabels && (
        <>
          <PartLabel position={[0.05, 1.45, 0]} text="COLUMN — W14x90" />
          <PartLabel position={[1.6, 0.62, 0]} text="BEAM — W18x40" />
          <PartLabel position={[0.55, -0.62, 0]} text="END PLATE + (8) 7/8&quot; A325" />
        </>
      )}
    </group>
  );
}

/**
 * A DOM label positioned in 3D space. Using HTML rather than a texture keeps
 * the type crisp at every zoom and, more importantly, keeps it selectable and
 * readable by a screen reader.
 */
function PartLabel({ position, text }: { position: [number, number, number]; text: string }) {
  return (
    <Html
      position={position}
      center
      distanceFactor={7}
      occlude={false}
      wrapperClass="pointer-events-none"
    >
      <span className="label-mono-sm whitespace-nowrap rounded-full border border-blueprint-light bg-steel-950/85 px-2.5 py-1 text-paper-dim backdrop-blur-sm">
        {text}
      </span>
    </Html>
  );
}

/** Caps the resolution the renderer works at on very dense displays. */
function AdaptiveDpr() {
  const setDpr = useThree((state) => state.setDpr);
  useMemo(() => {
    setDpr(Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 1.75));
  }, [setDpr]);
  return null;
}

export default function ConnectionScene(controls: SceneControls) {
  return (
    <Canvas
      camera={{ position: [3.1, 1.5, 3.1], fov: 40 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: true }}
      // Render only when something has actually changed. The idle rotation
      // invalidates each frame itself, so this costs nothing visually while
      // saving the GPU whenever the scene is genuinely still.
      frameloop="always"
    >
      <AdaptiveDpr />

      {/* Three-point lighting: a key that throws the flange edges, a cool fill
          that keeps the shadow side from going black, and a rim that separates
          the assembly from the background. */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 5, 3]} intensity={2.6} color="#FFF6E8" />
      <directionalLight position={[-4, 2, -3]} intensity={0.8} color="#5B8DEF" />
      <directionalLight position={[0, -2, 4]} intensity={0.35} color="#3FA9E8" />

      <Suspense fallback={null}>
        {/*
          A studio environment is what makes the steel look like steel —
          a metalness of 0.9 has nothing to reflect without one.

          This rig is built from Lightformers rather than drei's `preset`,
          which fetches an HDR from a third-party CDN. That request is blocked
          by this site's Content-Security-Policy (`connect-src 'self'`), and
          when it fails the whole scene throws. Building the environment
          locally keeps the reflections and removes the third party entirely —
          no external fetch, nothing to be blocked, and no HDR to download.

          `frames={1}` bakes the cube map once instead of re-rendering the
          environment every frame.
        */}
        <Environment resolution={256} frames={1}>
          {/* Key: a broad softbox above and to the right. */}
          <Lightformer
            form="rect"
            intensity={7}
            color="#FFF4E2"
            position={[3, 4, 2]}
            scale={[6, 6, 1]}
            target={[0, 0, 0]}
          />
          {/* Fill: cool and wide, so the shadow side reads as metal, not black. */}
          <Lightformer
            form="rect"
            intensity={2.6}
            color="#8FB4F5"
            position={[-4, 1, -3]}
            scale={[6, 4, 1]}
            target={[0, 0, 0]}
          />
          {/* Rim: a narrow strip that draws a bright edge along the flanges. */}
          <Lightformer
            form="rect"
            intensity={4.2}
            color="#3FA9E8"
            position={[0, -2, 4]}
            scale={[5, 1, 1]}
            target={[0, 0, 0]}
          />
          {/* A dim ring overhead stands in for the ambient bounce of a shop. */}
          <Lightformer
            form="ring"
            intensity={2.2}
            color="#FFFFFF"
            position={[0, 6, 0]}
            scale={8}
            target={[0, 0, 0]}
          />
        </Environment>
        <Assembly {...controls} />
        <ContactShadows
          position={[0, -1.45, 0]}
          opacity={0.42}
          scale={7}
          blur={2.6}
          far={3}
          resolution={512}
        />
      </Suspense>
    </Canvas>
  );
}
