import TiltCard from "@/frontend/components/TiltCard";
import Reveal from "@/frontend/components/ui/Reveal";
import SectionHeading from "@/frontend/components/ui/SectionHeading";
import type { TestimonialContent } from "@/shared/content/types";

export default function Testimonials({ testimonials }: { testimonials: TestimonialContent[] }) {
  if (testimonials.length === 0) return null;

  return (
    <section className="relative bg-steel-950 py-24 md:py-32" aria-label="Client feedback">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10">
        <SectionHeading eyebrow="CLIENT FEEDBACK" />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {testimonials.map((testimonial, index) => (
            <Reveal key={testimonial.attribution + index} delay={index * 0.08} className="h-full">
              <TiltCard intensity={5}>
                <blockquote className="flex h-full flex-col justify-between rounded-2xl border border-dashed border-blueprint-light p-6 md:p-8">
                  <p className="text-lg italic leading-relaxed text-paper">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <footer className="label-mono-sm mt-6 text-paper-dim/80">
                    {testimonial.attribution}
                  </footer>
                </blockquote>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
