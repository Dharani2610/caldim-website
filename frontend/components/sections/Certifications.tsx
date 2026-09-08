import { BadgeCheck } from "lucide-react";
import Reveal from "@/frontend/components/ui/Reveal";
import SectionHeading from "@/frontend/components/ui/SectionHeading";

export default function Certifications({ certifications }: { certifications: string[] }) {
  return (
    <section
      className="relative border-b border-blueprint bg-steel-950 py-24 md:py-32"
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
      </div>
    </section>
  );
}
