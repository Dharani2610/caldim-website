import BeforeAfterSlider from "@/frontend/components/three/BeforeAfterSlider";
import TiltCard from "@/frontend/components/TiltCard";
import Reveal from "@/frontend/components/ui/Reveal";
import SectionHeading from "@/frontend/components/ui/SectionHeading";
import type { ProjectContent } from "@/shared/content/types";

export default function Projects({ projects }: { projects: ProjectContent[] }) {
  return (
    <section id="projects" className="relative bg-steel-950 py-24 md:py-32" aria-labelledby="projects-heading">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10">
        <SectionHeading
          eyebrow="SELECTED PROJECTS"
          title={<span id="projects-heading">Steel packages we&apos;ve carried from model to erection.</span>}
        />

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {projects.map((project, index) => (
            <Reveal key={project.id} delay={index * 0.08} className="h-full">
              <TiltCard
                intensity={5}
                className="flex flex-col rounded-2xl border border-blueprint bg-steel-950 p-5 md:p-6 transition-colors hover:border-blueprint-light hover:bg-steel-900/40"
              >
                <article className="flex flex-col">
                  <BeforeAfterSlider />
                  <h3 className="mt-5 font-display text-lg font-semibold text-paper">{project.type}</h3>
                  <p className="label-mono-sm mt-1 font-semibold text-accent">{project.location}</p>
                  <p className="mt-3 text-sm leading-relaxed text-paper-dim">{project.note}</p>
                  <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-blueprint pt-5">
                    <div>
                      <dt className="label-mono-sm font-semibold text-paper-dim">Tons detailed</dt>
                      <dd className="font-display text-xl font-semibold text-paper">{project.tons}</dd>
                    </div>
                    <div>
                      <dt className="label-mono-sm font-semibold text-paper-dim">Drawings issued</dt>
                      <dd className="font-display text-xl font-semibold text-paper">{project.drawings}</dd>
                    </div>
                    <div>
                      <dt className="label-mono-sm font-semibold text-paper-dim">Connections designed</dt>
                      <dd className="font-display text-xl font-semibold text-paper">{project.connections}</dd>
                    </div>
                    <div>
                      <dt className="label-mono-sm font-semibold text-paper-dim">Schedule saved</dt>
                      <dd className="font-display text-xl font-semibold text-accent">{project.scheduleSaved}</dd>
                    </div>
                  </dl>
                </article>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
