import type { Metadata } from "next";
import { CsrfProvider } from "@/frontend/components/CsrfProvider";
import { getOrCreateCsrfToken } from "@/backend/security/csrf";

export const metadata: Metadata = {
  title: "Admin",
  // The admin area must never appear in a search index, and its links must not
  // leak paths through the Referer header.
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

/**
 * The admin area re-declares the CSRF provider because it is rendered by the
 * root layout's tree but reads the token independently — every admin request
 * is a mutating one, and none of them should depend on a parent having
 * remembered to pass it down.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <CsrfProvider token={getOrCreateCsrfToken()}>{children}</CsrfProvider>;
}
