import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { headers } from "next/headers";
import Script from "next/script";
import "./globals.css";
import Cursor from "@/frontend/components/Cursor";
import SmoothScroll from "@/frontend/components/SmoothScroll";
import { CsrfProvider } from "@/frontend/components/CsrfProvider";
import { getOrCreateCsrfToken } from "@/backend/security/csrf";
import { env } from "@/backend/env";

/**
 * Fonts are self-hosted rather than fetched from Google Fonts.
 *
 * Three reasons, in order of importance: the Content-Security-Policy can drop
 * `fonts.googleapis.com` and `fonts.gstatic.com` entirely (`font-src 'self'`),
 * so there is one fewer third party in the critical path and no request that
 * leaks a visitor's IP to another company; the build no longer fails when that
 * host is unreachable; and the files are served from the same connection as
 * the rest of the page, which removes a DNS lookup and a TLS handshake before
 * the first paint.
 */
const archivo = localFont({
  src: [
    { path: "./fonts/archivo/archivo-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/archivo/archivo-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/archivo/archivo-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./fonts/archivo/archivo-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "./fonts/archivo/archivo-latin-800-normal.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-space-grotesk",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
  // Trimmed so the fallback occupies almost the same space as the real face,
  // which removes the layout shift when the webfont lands.
  adjustFontFallback: "Arial",
});

const jetbrainsMono = localFont({
  src: [
    { path: "./fonts/jetbrains/jetbrains-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/jetbrains/jetbrains-mono-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/jetbrains/jetbrains-mono-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./fonts/jetbrains/jetbrains-mono-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-jetbrains-mono",
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

const SITE_URL = env.siteUrl || "https://www.caldimengg.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Caldim Engineering Services | Structural Steel Detailing & Connection Design",
    template: "%s | Caldim Engineering Services",
  },
  description:
    "AISC/CISC-compliant structural and miscellaneous steel detailing, PE-stamped connection design in all 50 states, joist & deck detailing, and cost estimation for US and Canadian fabricators, EPCs, and GCs.",
  keywords: [
    "structural steel detailing services",
    "steel detailing outsourcing",
    "connection design PE stamp",
    "Tekla Structures detailing",
    "miscellaneous steel detailing",
    "joist and deck detailing",
    "AISC 360 connection design",
    "Tekla PowerFab",
    "steel detailing automation services",
  ],
  authors: [{ name: "Caldim Engineering Pvt Ltd" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Caldim Engineering Services",
    title: "Caldim Engineering Services | Steel, Detailed.",
    description:
      "Structural steel detailing, connections design with PE stamp, joist & deck detailing, and cost estimation — precisely.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Caldim Engineering Services" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Caldim Engineering Services | Steel, Detailed.",
    description:
      "AISC/CISC-compliant steel detailing and PE-stamped connection design for fabricators, EPCs, and GCs.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0B0F14" },
    { media: "(prefers-color-scheme: light)", color: "#F6F8FA" },
  ],
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
};

const services = [
  "Estimation & Takeoff",
  "Structural Steel Detailing",
  "Miscellaneous Steel Detailing",
  "Connections Design with PE Stamp",
  "Joist & Deck Detailing",
  "Digital Automation Services",
];

function JsonLd({ nonce }: { nonce?: string }) {
  const organisation = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Caldim Engineering Pvt Ltd",
    url: SITE_URL,
    logo: `${SITE_URL}/images/caldim-logo.png`,
    description:
      "Structural and miscellaneous steel detailing, PE-stamped connection design, joist & deck detailing, and estimation services for US and Canadian steel fabricators.",
    areaServed: ["US", "CA"],
    knowsAbout: ["AISC 360", "AISC 303", "CISC", "NAAMM AMP 521", "SJI", "SDI", "OSHA 1910", "IBC"],
    address: [
      {
        "@type": "PostalAddress",
        streetAddress: "Plot No. 22, 23, 24, 2nd Floor, Durga Bhavani Towers, NH 207, Bagalur Road",
        addressLocality: "Hosur",
        addressRegion: "Tamil Nadu",
        postalCode: "635103",
        addressCountry: "IN",
      },
      {
        "@type": "PostalAddress",
        streetAddress: "Minmac Center #118, First Floor, Arcot Road, Valasaravalakkam",
        addressLocality: "Chennai",
        addressRegion: "Tamil Nadu",
        postalCode: "600087",
        addressCountry: "IN",
      },
    ],
  };

  const serviceSchemas = services.map((name) => ({
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: name,
    provider: { "@type": "Organization", name: "Caldim Engineering Pvt Ltd" },
    areaServed: ["US", "CA"],
  }));

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organisation) }}
      />
      {serviceSchemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // The nonce is minted per request in middleware and echoed here, so the CSP
  // can allow exactly the scripts this page emitted without 'unsafe-inline'.
  const nonce = headers().get("x-nonce") ?? undefined;
  const csrfToken = getOrCreateCsrfToken();

  return (
    <html lang="en" className={`${archivo.variable} ${jetbrainsMono.variable}`}>
      <body>
        {/* Applies the stored theme before first paint, so there is no flash
            of the wrong colour scheme. It has to be inline and blocking to do
            that job — hence the nonce rather than an external file. */}
        <Script id="theme-init" strategy="beforeInteractive" nonce={nonce}>
          {`
            (function () {
              try {
                var stored = localStorage.getItem("caldim-theme");
                var theme = stored || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
                if (theme === "light") document.documentElement.classList.add("light");
              } catch (e) {}
            })();
          `}
        </Script>

        <JsonLd nonce={nonce} />

        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-accent focus:px-4 focus:py-2 focus:text-steel-950"
        >
          Skip to content
        </a>

        <CsrfProvider token={csrfToken}>
          <Cursor />
          <SmoothScroll>{children}</SmoothScroll>
        </CsrfProvider>
      </body>
    </html>
  );
}
