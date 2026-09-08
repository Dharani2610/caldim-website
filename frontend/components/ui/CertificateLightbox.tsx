"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import type { CertificateItemView } from "@/shared/content/types";

export default function CertificateLightbox({
  certificate,
  onClose,
}: {
  certificate: CertificateItemView | null;
  onClose: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trap & Escape key listener
  useEffect(() => {
    if (!certificate) return;

    const previousActiveElement = document.activeElement as HTMLElement | null;

    // Focus close button initially
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "Tab") {
        if (!modalRef.current) return;
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previousActiveElement?.focus();
    };
  }, [certificate, onClose]);

  if (!certificate) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lightbox-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-steel-950/90 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="card-surface relative flex flex-col max-h-[92vh] max-w-5xl w-full overflow-hidden rounded-2xl border border-blueprint bg-steel-900 shadow-2xl"
      >
        {/* Header / Top bar */}
        <div className="flex items-center justify-between border-b border-blueprint px-6 py-4 bg-steel-950/60">
          <div>
            <h3 id="lightbox-title" className="font-display text-lg font-semibold text-paper">
              {certificate.caption || certificate.alt || "Official Certificate"}
            </h3>
            {certificate.meta && (
              <p className="label-mono-sm text-accent mt-0.5">{certificate.meta}</p>
            )}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close certificate lightbox"
            className="rounded-xl border border-blueprint p-2 text-paper-dim transition-colors hover:border-accent hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Certificate Preview Image View */}
        <div className="relative flex-1 flex items-center justify-center p-6 bg-steel-950/40 overflow-auto min-h-[300px]">
          <div className="relative max-h-[70vh] w-auto max-w-full">
            <Image
              src={certificate.thumbnailUrl || certificate.url}
              alt={certificate.alt || certificate.caption || "Full certificate preview"}
              width={certificate.width || 1200}
              height={certificate.height || 850}
              className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl shadow-xl border border-blueprint/60"
              priority
            />
          </div>
        </div>

        {/* Footer info & Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-blueprint px-6 py-4 bg-steel-950/60 text-xs text-paper-dim">
          <span className="label-mono-sm">CALDIM ENGINEERING SERVICES · VERIFIED RECORD</span>
          {certificate.kind === "raw" || certificate.format.toLowerCase() === "pdf" ? (
            <a
              href={certificate.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-accent bg-accent/10 px-4 py-2 text-xs font-semibold text-accent transition-all duration-200 hover:bg-accent hover:text-steel-950 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
              <span>Download / View Full PDF ↗</span>
            </a>
          ) : (
            <a
              href={certificate.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-accent bg-accent/10 px-4 py-2 text-xs font-semibold text-accent transition-all duration-200 hover:bg-accent hover:text-steel-950 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              VIEW HIGH-RES IMAGE ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
