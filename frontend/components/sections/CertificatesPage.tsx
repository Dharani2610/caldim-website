"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/frontend/components/ui/Reveal";
import SectionHeading from "@/frontend/components/ui/SectionHeading";
import CertificateLightbox from "@/frontend/components/ui/CertificateLightbox";
import type { CertificateItemView } from "@/shared/content/types";

export default function CertificatesPage({
  certificates = [],
}: {
  certificates?: CertificateItemView[];
}) {
  const [activeCert, setActiveCert] = useState<CertificateItemView | null>(null);

  // Group certificates into two categories
  const certifications = certificates.filter((c) => c.category === "certification");
  const recommendations = certificates.filter(
    (c) => c.category === "recommendation" || !c.category
  );

  return (
    <div className="relative min-h-[80vh] py-16 md:py-24 space-y-24 md:space-y-32">
      {/* ─── SECTION 1: Certifications & Memberships ─── */}
      <section className="relative" aria-labelledby="certifications-heading">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10">
          <SectionHeading
            eyebrow="ACCREDITATIONS & LICENSURES"
            title={<span id="certifications-heading">Certifications & Memberships</span>}
            lead="Official accreditation certificates and membership documentation."
            as="h1"
          />

          {certifications.length > 0 ? (
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 md:gap-8">
              {certifications.map((cert, index) => renderCertificateCard(cert, index, setActiveCert))}
            </div>
          ) : (
            /* Simple, Low-Claim Placeholder for Certifications */
            <div className="mt-10">
              <div className="rounded-2xl border border-blueprint/70 bg-steel-900/40 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="font-display text-xl font-semibold text-paper">
                    Certifications & Memberships will be added soon
                  </h2>
                  <p className="mt-2 text-sm text-paper-dim leading-relaxed max-w-2xl">
                    Renewed membership certificates and official accreditation documents are currently being prepared for publication. If you need specific PE stamping licensure verification or compliance records for your project, please reach out to us.
                  </p>
                </div>
                <Link
                  href="/#contact"
                  className="inline-flex shrink-0 items-center justify-center rounded-xl border border-blueprint/80 bg-steel-950/80 px-6 py-3 text-sm font-medium text-paper transition-colors hover:border-accent hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  Contact Us ↗
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── SECTION 2: Client & Fabricator Recommendations ─── */}
      <section className="relative" aria-labelledby="recommendations-heading">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10">
          <SectionHeading
            eyebrow="CLIENT & FABRICATOR ENDORSEMENTS"
            title={<span id="recommendations-heading">Reviews & Recommendations</span>}
            lead="Letters of recommendation and performance reviews from partner steel fabricators."
          />

          {recommendations.length > 0 ? (
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 md:gap-8">
              {recommendations.map((cert, index) => renderCertificateCard(cert, index, setActiveCert))}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-blueprint/60 bg-steel-900/30 p-8 text-center text-paper-dim">
              <p>No client recommendation letters have been published yet.</p>
            </div>
          )}

          {/* Verification CTA Box */}
          <Reveal delay={0.2} className="mt-16">
            <div className="rounded-2xl border border-blueprint bg-steel-900/60 p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <p className="label-mono text-accent text-xs font-semibold">DIRECT VERIFICATION</p>
                <h3 className="font-display text-xl md:text-2xl font-semibold text-paper mt-1">
                  Need official calculation packets or specific fabricator references?
                </h3>
                <p className="text-sm text-paper-dim mt-2 max-w-xl">
                  Our quality checking logs, sample drawing packets, and direct fabricator references can be provided directly upon request.
                </p>
              </div>
              <Link
                href="/#contact"
                className="inline-flex shrink-0 items-center justify-center rounded-xl border border-btn-solid bg-accent px-7 py-3.5 text-sm font-semibold text-steel-950 transition-colors hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                Request Verification Details
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Full-view Lightbox Modal */}
      <CertificateLightbox
        certificate={activeCert}
        onClose={() => setActiveCert(null)}
      />
    </div>
  );
}

/** Helper function to render an individual certificate/recommendation card */
function renderCertificateCard(
  cert: CertificateItemView,
  index: number,
  onSelect: (cert: CertificateItemView) => void
) {
  const hasThumbnail = Boolean(cert.thumbnailUrl);
  const isPdf = cert.kind === "raw" || cert.format.toLowerCase() === "pdf";

  return (
    <Reveal key={cert.id} delay={index * 0.06}>
      {hasThumbnail ? (
        <button
          type="button"
          onClick={() => onSelect(cert)}
          aria-haspopup="dialog"
          className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-blueprint bg-steel-900/50 p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-[0_12px_30px_-8px_rgba(63,169,232,0.25)] focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {/* Thumbnail Image Visual */}
          <div className="relative h-60 w-full overflow-hidden rounded-xl border border-blueprint/60 bg-steel-950/80">
            <Image
              src={cert.thumbnailUrl!}
              alt={cert.alt || cert.caption || "Document preview"}
              fill
              sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
              className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-steel-950/90 via-steel-950/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100 flex items-end justify-between p-3.5">
              <span className="label-mono-sm text-accent font-semibold flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="11" y1="8" x2="11" y2="14" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
                QUICK PREVIEW
              </span>
              {isPdf && (
                <span className="label-mono-sm text-paper-dim bg-steel-950/80 px-2 py-0.5 rounded border border-blueprint/60">
                  PDF
                </span>
              )}
            </div>
          </div>

          {/* Content Details */}
          <div className="mt-5 flex flex-1 flex-col justify-between">
            <div>
              <h3 className="font-display text-xl font-semibold text-paper group-hover:text-accent transition-colors">
                {cert.caption || cert.alt || "Official Letter"}
              </h3>
              {cert.meta && (
                <p className="label-mono-sm mt-1 text-paper-dim">{cert.meta}</p>
              )}
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-blueprint/50 pt-3 text-xs text-accent">
              <span className="label-mono-sm">
                {isPdf ? "DOCUMENT PREVIEW" : "VERIFIED RECORD"}
              </span>
              <span className="font-medium">VIEW FULL-SIZE ↗</span>
            </div>
          </div>
        </button>
      ) : (
        <a
          href={cert.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-blueprint bg-steel-900/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-[0_12px_30px_-8px_rgba(63,169,232,0.25)] focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {/* Document Preview Header (Fallback) */}
          <div className="flex h-60 w-full flex-col items-center justify-center rounded-xl border border-blueprint/60 bg-steel-950/60 p-4 transition-colors group-hover:bg-steel-950/90">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-transform duration-300 group-hover:scale-110">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <span className="label-mono-sm mt-3 text-accent font-semibold tracking-wider">
              PDF DOCUMENT
            </span>
            <span className="mt-1 text-xs text-paper-dim">Click to open in new tab ↗</span>
          </div>

          {/* Content Details */}
          <div className="mt-5 flex flex-1 flex-col justify-between">
            <div>
              <h3 className="font-display text-xl font-semibold text-paper group-hover:text-accent transition-colors">
                {cert.caption || cert.alt || "Official Document"}
              </h3>
              {cert.meta && (
                <p className="label-mono-sm mt-1 text-paper-dim">{cert.meta}</p>
              )}
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-blueprint/50 pt-3 text-xs text-accent">
              <span className="label-mono-sm">VERIFIED FILE</span>
              <span className="font-medium">VIEW PDF ↗</span>
            </div>
          </div>
        </a>
      )}
    </Reveal>
  );
}
