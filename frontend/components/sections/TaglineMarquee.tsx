/**
 * The positioning lines, running continuously beneath the tools-of-record
 * section.
 *
 * The list is deliberately short and unique: the loop supplies the repetition,
 * so duplicating the strings in the source would only make the same phrase
 * arrive twice in quick succession rather than reading as a rotation.
 */
const taglines = [
  "STEEL DETAILING BUILT FOR FABRICATORS, NOT JUST DRAWINGS.",
  "WHERE EVERY BOLT AND WELD IS CHECKED BEFORE IT'S ISSUED.",
  "YOUR STEEL PACKAGE. OUR DETAILING. ZERO GUESSWORK.",
  "WHEN THE SCHEDULE IS TIGHT, ACCURACY CAN'T SLIP.",
];

export default function TaglineMarquee() {
  return (
    <section
      className="relative overflow-hidden border-b border-blueprint bg-transparent py-5"
      aria-label="What we stand for"
    >



      {/* The visible track is duplicated so the translate can loop seamlessly;
          it is hidden from assistive tech and the real list is read once,
          below, as ordinary static text. */}
      <div
        className="flex w-max animate-marquee items-center motion-reduce:animate-none"
        aria-hidden="true"
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center">
            {taglines.map((line) => (
              <span key={line} className="flex shrink-0 items-center">
                <span className="label-mono px-6 font-semibold uppercase text-paper md:px-8">
                  {line}
                </span>
                <span
                  className="h-1.5 w-1.5 shrink-0 rotate-45 bg-accent"
                  aria-hidden="true"
                />
              </span>
            ))}
          </div>
        ))}
      </div>

      <ul className="sr-only">
        {taglines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
}
