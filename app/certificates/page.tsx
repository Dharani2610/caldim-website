import type { Metadata } from "next";
import Nav from "@/frontend/components/Nav";
import CertificatesPage from "@/frontend/components/sections/CertificatesPage";
import Footer from "@/frontend/components/sections/Footer";
import { getCertificates, getSiteContent } from "@/backend/content/getSiteContent";

export const metadata: Metadata = {
  title: "Reviews & Recommendations",
  description:
    "Verified structural steel detailing client recommendations, performance reviews, and engineering accreditations.",
  alternates: { canonical: "/certificates" },
  openGraph: {
    title: "Reviews & Recommendations | Caldim Engineering Services",
    description:
      "Verified structural steel detailing client recommendations, performance reviews, and engineering accreditations.",
    url: "/certificates",
  },
};

export default async function CertificatesRoute() {
  const [content, certificates] = await Promise.all([
    getSiteContent(),
    getCertificates(),
  ]);

  return (
    <>
      <Nav />
      <main id="main" className="overflow-x-hidden pt-20 md:pt-24 bg-steel-950">
        <CertificatesPage certificates={certificates} />
      </main>
      <Footer services={content.services} />
    </>
  );
}
