"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Upload } from "lucide-react";
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
            <h3 className="font-display text-lg font-semibold text-paper">Offices</h3>
            {offices.map((office) => (
              <div key={office.city} className="border-t border-blueprint pt-4">
                <p className="font-medium text-paper">{office.city}</p>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-paper-dim">
                  {office.address}
                </p>
              </div>
            ))}

            <div className="border-t border-blueprint pt-4">
              <p className="label-mono-sm mb-2 text-paper-dim/80">DIRECT CONTACTS</p>
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
      </div>
    </section>
  );
}
