"use client";

import { useRef, ReactNode, ComponentType, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useWebGLCapability } from "../useWebGL";

export interface CanvasBadge {
  text: string;
  variant?: "blue" | "dark" | "emerald" | "amber";
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center";
  icon?: string;
}

interface DisciplineCanvasProps {
  SceneComponent: ComponentType<{ isHovered: boolean }>;
  isHovered: boolean;
  className?: string;
  fallbackIcon?: ReactNode;
  badges?: CanvasBadge[];
}

export default function DisciplineCanvas({
  SceneComponent,
  isHovered,
  className = "w-full h-full",
  fallbackIcon,
  badges = [],
}: DisciplineCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const { state: webglState } = useWebGLCapability();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isReady = mounted && webglState !== "unavailable";

  const getBadgeStyle = (variant: CanvasBadge["variant"] = "dark") => {
    switch (variant) {
      case "blue":
        return "bg-blue-600/90 text-white border-blue-400/40 shadow-blue-500/20";
      case "emerald":
        return "bg-emerald-950/90 text-emerald-300 border-emerald-500/40 shadow-emerald-500/20";
      case "amber":
        return "bg-amber-950/90 text-amber-300 border-amber-500/40 shadow-amber-500/20";
      case "dark":
      default:
        return "bg-slate-900/90 text-sky-400 border-sky-500/30 shadow-slate-900/40";
    }
  };

  const getPositionStyle = (pos: CanvasBadge["position"] = "top-left") => {
    switch (pos) {
      case "top-left":
        return "top-3 left-3";
      case "top-right":
        return "top-3 right-3";
      case "bottom-left":
        return "bottom-3 left-3";
      case "bottom-right":
        return "bottom-3 right-3";
      case "top-center":
        return "top-3 left-1/2 -translate-x-1/2";
      default:
        return "top-3 left-3";
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none bg-gradient-to-b from-slate-50/70 to-slate-100/50 ${className}`}
    >
      {/* Subtle CAD Blueprint Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 70%),
            linear-gradient(to right, rgba(203, 213, 225, 0.4) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(203, 213, 225, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: "100% 100%, 20px 20px, 20px 20px",
        }}
      />

      {/* Axis Crosshairs in bottom corner */}
      <div className="absolute bottom-2.5 left-3 pointer-events-none z-10 flex items-center gap-1 font-mono text-[9px] font-bold text-slate-400/90">
        <span className="text-blue-500">X</span>
        <span className="text-emerald-500">Y</span>
        <span className="text-amber-500">Z</span>
        <span className="ml-1 text-slate-400">· 3D CAD</span>
      </div>

      {/* Floating Technical Annotation Badges */}
      {badges.map((badge, idx) => (
        <div
          key={idx}
          className={`absolute pointer-events-none z-10 select-none flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[10px] font-semibold backdrop-blur-md shadow-md border transition-all duration-300 ${getPositionStyle(
            badge.position
          )} ${getBadgeStyle(badge.variant)} ${
            isHovered ? "scale-105" : "scale-100"
          }`}
        >
          {badge.icon && <span className="text-[11px] font-bold">{badge.icon}</span>}
          <span>{badge.text}</span>
        </div>
      ))}

      {isReady ? (
        <Canvas
          camera={{ position: [0, 0, 4.3], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          className="relative z-0"
        >
          <ambientLight intensity={0.9} />
          <directionalLight position={[6, 8, 5]} intensity={1.3} />
          <directionalLight position={[-6, -3, -4]} intensity={0.5} color="#60A5FA" />
          <pointLight position={[0, 4, 3]} intensity={0.7} color="#BAE6FD" />
          <SceneComponent isHovered={isHovered} />
        </Canvas>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
          {fallbackIcon ? (
            fallbackIcon
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin" />
              <span className="text-[10px] font-mono text-slate-400">Loading 3D BIM...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
