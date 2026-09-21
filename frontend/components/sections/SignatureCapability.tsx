import ExplodedConnectionViewer from "@/frontend/components/three/ExplodedConnectionViewer";
import { DimensionLine } from "@/frontend/components/DrawingMarks";
import SectionHeading from "@/frontend/components/ui/SectionHeading";

export default function SignatureCapability() {
  return (
    <section id="connections" className="relative bg-steel-900/40 py-24 md:py-32 border-y border-blueprint">
      <div className="max-w-[1440px] mx-auto px-6 md:px-10">
        <SectionHeading
          eyebrow="SIGNATURE CAPABILITY"
          title="Connections design, stamped by a licensed PE — in any state you build in."
        />


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <p className="text-paper-dim leading-relaxed mb-6 max-w-lg">
              Most detailers hand you a connection and let your EOR figure out
              if it works. We calculate it ourselves — moment, shear, bracing,
              and base plate — per AISC 360-22, and put a stamped seal on the
              package before it leaves our shop.
            </p>
            <ExplodedConnectionViewer />
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="label-mono text-accent mb-1">COVERAGE</p>
                <p className="text-paper font-display font-semibold">50-state PE</p>
              </div>
              <div>
                <p className="label-mono text-accent mb-1">DESIGN BASIS</p>
                <p className="text-paper font-display font-semibold">AISC 360-22</p>
              </div>
              <div>
                <p className="label-mono text-accent mb-1">TURNAROUND</p>
                <p className="text-paper font-display font-semibold">5–8 business days</p>
              </div>
            </div>
          </div>

          {/* Sample calc package document mockup */}
          <div className="relative bg-paper text-steel-950 rounded-2xl shadow-2xl p-8 md:p-10 rotate-[0.6deg]">
            <div className="flex items-start justify-between border-b border-steel-950/15 pb-4 mb-6">
              <div>
                <p className="label-mono text-steel-950/60">CALC PACKAGE — SAMPLE</p>
                <p className="font-display font-semibold text-lg">
                  Moment Connection Design — Grid B/3
                </p>
              </div>
              <div className="text-right">
                <p className="label-mono text-steel-950/60">PROJECT</p>
                <p className="label-mono">2026-0148</p>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              <DimensionLine label="W112x26 [TYP]" width={220} />
              <div className="h-2 bg-steel-950/10 rounded-full w-[92%]" />
              <div className="h-2 bg-steel-950/10 rounded-full w.[78%]" />
              <div className="h-2 bg-steel-950/10 rounded-full w-[85%]" />
              <div className="h-2 bg-steel-950/10 rounded-full w-[60%]" />
            </div>


            <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
              <div className="border border-steel-950/15 rounded-xl p-3">
                <p className="label-mono text-steel-950/50">Mu</p>
                <p className="font-mono font-medium">184 kip-ft</p>
              </div>
              <div className="border border-steel-950/15 rounded-xl -3">
                <p className="label-mono text-steel-950/50">ƆMn</p>
                <p className="font-mono font-medium">221 kip-ft</p>
              </div>
              <div className="border border-steel-950/15 rounded-xl -3">
                <p className="label-mono text-steel-950/50">Bolt group</p>
                <p className="font-mono font-medium">(8) 7/8&quot; A325-SC</p>
              </div>
              <div className="border border-steel-950/15 rounded-xl p-3">
                <p className="label-mono text-steel-950/50">Ratio</p>
                <p className="font-mono font-medium text-accent">0.83 OK</p>
              </div>
            </div>


            {/* PE seal graphic */}
            <div className="flex items-center gap-3 border-t border-steel-950/15 pt-6">
              <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
                <circle cx="28" cy="28" r="26" fill="none" stroke="currentColor" strokeWidth="1.25" />
                <circle cx="28" cy="28" r="21" fill="none" stroke="currentColor" strokeWidth="0.75" />
                <text
                  x="28"
                  y="20"
                  textAnchor="middle"
                  fontFamily="var(--font-jetbrains-mono), monospace"
                  fontSize="6"
                  fill="currentColor"
                >
                  LICENSED
                </text>
                <text
                  x="28"
                  y="32"
                  textAnchor="middle"
                  fontFamily="var(--font-space-grotesk), sans-serif"
                  fontWeight="700"
                  fontSize="9"
                  fill="currentColor"
                >
                  P.E.
                </text>
                <text
                  x="28"
                  y="42"
                  textAnchor="middle"
                  fontFamily="var(--font-jetbrains-mono), monospace"
                  fontSize="5.5"
                  fill="currentColor"
                >
                  STRUCTURAL
                </text>
              </svg>
              <div>
                <p className="label-mono text-steel-950/50">SEALED</p>
                <p className="text-sm font-medium">Sample — for illustration only</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
