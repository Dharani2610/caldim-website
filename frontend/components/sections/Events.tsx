import { CalendarDays } from "lucide-react";
import TiltCard from "@/frontend/components/TiltCard";
import Reveal from "@/frontend/components/ui/Reveal";
import SectionHeading from "@/frontend/components/ui/SectionHeading";
import type { EventContent } from "@/shared/content/types";

export default function Events({ events }: { events: EventContent[] }) {
  if (events.length === 0) return null;

  return (
    <section
      id="events"
      className="relative border-y border-blueprint bg-steel-900/40 py-24 md:py-32"
      aria-labelledby="events-heading"
    >
      <div className="mx-auto max-w-[1440px] px-6 md:px-10">
        <SectionHeading eyebrow="EVENTS" title={<span id="events-heading">Where to find us.</span>} />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
          {events.map((event, index) => (
            <Reveal key={`${event.title}-${event.date}`} delay={index * 0.06} className="h-full">
              <TiltCard className="flex flex-col rounded-2xl border border-blueprint bg-steel-950 p-6 md:p-8">
                <div className="mb-4 flex items-center gap-2">
                  <CalendarDays size={16} className="shrink-0 text-accent" aria-hidden="true" />
                  <span className="label-mono text-accent">{event.date}</span>
                </div>
                <h3 className="font-display text-lg font-semibold text-paper">{event.title}</h3>
                <p className="label-mono-sm mt-1 text-paper-dim/80">{event.location}</p>
                <p className="mt-3 text-sm leading-relaxed text-paper-dim">{event.note}</p>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
