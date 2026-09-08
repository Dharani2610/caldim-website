import Image from "next/image";
import { Linkedin } from "lucide-react";
import { standards } from "@/shared/data/content";
import type { ServiceContent } from "@/shared/content/types";

const sitemap = [
  { href: "#top", label: "Home" },
  { href: "#services", label: "Services" },
  { href: "#process", label: "Process" },
  { href: "#projects", label: "Projects" },
  { href: "#gallery", label: "Gallery" },
  { href: "#about", label: "About" },
  { href: "#leadership", label: "Leadership" },
  { href: "#events", label: "Events" },
  { href: "#careers", label: "Careers" },
  { href: "#contact", label: "Contact" },
  { href: "/certificates", label: "Reviews & Recommendations" },
];

export default function Footer({ services }: { services: ServiceContent[] }) {
  return (
    <footer className="relative border-t border-blueprint bg-steel-950 pb-8 pt-16">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10">
        <div className="mb-12 flex items-start justify-between">
          <div className="group flex items-center gap-3" style={{ perspective: "400px" }}>
            <Image
              src="/images/caldim-logo.png"
              alt="Caldim Engineering Services logo"
              width={76}
              height={40}
              className="h-10 w-auto transition-transform duration-300 ease-out-expo group-hover:[transform:rotateY(-12deg)_rotateX(6deg)_scale(1.08)] md:h-12"
              style={{ filter: "drop-shadow(0 2px 6px rgba(42,107,204,0.45))" }}
            />
            <span className="font-display text-lg font-semibold text-paper md:text-xl">
              CALDIM ENGINEERING SERVICES
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 border-t border-blueprint pt-10 sm:grid-cols-4">
          <div>
            <h2 className="label-mono-sm mb-4 text-paper-dim/80">SERVICES</h2>
            <ul className="space-y-2">
              {services.map((service) => (
                <li key={service.id}>
                  <a
                    href="#services"
                    className="text-sm text-paper-dim transition-colors hover:text-accent"
                  >
                    {service.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="label-mono-sm mb-4 text-paper-dim/80">STANDARDS</h2>
            <ul className="space-y-2">
              {standards.slice(0, 6).map((standard) => (
                <li key={standard} className="text-sm text-paper-dim">
                  {standard}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="label-mono-sm mb-4 text-paper-dim/80">SITEMAP</h2>
            <ul className="space-y-2">
              {sitemap.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-sm font-semibold text-paper transition-colors hover:text-accent"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="label-mono-sm mb-4 text-paper-dim/80">CONNECT</h2>
            <a
              href="https://www.linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-paper-dim transition-colors hover:text-accent"
            >
              <Linkedin size={16} aria-hidden="true" />
              LinkedIn
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-blueprint pt-6 sm:flex-row sm:items-center">
          <p className="label-mono-sm text-paper-dim/80">
            © {new Date().getFullYear()} CALDIM ENGINEERING PVT LTD. ALL RIGHTS RESERVED.
          </p>
          <p className="label-mono-sm text-paper-dim/80">
            AISC 360 · AISC 303 · CISC · NAAMM · SJI · SDI
          </p>
        </div>
      </div>
    </footer>
  );
}
