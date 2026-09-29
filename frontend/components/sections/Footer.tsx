import Image from "next/image";
import { Instagram, Linkedin } from "lucide-react";
import { standards } from "@/shared/data/content";
import type { ServiceContent } from "@/shared/content/types";
import { AiscSeal, NisdSeal } from "@/frontend/components/sections/Certifications";
import GlobalEngineeringNetwork from "@/frontend/components/sections/GlobalEngineeringNetwork";

const sitemap = [
  { href: "#top", label: "Home" },
  { href: "#services", label: "Services" },
  { href: "#process", label: "Process" },
  { href: "#projects", label: "Projects" },
  { href: "#about", label: "About" },
  { href: "#leadership", label: "Leadership" },
  { href: "#careers", label: "Careers" },
  { href: "#contact", label: "Contact" },
  { href: "/certificates", label: "Reviews & Recommendations" },
];

export default function Footer({ services }: { services: ServiceContent[] }) {
  return (
    <footer id="site-footer" className="relative border-t border-blueprint bg-steel-950 pb-8 pt-16">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10">
        <div className="mb-10 flex items-start justify-between">
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

        {/* Affiliation & Compliance Seals */}
        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex items-center gap-5 sm:gap-6 rounded-2xl border border-blueprint bg-steel-900/40 p-5 sm:p-7 backdrop-blur-sm transition-colors hover:border-blueprint-light">
            <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 shrink-0 items-center justify-center rounded-2xl border border-blueprint/60 bg-steel-950 p-2.5 sm:p-3 text-paper shadow-xs">
              <AiscSeal className="h-full w-full object-contain text-paper" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="label-mono-sm font-semibold text-accent">STANDARDS COMPLIANT</span>
              <h3 className="font-display text-lg md:text-xl font-semibold text-paper mt-1 leading-snug">
                American Institute of Steel Construction
              </h3>
              <p className="label-mono-sm text-paper-dim mt-1.5 leading-normal">
                AISC 360 · AISC 303 Code of Practice
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5 sm:gap-6 rounded-2xl border border-blueprint bg-steel-900/40 p-5 sm:p-7 backdrop-blur-sm transition-colors hover:border-blueprint-light">
            <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 shrink-0 items-center justify-center rounded-2xl border border-blueprint/60 bg-steel-950 p-2.5 sm:p-3 text-paper shadow-xs">
              <NisdSeal className="h-full w-full object-contain text-paper" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="label-mono-sm font-semibold text-accent">OFFICIAL MEMBER</span>
              <h3 className="font-display text-lg md:text-xl font-semibold text-paper mt-1 leading-snug">
                National Institute of Steel Detailing
              </h3>
              <p className="label-mono-sm text-paper-dim mt-1.5 leading-normal">
                NISD Detailing Member Organization
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 border-t border-blueprint pt-10 sm:grid-cols-4">
          <div>
            <h3 className="label-mono-sm font-semibold mb-4 text-paper-dim/80">SERVICES</h3>
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
            <h3 className="label-mono-sm font-semibold mb-4 text-paper-dim/80">STANDARDS</h3>
            <ul className="space-y-2">
              {standards.slice(0, 6).map((standard) => (
                <li key={standard} className="text-sm text-paper-dim">
                  {standard}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="label-mono-sm font-semibold mb-4 text-paper-dim/80">SITEMAP</h3>
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
            <h3 className="label-mono-sm font-semibold mb-4 text-paper-dim/80">CONNECT</h3>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="https://www.linkedin.com/company/caldim-engineering/posts/?feedView=all"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-paper-dim transition-colors hover:text-accent"
                >
                  <Linkedin size={16} aria-hidden="true" />
                  LinkedIn
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/caldim_engineering?stkn=bnVmOGx0Y3NqcDN1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-paper-dim transition-colors hover:text-accent"
                >
                  <Instagram size={16} aria-hidden="true" />
                  Instagram
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Global Engineering Network (Corporate Offices & Locations) */}
        <GlobalEngineeringNetwork />

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
