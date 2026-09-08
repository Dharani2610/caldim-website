import Nav from "@/frontend/components/Nav";
import SteelIntro from "@/frontend/components/intro/SteelIntro";
import Hero from "@/frontend/components/hero/Hero";
import TrustStrip from "@/frontend/components/sections/TrustStrip";
import Services from "@/frontend/components/sections/Services";
import SignatureCapability from "@/frontend/components/sections/SignatureCapability";
import Process from "@/frontend/components/process/Process";
import Projects from "@/frontend/components/sections/Projects";
import Gallery from "@/frontend/components/sections/Gallery";
import SoftwareStandards from "@/frontend/components/sections/SoftwareStandards";
import TaglineMarquee from "@/frontend/components/sections/TaglineMarquee";
import Certifications from "@/frontend/components/sections/Certifications";
import Events from "@/frontend/components/sections/Events";
import Stats from "@/frontend/components/sections/Stats";
import WhyUs from "@/frontend/components/sections/WhyUs";
import Leadership from "@/frontend/components/sections/Leadership";
import Team from "@/frontend/components/sections/Team";
import Careers from "@/frontend/components/sections/Careers";
import Testimonials from "@/frontend/components/sections/Testimonials";
import Contact from "@/frontend/components/sections/Contact";
import Footer from "@/frontend/components/sections/Footer";
import { getGalleryItems, getSiteContent } from "@/backend/content/getSiteContent";

/**
 * The homepage is a Server Component: it reads the current content once, on
 * the server, and passes it down. Sections take their copy as props rather
 * than importing the static file directly, which is what lets the admin area
 * change the page without a redeploy — and keeps every section renderable in
 * isolation for testing.
 */
export default async function Home() {
  const [content, galleryItems] = await Promise.all([getSiteContent(), getGalleryItems()]);

  return (
    <>
      <Nav />
      <main id="main" className="overflow-x-hidden">
        <SteelIntro />
        <Hero hero={content.hero} />
        <Stats stats={content.stats} />
        <TrustStrip />
        <Services services={content.services} />
        <SignatureCapability />
        <Process />
        <Projects projects={content.projects} />
        <Gallery items={galleryItems} />
        <SoftwareStandards />
        <TaglineMarquee />
        <Certifications certifications={content.certifications} />
        <Events events={content.events} />
        <WhyUs pillars={content.pillars} />
        <Leadership leaders={content.leaders} />
        <Team />
        <Careers careers={content.careers} />
        <Testimonials testimonials={content.testimonials} />
        <Contact
          services={content.services}
          offices={content.offices}
          directContacts={content.directContacts}
        />
      </main>
      <Footer services={content.services} />
    </>);
}
