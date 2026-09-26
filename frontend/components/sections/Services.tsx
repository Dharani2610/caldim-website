"use client";

import { useState } from "react";
import Reveal from "@/frontend/components/ui/Reveal";
import type { ServiceContent } from "@/shared/content/types";
import DisciplineCanvas, { type CanvasBadge } from "@/frontend/components/three/disciplines/DisciplineCanvas";
import EstimationScene from "@/frontend/components/three/disciplines/EstimationScene";
import StructuralScene from "@/frontend/components/three/disciplines/StructuralScene";
import MiscSteelScene from "@/frontend/components/three/disciplines/MiscSteelScene";
import ConnectionScene from "@/frontend/components/three/disciplines/ConnectionScene";
import JoistDeckScene from "@/frontend/components/three/disciplines/JoistDeckScene";
import AutomationScene from "@/frontend/components/three/disciplines/AutomationScene";

interface ServicesProps {
  services: ServiceContent[];
}

const SCENE_MAP: Record<string, React.ComponentType<{ isHovered: boolean }>> = {
  estimation: EstimationScene,
  structural: StructuralScene,
  misc: MiscSteelScene,
  connections: ConnectionScene,
  "joist-deck": JoistDeckScene,
  "digital-automation": AutomationScene,
};

const BADGES_MAP: Record<string, CanvasBadge[]> = {
  estimation: [
    { text: "TAKEOFF: 48.2 TONS", variant: "blue", position: "top-right" },
    { text: "QTY: 6× W14 · 12× W18", variant: "dark", position: "bottom-right" },
  ],
  structural: [
    { text: "MARK: C1 [W14×90]", variant: "blue", position: "top-right" },
    { text: "GIRDER B101 · AISC 360", variant: "dark", position: "bottom-right" },
  ],
  misc: [
    { text: "OSHA 1910 · 42″ GUARD", variant: "amber", position: "top-right" },
    { text: "NAAMM AMP 521 STAIRS", variant: "blue", position: "bottom-right" },
  ],
  connections: [
    { text: "AISC 360-22 CHECKED", variant: "emerald", position: "top-right", icon: "✓" },
    { text: "6× A490 SC BOLTS", variant: "dark", position: "bottom-right" },
  ],
  "joist-deck": [
    { text: "SJI 24K4 JOISTS", variant: "blue", position: "top-right" },
    { text: "1.5″ COMPOSITE DECK", variant: "dark", position: "bottom-right" },
  ],
  "digital-automation": [
    { text: "TEKLA OPEN API", variant: "dark", position: "top-right" },
    { text: "POWERFAB · DSTV NC1", variant: "amber", position: "bottom-right" },
  ],
};

export default function Services({ services }: ServicesProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activeModalService, setActiveModalService] = useState<ServiceContent | null>(null);

  return (
    <section
      id="services"
      className="relative bg-[#F8FAFC] py-24 md:py-32 border-y border-slate-200/80 overflow-hidden"
      aria-labelledby="services-heading"
    >
      {/* Background CAD Blueprint Watermark Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #0F172A 1px, transparent 1px),
            linear-gradient(to bottom, #0F172A 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative mx-auto max-w-[1440px] px-6 md:px-10">
        {/* SECTION HEADER */}
        <div className="mb-14 md:mb-18 max-w-3xl">
          <Reveal>
            <p className="font-mono text-xs font-bold tracking-widest text-blue-600 uppercase mb-3 flex items-center gap-3">
              <span className="h-px w-6 bg-blue-600/60 shrink-0" aria-hidden="true" />
              CAPABILITIES
            </p>
          </Reveal>

          <Reveal delay={0.05}>
            <h2
              id="services-heading"
              className="font-display text-3xl md:text-5xl font-bold tracking-tight text-slate-900 leading-[1.12]"
            >
              Six disciplines.
              <br />
              <span className="text-blue-600">One steel package.</span>
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="mt-4 text-base md:text-lg text-slate-600 leading-relaxed">
              From concept to completion, our integrated capabilities deliver
              precision, efficiency and value across the entire steel construction lifecycle.
            </p>
          </Reveal>
        </div>

        {/* 2-COLUMN RESPONSIVE GRID (REFERENCE 2 LAYOUT) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {services.map((service, index) => {
            const isFeatured = service.id === "structural";
            const SceneComponent = SCENE_MAP[service.id] || StructuralScene;
            const badges = BADGES_MAP[service.id] || [];
            const isHovered = hoveredId === service.id;

            return (
              <div
                key={service.id}
                onMouseEnter={() => setHoveredId(service.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`group relative h-full flex flex-col justify-between rounded-2xl p-6 md:p-8 transition-all duration-300 ease-out ${
                  isFeatured
                    ? "bg-gradient-to-b from-[#F0F7FF] via-white to-[#F8FAFC] border border-blue-400/60 ring-1 ring-blue-500/20 shadow-[0_8px_30px_-6px_rgba(37,99,235,0.12)] hover:shadow-[0_16px_40px_-6px_rgba(37,99,235,0.2)] hover:border-blue-500"
                    : "bg-white border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.04)] hover:shadow-[0_14px_35px_-6px_rgba(15,23,42,0.1)] hover:border-blue-300"
                } hover:-translate-y-1`}
              >
                {/* FEATURED BADGE (FOR 02 STRUCTURAL STEEL DETAILING) */}
                {isFeatured && (
                  <div className="absolute -top-3 right-6 z-20">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 font-mono text-[10px] font-bold text-white shadow-md">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-300 animate-pulse" />
                      PRIMARY CORE SERVICE
                    </span>
                  </div>
                )}

                {/* TOP BAR: DISCIPLINE NUMBER & TECHNICAL CODE */}
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                      0{index + 1}
                    </span>
                    <span className="text-[10px] font-mono font-medium text-slate-400 uppercase">
                      DISCIPLINE
                    </span>
                  </div>

                  <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100/90 px-2.5 py-1 rounded-md border border-slate-200/70">
                    {service.standard}
                  </span>
                </div>

                {/* CENTER: LARGE 3D INTERACTIVE ANIMATION VIEWPORT */}
                <div className="my-4 h-[250px] sm:h-[280px] md:h-[300px] w-full rounded-xl overflow-hidden border border-slate-200/60 bg-slate-50/60 relative group-hover:border-blue-300/60 transition-colors">
                  <DisciplineCanvas
                    SceneComponent={SceneComponent}
                    isHovered={isHovered}
                    badges={badges}
                  />
                </div>

                {/* BOTTOM: TITLE, SUMMARY & ACTION */}
                <div className="flex flex-col justify-between pt-2">
                  <div>
                    <h3 className="font-display text-xl md:text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {service.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      {service.summary}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveModalService(service)}
                      className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-blue-600 hover:text-blue-700 transition-all cursor-pointer group/btn"
                    >
                      <span>Learn more</span>
                      <span
                        className="transition-transform duration-200 group-hover/btn:translate-x-1"
                        aria-hidden="true"
                      >
                        →
                      </span>
                    </button>

                    <span className="text-[10px] font-mono text-slate-400">
                      {service.deliverables.length} Deliverables
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DELIVERABLES DETAIL MODAL */}
      {activeModalService && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setActiveModalService(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl bg-white p-6 md:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-5">
              <div>
                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                  {activeModalService.standard}
                </span>
                <h3
                  id="modal-title"
                  className="font-display text-2xl font-bold text-slate-900 mt-2"
                >
                  {activeModalService.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalService(null)}
                aria-label="Close dialog"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Summary */}
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              {activeModalService.summary}
            </p>

            {/* Scope of Deliverables */}
            <div className="mb-6">
              <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
                Scope of Deliverables
              </h4>
              <ul className="space-y-2.5">
                {activeModalService.deliverables.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-sm text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100"
                  >
                    <span className="text-blue-600 font-bold" aria-hidden="true">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setActiveModalService(null)}
                className="font-mono text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Close
              </button>

              <a
                href="#contact"
                onClick={() => setActiveModalService(null)}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-mono text-xs font-bold text-white shadow hover:bg-blue-700 transition-colors"
              >
                <span>Request Scope & Quote</span>
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}