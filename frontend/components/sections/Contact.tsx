"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Globe, MapPin, Phone, Upload } from "lucide-react";
import MagneticButton from "@/frontend/components/MagneticButton";
import Reveal from "@/frontend/components/ui/Reveal";
import SectionHeading from "@/frontend/components/ui/SectionHeading";
import { useCsrfToken } from "@/frontend/components/CsrfProvider";
import type { DirectContact, OfficeContent, ServiceContent } from "@/shared/content/types";

type Status = "idle" | "submitting" | "success" | "error";

/** Mirrors the server's cap so the file is rejected before it is uploaded. */
const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

export default function Contact({
  services,
  offices,
  directContacts,
}: {
  services: ServiceContent[];
  offices: OfficeContent[];
  directContacts: DirectContact[];
}) {
  const csrfToken = useCsrfToken();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [fileName, setFileName] = useState<string | null>(null);
  const mountedAt = useRef<number>(Date.now());

  // Reset the clock when the section first becomes interactive, so the
  // "filled in too fast to be human" check measures time on the form rather
  // than time on the page.
  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");
    setFieldErrors({});
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("elapsedMs", String(Date.now() - mountedAt.current));

    const file = formData.get("file");
    if (file instanceof File && file.size > MAX_ATTACHMENT_BYTES) {
      setStatus("error");
      setFieldErrors({ file: "That file is over 25MB. Send a link instead." });
      return;
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        // The double-submit token: the server compares this against the
        // signed cookie, which a cross-origin page cannot read.
        headers: { "x-caldim-csrf": csrfToken },
        body: formData,
      });

      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        fields?: Record<string, string>;
      };

      if (!response.ok || !payload.ok) {
        setStatus("error");
        setFieldErrors(payload.fields ?? {});
        setMessage(
          payload.error ??
            "Our enquiry submission service is temporarily unavailable. Please reach us directly at quotes@caldimengg.com or try again shortly."
        );
        return;
      }

      setStatus("success");
      setMessage("Sent — we'll reply within 2 business days.");
      form.reset();
      setFileName(null);
      mountedAt.current = Date.now();
    } catch {
      setStatus("error");
      setMessage(
        "Our enquiry submission service is temporarily unavailable. Please reach us directly at quotes@caldimengg.com or try again shortly."
      );
    }
  };

  const inputClass =
    "w-full rounded-xl border border-blueprint bg-transparent px-4 py-3 text-paper outline-none transition-colors placeholder:text-paper-dim/60 focus:border-accent";
  const labelClass = "label-mono-sm mb-2 block text-paper-dim";

  /** Renders the inline error for a field, and wires up aria-describedby. */
  const errorFor = (name: string) =>
    fieldErrors[name] ? (
      <p id={`${name}-error`} className="label-mono-sm mt-1.5 text-red-400">
        {fieldErrors[name]}
      </p>
    ) : null;

  const ariaFor = (name: string) =>
    fieldErrors[name]
      ? ({ "aria-invalid": true, "aria-describedby": `${name}-error` } as const)
      : {};

  const indiaOffices = offices.filter((o) => !o.isInternational && !o.city.includes("USA"));
  const usaOffice = offices.find((o) => o.isInternational || o.city.includes("USA")) ?? {
    city: "USA — INTERNATIONAL OFFICE",
    name: "Caldim Tech Services LLC",
    address: "8668 John Hickman Pkwy, Suite 903, Frisco, Texas 75034, USA",
    phone: "+1 (248) 455-3855",
    tag: "INTERNATIONAL OFFICE",
    isInternational: true,
  };

  return (
    <section
      id="contact"
      className="relative border-y border-blueprint bg-steel-900/40 py-24 md:py-32"
      aria-labelledby="contact-heading"
    >
      <div className="mx-auto max-w-[1440px] px-6 md:px-10">
        <SectionHeading
          eyebrow="CONTACT"
          title={<span id="contact-heading">Send us the drawings. We&apos;ll send back a quote.</span>}
        />

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          <Reveal className="lg:col-span-2">
            <form
              onSubmit={handleSubmit}
              noValidate
              className="grid grid-cols-1 gap-6 sm:grid-cols-2"
            >
              <div>
                <label htmlFor="name" className={labelClass}>Name</label>
                <input id="name" name="name" required autoComplete="name" className={inputClass} placeholder="Jordan Reyes" {...ariaFor("name")} />
                {errorFor("name")}
              </div>
              <div>
                <label htmlFor="company" className={labelClass}>Company</label>
                <input id="company" name="company" required autoComplete="organization" className={inputClass} placeholder="Reyes Fabrication Co." {...ariaFor("company")} />
                {errorFor("company")}
              </div>
              <div>
                <label htmlFor="email" className={labelClass}>Email</label>
                <input id="email" name="email" type="email" required autoComplete="email" className={inputClass} placeholder="jordan@fab-co.com" {...ariaFor("email")} />
                {errorFor("email")}
              </div>
              <div>
                <label htmlFor="role" className={labelClass}>Role</label>
                <input id="role" name="role" autoComplete="organization-title" className={inputClass} placeholder="Project Manager" />
              </div>
              <div>
                <label htmlFor="projectType" className={labelClass}>Project type</label>
                <select id="projectType" name="projectType" required className={inputClass} {...ariaFor("projectType")}>
                  <option value="">Select a service</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.title}>
                      {service.title}
                    </option>
                  ))}
                </select>
                {errorFor("projectType")}
              </div>
              <div>
                <label htmlFor="tonnage" className={labelClass}>Tonnage (approx.)</label>
                <input id="tonnage" name="tonnage" className={inputClass} placeholder="e.g. 800 tons (725 t)" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="timeline" className={labelClass}>Timeline</label>
                <input id="timeline" name="timeline" className={inputClass} placeholder="Need drawings starting mid-October" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="message" className={labelClass}>Message</label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  className={inputClass}
                  placeholder="Scope, schedule constraints, anything we should know before quoting."
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="file" className={labelClass}>Drawings / RFQ (optional)</label>
                <label
                  htmlFor="file"
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-blueprint-light px-4 py-4 transition-colors hover:border-accent"
                >
                  <Upload size={18} className="shrink-0 text-accent" aria-hidden="true" />
                  <span className="text-sm text-paper-dim">
                    {fileName ?? "PDF, DWG, DXF, IFC, or ZIP — up to 25MB"}
                  </span>
                </label>
                <input
                  id="file"
                  name="file"
                  type="file"
                  accept=".pdf,.dwg,.dxf,.ifc,.zip"
                  className="sr-only"
                  onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)}
                  {...ariaFor("file")}
                />
                {errorFor("file")}
              </div>

              {/*
                Honeypot. Hidden from people with CSS and from assistive tech
                with aria-hidden and tabIndex, but present in the DOM — which
                is all a form-filling bot looks at.
              */}
              <div className="absolute left-[-9999px]" aria-hidden="true">
                <label htmlFor="website">Leave this field empty</label>
                <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-4 sm:col-span-2">
                <MagneticButton type="submit" variant="solid" disabled={status === "submitting"}>
                  {status === "submitting" ? "Sending…" : "Send Request"}
                </MagneticButton>

                {/* One live region for both outcomes, so a screen reader
                    announces the result without the message being duplicated. */}
                <div
                  role="status"
                  aria-live="polite"
                  className={`label-mono-sm sm:col-span-2 ${
                    status === "success"
                      ? "text-accent"
                      : status === "error"
                      ? "rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-red-300"
                      : "sr-only"
                  }`}
                >
                  <p>{message}</p>
                  {status === "error" && (
                    <p className="mt-2 text-xs text-paper-dim">
                      Direct Email:{" "}
                      <a href="mailto:quotes@caldimengg.com" className="text-accent underline">
                        quotes@caldimengg.com
                      </a>
                    </p>
                  )}
                </div>
              </div>

              <p className="label-mono-sm sm:col-span-2 text-paper-dim/80">
                Your drawings stay confidential. We don&apos;t share submissions with third parties.
              </p>
            </form>
          </Reveal>

          <Reveal delay={0.1} className="flex flex-col gap-8">
            <h3 className="font-display text-xl font-semibold text-paper">Offices</h3>
            {indiaOffices.map((office) => (
              <div key={office.city} className="border-t border-blueprint pt-4">
                <p className="font-medium text-paper">{office.city}</p>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-paper-dim">
                  {office.address}
                </p>
              </div>
            ))}

            <div className="border-t border-blueprint pt-4">
              <p className="label-mono-sm font-semibold mb-2 text-paper-dim/80">DIRECT CONTACTS</p>
              <ul className="space-y-1.5">
                {directContacts.map((contact) => (
                  <li key={contact.email} className="flex items-baseline gap-2 text-sm">
                    <span className="w-20 shrink-0 text-paper-dim/80">{contact.name}</span>
                    <a
                      href={`mailto:${contact.email}`}
                      className="break-all text-paper transition-colors hover:text-accent"
                    >
                      {contact.email}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        {/* Global Presence & USA Office Panel */}
        <div id="global-presence" className="mt-20 border-t border-blueprint pt-16">
          <Reveal>
            <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12 lg:gap-12">
              {/* Left Column: Context & Global Presence Details */}
              <div className="flex flex-col justify-between lg:col-span-6">
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Globe size={15} className="text-accent" aria-hidden="true" />
                    <span className="label-mono-sm font-semibold uppercase tracking-widest text-accent">
                      GLOBAL PRESENCE
                    </span>
                  </div>

                  <h3 className="font-display text-2xl font-bold tracking-tight text-paper sm:text-3xl lg:text-4xl">
                    Engineering Beyond Borders.
                  </h3>

                  <p className="mt-4 text-base leading-relaxed text-paper-dim">
                    Delivering AISC-compliant steel detailing and PE-stamped connection designs across
                    North America and worldwide. Our dedicated US presence in Texas ensures real-time
                    collaboration, seamless project management, and rapid turnaround across all US time zones.
                  </p>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-4 border-t border-blueprint/60 pt-6 sm:grid-cols-3">
                  <div className="flex flex-col">
                    <span className="label-mono-sm font-bold text-accent">50 STATES</span>
                    <span className="text-xs text-paper-dim mt-0.5">PE Stamping Coverage</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="label-mono-sm font-bold text-accent">AISC &amp; NISD</span>
                    <span className="text-xs text-paper-dim mt-0.5">Standards Compliant</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="label-mono-sm font-bold text-accent">CST / EST / PST</span>
                    <span className="text-xs text-paper-dim mt-0.5">US Time Zone Alignment</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Visually Distinct USA Office Panel */}
              <div className="lg:col-span-6">
                <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-blueprint bg-steel-900/50 p-6 backdrop-blur-md transition-all duration-300 hover:border-blueprint-light motion-reduce:transition-none sm:p-8 card-surface">
                  {/* Subtle technical blueprint grid background texture */}
                  <div
                    className="pointer-events-none absolute inset-0 bp-grid-fine opacity-25 transition-opacity duration-300 group-hover:opacity-40 motion-reduce:transition-none [html.light_&]:opacity-15"
                    aria-hidden="true"
                  />

                  {/* Corner Accent Glow */}
                  <div
                    className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent/10 blur-2xl transition-opacity duration-500 group-hover:opacity-100 motion-reduce:hidden"
                    aria-hidden="true"
                  />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75 motion-reduce:hidden" />
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
                        </span>
                        <span className="label-mono font-semibold uppercase tracking-wider text-paper text-xs sm:text-sm">
                          {usaOffice.city || "USA — INTERNATIONAL OFFICE"}
                        </span>
                      </div>
                      <span className="label-mono-sm rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[11px] font-semibold text-accent">
                        {usaOffice.tag || "INTERNATIONAL OFFICE"}
                      </span>
                    </div>

                    <div className="mt-5">
                      <h4 className="font-display text-lg font-bold text-paper sm:text-xl">
                        {usaOffice.name || "Caldim Tech Services LLC"}
                      </h4>
                      <div className="my-4 border-l-2 border-accent pl-4">
                        <p className="text-sm leading-relaxed text-paper-dim">
                          {usaOffice.address}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 mt-6 flex flex-col gap-4 border-t border-blueprint/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 label-mono-sm text-[11px] text-paper-dim/80">
                      <MapPin size={13} className="text-accent shrink-0" aria-hidden="true" />
                      <span>Frisco, TX · 33.1507° N, 96.8236° W</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="label-mono-sm text-xs text-paper-dim/80 hidden sm:inline">
                        Direct Line:
                      </span>
                      <a
                        href={`tel:${(usaOffice.phone || "+12484553855").replace(/[^\d+]/g, "")}`}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all duration-200 hover:bg-accent/90 hover:shadow-accent/20 motion-reduce:transition-none"
                      >
                        <Phone size={13} aria-hidden="true" />
                        <span>{usaOffice.phone || "+1 (248) 455-3855"}</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
