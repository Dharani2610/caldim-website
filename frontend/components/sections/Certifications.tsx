import { BadgeCheck } from "lucide-react";
import Reveal from "@/frontend/components/ui/Reveal";
import SectionHeading from "@/frontend/components/ui/SectionHeading";

function AiscSeal({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 300" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="AISC Seal">
      <defs>
        <path id="aisc-top-arc-in" d="M 42 150 A 108 108 0 0 1 258 150" fill="none" />
        <path id="aisc-bottom-arc-in" d="M 258 150 A 108 108 0 0 1 42 150" fill="none" />
      </defs>
      <circle cx="150" cy="150" r="142" stroke="currentColor" strokeWidth="12" />
      <circle cx="150" cy="150" r="132" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="150" cy="150" r="88" stroke="currentColor" strokeWidth="5" />
      <text fontFamily="'Space Grotesk', 'Arial Black', Impact, sans-serif" fontWeight="900" fontSize="13.5" fill="currentColor" letterSpacing="1.8">
        <textPath href="#aisc-top-arc-in" startOffset="50%" textAnchor="middle">
          AMERICAN INSTITUTE OF STEEL CONSTRUCTION
        </textPath>
      </text>
      <text fontFamily="'Space Grotesk', 'Arial Black', Impact, sans-serif" fontWeight="900" fontSize="14.5" fill="currentColor" letterSpacing="2.8">
        <textPath href="#aisc-bottom-arc-in" startOffset="50%" textAnchor="middle">
          ★ FOUNDED 1921 ★
        </textPath>
      </text>
      <g fill="currentColor">
        <path d="M 94 88 C 80 102 74 122 74 150 C 74 178 80 198 94 212 L 108 212 C 98 196 92 178 92 150 C 92 122 98 104 108 88 Z" />
        <rect x="110" y="88" width="12" height="124" rx="2" />
        <rect x="94" y="148" width="28" height="11" />
        <rect x="131" y="88" width="13" height="124" rx="2" />
        <path d="M 172 88 L 152 88 L 152 100 L 168 100 C 172 100 174 104 174 110 L 174 136 C 174 142 170 146 164 146 L 152 146 L 152 212 L 164 212 C 176 212 186 202 186 190 L 186 160 C 186 150 178 142 168 140 C 176 138 184 130 184 120 L 184 106 C 184 94 178 88 172 88 Z M 174 188 C 174 196 170 200 164 200 L 164 158 C 170 158 174 164 174 172 Z" />
        <path d="M 206 88 C 196 104 190 122 190 150 C 190 178 196 196 206 212 L 220 212 C 206 198 200 178 200 150 C 200 122 206 102 220 88 Z" />
        <path d="M 204 88 L 226 88 C 226 88 222 100 206 100 Z" />
        <path d="M 204 212 L 226 212 C 226 212 222 200 206 200 Z" />
      </g>
    </svg>
  );
}

function NisdSeal({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 320" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="NISD Member Seal">
      <defs>
        <path id="nisd-top-arc-in" d="M 38 140 A 112 112 0 0 1 262 140" fill="none" />
      </defs>
      <circle cx="150" cy="140" r="134" stroke="currentColor" strokeWidth="4" />
      <circle cx="150" cy="140" r="102" stroke="currentColor" strokeWidth="2" strokeDasharray="4,4" />
      <text fontFamily="'Space Grotesk', 'Arial', sans-serif" fontWeight="700" fontSize="12.5" fill="currentColor" letterSpacing="2">
        <textPath href="#nisd-top-arc-in" startOffset="50%" textAnchor="middle">
          NATIONAL INSTITUTE OF STEEL DETAILING
        </textPath>
      </text>
      <circle cx="120" cy="248" r="3" fill="currentColor" />
      <circle cx="150" cy="254" r="3" fill="currentColor" />
      <circle cx="180" cy="248" r="3" fill="currentColor" />
      <g stroke="#3B82F6" strokeWidth="5.5" fill="none" strokeLinejoin="round" strokeLinecap="round">
        <path d="M 72 75 L 72 205 M 72 75 L 112 205 M 112 75 L 112 205" />
        <path d="M 125 75 L 125 205" />
        <path d="M 175 75 C 150 75 142 95 142 115 C 142 145 180 145 180 175 C 180 195 168 205 145 205" />
        <path d="M 195 75 L 195 205 M 195 75 C 235 75 245 105 245 140 C 245 175 235 205 195 205" />
      </g>
      <text x="150" y="295" fontFamily="'JetBrains Mono', 'Space Grotesk', monospace, sans-serif" fontWeight="800" fontSize="20" fill="currentColor" textAnchor="middle" letterSpacing="4">
        MEMBER
      </text>
    </svg>
  );
}

export default function Certifications({ certifications }: { certifications: string[] }) {
  return (
    <section
      className="relative border-b border-blueprint bg-transparent py-24 md:py-32"
      aria-labelledby="certs-heading"
    >
      <div className="mx-auto max-w-[1440px] px-6 md:px-10">
        <SectionHeading
          eyebrow="CERTIFICATIONS"
          title={<span id="certs-heading">Examined on the standards, not just the software.</span>}
        />

        <Reveal>
          <ul className="flex flex-wrap gap-3">
            {certifications.map((certification, index) => (
              <li key={certification} style={{ perspective: "400px" }}>
                <span
                  className="label-mono inline-flex items-center gap-2 rounded-full border border-cert bg-accent/[0.06] px-4 py-2.5 text-accent transition-colors motion-safe:animate-badge-tilt hover:border-accent/60 hover:bg-accent/[0.12]"
                  style={{ transformStyle: "preserve-3d", animationDelay: `${index * 0.25}s` }}
                >
                  <BadgeCheck size={14} className="shrink-0" aria-hidden="true" />
                  {certification}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Official Affiliation & Standard Seals */}
        <Reveal delay={0.15}>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:max-w-5xl">
            <div className="flex items-center gap-5 sm:gap-6 rounded-2xl border border-blueprint bg-steel-900/40 p-5 sm:p-7 backdrop-blur-sm transition-colors hover:border-blueprint-light">
              <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 shrink-0 items-center justify-center rounded-2xl border border-blueprint/60 bg-steel-950 p-2.5 sm:p-3 text-paper shadow-xs">
                <AiscSeal className="h-full w-full object-contain text-paper" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="label-mono-sm font-semibold text-accent">STANDARDS COMPLIANT</span>
                <h3 className="font-display text-lg md:text-xl font-semibold text-paper mt-1 leading-snug">
                  American Institute of Steel Construction
                </h3>
                <p className="label-mono-sm text-paper-dim mt-1.5 leading-normal">AISC 360 · AISC 303 Code of Practice</p>
              </div>
            </div>

            <div className="flex items-center gap-5 sm:gap-6 rounded-2xl border border-blueprint bg-steel-900/40 p-5 sm:p-7 backdrop-blur-sm transition-colors hover:border-blueprint-light">
              <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 shrink-0 items-center justify-center rounded-2xl border border-blueprint/60 bg-steel-950 p-2.5 sm:p-3 text-paper shadow-xs">
                <NisdSeal className="h-full w-full object-contain text-paper" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="label-mono-sm font-semibold text-accent">OFFICIAL MEMBER</span>
                <h3 className="font-display text-lg md:text-xl font-semibold text-paper mt-1 leading-snug">
                  National Institute of Steel Detailing
                </h3>
                <p className="label-mono-sm text-paper-dim mt-1.5 leading-normal">NISD Detailing Member Organization</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
