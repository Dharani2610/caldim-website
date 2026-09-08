"use client";

import Image from "next/image";
import Badge3D from "@/frontend/components/Badge3D";
import Reveal from "@/frontend/components/ui/Reveal";
import SectionHeading from "@/frontend/components/ui/SectionHeading";
import { softwareLogos } from "@/shared/data/softwareLogos";

// House-style seal codes for standards — short identifiers for the badge, not
// reproductions of any standards body's actual logo.
const standardBadges = [
  { code: "AISC 360", label: "AISC 360" },
  { code: "AISC 303", label: "AISC 303" },
  { code: "CISC", label: "CISC" },
  { code: "AMP 521", label: "NAAMM AMP 521" },
  { code: "SJI", label: "SJI" },
  { code: "SDI", label: "SDI" },
  { code: "OSHA", label: "OSHA 1910" },
  { code: "IBC", label: "IBC" },
];

export default function SoftwareStandards() {
  return (
    <section
      id="about"
      className="relative border-y border-blueprint bg-steel-900/40 py-24 md:py-32"
      aria-label="Tools of record"
    >
      <div className="mx-auto max-w-[1440px] px-6 md:px-10">
        <SectionHeading eyebrow="TOOLS OF RECORD" />

        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-12">
          {/* Software Showcase */}
          <div>
            <Reveal>
              <h3 className="mb-2 font-display text-2xl font-semibold text-paper">
                Software & Technology
              </h3>
              <p className="mb-8 text-sm leading-relaxed text-paper-dim">
                Industry-standard tools powering accurate structural steel detailing and engineering.
              </p>
            </Reveal>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5">
              {softwareLogos.map((logo, index) => (
                <Reveal key={logo.src} delay={(index + 1) * 0.1}>
                  <div
                    className="group relative flex h-28 sm:h-32 w-full items-center justify-center rounded-2xl border border-slate-200/85 bg-white p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_14px_30px_-6px_rgba(0,0,0,0.14)]"
                  >
                    <Image
                      src={logo.src}
                      alt={logo.alt}
                      width={logo.w}
                      height={logo.h}
                      className="max-h-11 sm:max-h-12 w-auto max-w-[82%] object-contain transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                    />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Standards & Certifications */}
          <div>
            <Reveal>
              <h3 className="mb-2 font-display text-2xl font-semibold text-paper">
                Standards we detail to
              </h3>
              <p className="mb-8 text-sm leading-relaxed text-paper-dim">
                Code compliance and strict drafting protocols across US and Canadian jurisdictions.
              </p>
            </Reveal>
            <div className="grid grid-cols-4 gap-x-4 gap-y-8">
              {standardBadges.map((badge, index) => (
                <Badge3D key={badge.label} code={badge.code} label={badge.label} delay={index * 0.3} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
