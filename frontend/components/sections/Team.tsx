import TiltCard from "@/frontend/components/TiltCard";
import Reveal from "@/frontend/components/ui/Reveal";
import SectionHeading from "@/frontend/components/ui/SectionHeading";
import { team } from "@/shared/data/content";

/**
 * The roles that make up a project team — distinct from the Leadership
 * section above it, which names the individuals. This one describes the shape
 * of the team you get, not who is in it.
 */
export default function Team() {
  return (
    <section
      className="relative border-y border-blueprint bg-steel-900/40 py-24 md:py-32"
      aria-labelledby="team-heading"
    >
      <div className="mx-auto max-w-[1440px] px-6 md:px-10">
        <SectionHeading
          eyebrow="YOUR PROJECT TEAM"
          title={
            <span id="team-heading">
              Licensed engineers and certified detailers.
            </span>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3 xl:grid-cols-5">
          {team.map((member, index) => (
            <Reveal key={member.role} delay={index * 0.06} className="h-full">
              <TiltCard className="flex flex-col gap-4 rounded-2xl border border-blueprint bg-steel-900/40 p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-accent text-accent">
                  <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
                    <circle cx="11" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="1.25" />
                    <path
                      d="M3 20c0-4.5 3.5-7 8-7s8 2.5 8 7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.25"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display text-lg md:text-xl font-semibold text-paper">{member.role}</h3>
                  <p className="label-mono-sm mt-1 text-accent">{member.credentials}</p>
                </div>
                <p className="text-sm leading-relaxed text-paper-dim">{member.note}</p>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
