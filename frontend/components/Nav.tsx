"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import MagneticButton from "@/frontend/components/MagneticButton";
import ThemeToggle from "@/frontend/components/ThemeToggle";

const links = [
  { href: "/#services", anchor: "services", label: "Services", fullLabel: "Services" },
  { href: "/#process", anchor: "process", label: "Process", fullLabel: "Process" },
  { href: "/#projects", anchor: "projects", label: "Projects", fullLabel: "Projects" },
  { href: "/#gallery", anchor: "gallery", label: "Gallery", fullLabel: "Gallery" },
  { href: "/#about", anchor: "about", label: "About", fullLabel: "About" },
  { href: "/#leadership", anchor: "leadership", label: "Leadership", fullLabel: "Leadership" },
  { href: "/#events", anchor: "events", label: "Events", fullLabel: "Events" },
  { href: "/#careers", anchor: "careers", label: "Careers", fullLabel: "Careers" },
  { href: "/#contact", anchor: "contact", label: "Contact", fullLabel: "Contact" },
  { href: "/certificates", anchor: "certificates", label: "Reviews", fullLabel: "Reviews & Recommendations" },
];

export default function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>("");
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /**
   * Scroll spy on homepage.
   */
  useEffect(() => {
    if (pathname !== "/") {
      setActiveId(pathname === "/certificates" ? "certificates" : "");
      return;
    }

    const sections = links
      .filter((link) => link.anchor !== "certificates")
      .map((link) => document.getElementById(link.anchor))
      .filter((element): element is HTMLElement => element !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target?.id) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [pathname]);

  /** Escape closes the mobile menu and returns focus to the button that opened it. */
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        !toggleRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        scrolled || open
          ? "border-b border-blueprint bg-steel-950/90 backdrop-blur-md"
          : "border-b border-blueprint/30 bg-steel-950/75 backdrop-blur-md"
      }`}
    >
      <nav
        className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-6 md:h-24 md:px-10"
        aria-label="Primary"
      >
        <Link href="/#top" className="group flex shrink-0 items-center gap-3" style={{ perspective: "400px" }}>
          <Image
            src="/images/caldim-logo.png"
            alt="Caldim Engineering Services logo"
            width={76}
            height={40}
            priority
            className="h-10 w-auto transition-transform duration-300 ease-out-expo group-hover:[transform:rotateY(-12deg)_rotateX(6deg)_scale(1.08)] md:h-12"
            style={{ filter: "drop-shadow(0 2px 6px rgba(42,107,204,0.45))" }}
          />
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg font-bold tracking-tight text-paper md:text-xl">
              CALDIM
            </span>
            <span className="mt-0.5 text-[10px] font-normal tracking-widest text-paper-dim sm:text-[11px]">
              ENGINEERING SERVICES
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-5 xl:flex 2xl:gap-7">
          {links.map((link) => {
            const isActive =
              pathname === "/certificates"
                ? link.anchor === "certificates"
                : activeId === link.anchor;

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "true" : undefined}
                className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive ? "text-accent" : "text-paper hover:text-accent"
                }`}
              >
                {link.label}
                <span
                  className={`absolute inset-x-0 -bottom-0.5 h-px origin-center bg-accent transition-transform duration-300 ease-out-expo ${
                    isActive ? "scale-x-100" : "scale-x-0"
                  }`}
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </div>

        <div className="hidden shrink-0 items-center gap-4 xl:flex">
          <ThemeToggle />
          <MagneticButton href="/#contact" variant="solid">
            Request Quote
          </MagneticButton>
        </div>

        <div className="flex shrink-0 items-center gap-2 xl:hidden">
          <ThemeToggle />
          <button
            ref={toggleRef}
            className="p-2 text-paper"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((value) => !value)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              {open ? (
                <path d="M5 5L19 19M19 5L5 19" stroke="currentColor" strokeWidth="1.75" />
              ) : (
                <>
                  <line x1="3" y1="7" x2="21" y2="7" stroke="currentColor" strokeWidth="1.75" />
                  <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1.75" />
                  <line x1="3" y1="17" x2="21" y2="17" stroke="currentColor" strokeWidth="1.75" />
                </>
              )}
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <div
          ref={panelRef}
          id="mobile-menu"
          className="flex max-h-[calc(100vh-5rem)] flex-col gap-1 overflow-y-auto border-t border-blueprint bg-steel-950 px-6 py-5 xl:hidden"
        >
          {links.map((link) => {
            const isActive =
              pathname === "/certificates"
                ? link.anchor === "certificates"
                : activeId === link.anchor;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                aria-current={isActive ? "true" : undefined}
                className={`rounded-lg px-2 py-3 text-base font-medium transition-colors ${
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-paper hover:bg-steel-900"
                }`}
              >
                {link.fullLabel || link.label}
              </Link>
            );
          })}
          <Link
            href="/#contact"
            onClick={() => setOpen(false)}
            className="mt-3 inline-block rounded-xl border border-btn-solid bg-accent px-5 py-3 text-center text-sm font-medium text-steel-950"
          >
            Request Quote
          </Link>
        </div>
      )}
    </header>
  );
}
