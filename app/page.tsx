import Nav from "@/frontend/components/Nav";
import SteelIntro from "@/frontend/components/intro/SteelIntro";
import Hero from "@/frontend/components/hero/Hero";
import TrustStrip from "@/frontend/components/sections/TrustStrip";
import Services from "@/frontend/components/sections/Services";
import SignatureCapability from "@/frontend/components/sections/SignatureCapability";
import Process from "@/frontend/components/process/Process";
import Projects from "@/frontend/components/sections/Projects";
import SoftwareStandards from "@/frontend/components/sections/SoftwareStandards";
import TaglineMarquee from "@/frontend/components/sections/TaglineMarquee";
import Certifications from "@/frontend/components/sections/Certifications";
import Stats from "@/frontend/components/sections/Stats";
import WhyUs from "@/frontend/components/sections/WhyUs";
import Leadership from "@/frontend/components/sections/Leadership";
import Team from "@/frontend/components/sections/Team";
import Careers from "@/frontend/components/sections/Careers";
import Testimonials from "@/frontend/components/sections/Testimonials";
import Contact from "@/frontend/components/sections/Contact";
import EngineeredAcrossBorders from "@/frontend/components/sections/EngineeredAcrossBorders";
import Footer from "@/frontend/components/sections/Footer";
import { getSiteContent } from "@/backend/content/getSiteContent";

/**
 * The homepage is a Server Component: it reads the current content once, on
 * the server, and passes it down. Sections take their copy as props rather
 * than importing the static file directly, which is what lets the admin area
 * change the page without a redeploy — and keeps every section renderable in
 * isolation for testing.
 */
export default async function Home() {
  const content = await getSiteContent();

  return (
    <>
      <Nav />
      <main
        id="main"
        className="min-h-screen overflow-x-hidden"
      >
        <SteelIntro />
        <Hero hero={content.hero} />
        <Stats stats={content.stats} />
        <TrustStrip />
        <Services services={content.services} />
        <SignatureCapability />
        <Process />
        <Projects projects={content.projects} />

        {/* Shared fixed-background container for TaglineMarquee, Certifications, and WhyUs */}
        <div className="relative overflow-hidden border-y border-blueprint">
          <div
            className="pointer-events-none absolute inset-0 bg-fixed bg-center bg-no-repeat opacity-[0.06] [html.light_&]:opacity-[0.07] [html:not(.light)_&]:brightness-110"
            style={{
              backgroundImage: "url('/images/caldim-ogo.png')",
              backgroundSize: "min(640px, 52vw)",
            }}
            aria-hidden="true"
          />
          <div className="relative z-10">
            <SoftwareStandards />
            <TaglineMarquee />
            <Certifications certifications={content.certifications} />
            <WhyUs pillars={content.pillars} />
          </div>
        </div>
        <Leadership leaders={content.leaders} />
        <Team />
        <Careers careers={content.careers} />
        <Testimonials testimonials={content.testimonials} />
        <Contact
          services={content.services}
          offices={content.offices}
          directContacts={content.directContacts}
        />
        <EngineeredAcrossBorders />
      </main>
      <Footer services={content.services} />
    </>
  );
}
