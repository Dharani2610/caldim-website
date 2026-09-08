import {
  careers,
  certifications,
  directContacts,
  offices,
  pillars,
  projects,
  services,
  stats,
  testimonials,
} from "@/shared/data/content";
import type { CertificateItemView, ContentBlocks, LeaderView } from "@/shared/content/types";

/**
 * The copy the site ships with.
 *
 * These are the fallback for every block: if the database is empty, has never
 * been seeded, or is briefly unreachable, the public site still renders the
 * full, correct page rather than a scaffold of blank sections. Editing in
 * /admin writes an override; deleting the override falls back to here.
 */

export const defaultHero: ContentBlocks["hero"] = {
  eyebrow: "STRUCTURAL STEEL DETAILING · CONNECTION DESIGN",
  headingLine1: "Steel, detailed.",
  headingLine2: "Precisely.",
  subheading:
    "Shop drawings, PE-stamped connections, and fast estimates for fabricators and EPCs who can't afford a bad RFI rate. AISC and CISC compliant, from RFQ to erection.",
  primaryCta: "Request Quote",
  secondaryCta: "View Capabilities",
};

/** Previously hard-coded inside the Events section; now editable. */
export const defaultEvents: ContentBlocks["events"] = [
  {
    date: "March 2026",
    title: "NASCC: The Steel Conference",
    location: "San Antonio, TX",
    note: "Booth visit — connection design and detailing capability walkthroughs.",
  },
  {
    date: "June 2026",
    title: "AISC Steel Day",
    location: "Regional fabricator shops, US",
    note: "Site visits with fabricator partners to review current detailing workflows.",
  },
  {
    date: "September 2026",
    title: "Detailing & BIM Coordination Webinar",
    location: "Online",
    note: "Live walkthrough of our RFQ-to-issued-for-fab process for prospective clients.",
  },
];

export const defaultContent: ContentBlocks = {
  hero: defaultHero,
  services: services.map((service) => ({
    id: service.id,
    mark: service.mark,
    title: service.title,
    summary: service.summary,
    standard: service.standard,
    deliverables: [...service.deliverables],
  })),
  projects: projects.map((project) => ({ ...project })),
  stats: stats.map((stat) => ({ ...stat })),
  pillars: pillars.map((pillar) => ({ ...pillar })),
  testimonials: testimonials.map((testimonial) => ({ ...testimonial })),
  events: defaultEvents,
  certifications: [...certifications],
  offices: offices.map((office) => ({ ...office })),
  directContacts: directContacts.map((contact) => ({ ...contact })),
  careers: { blurb: careers.blurb, roles: [...careers.roles] },
};

/**
 * The leadership team.
 *
 * Portraits were cut out of the tenth-anniversary photographs and composited
 * onto white, so the four read as one set rather than four different rooms.
 *
 * Bios, credentials, locations and contact links are deliberately blank: they
 * are facts about real people and nobody should invent them. Fill them in
 * under /admin → Leadership, where they will override everything here.
 */
export const defaultLeaders: LeaderView[] = [
  {
    id: "leader-swaminathan",
    name: "Swaminathan",
    title: "Chief Technical Adviser",
    credentials: "",
    bio: "",
    location: "",
    email: null,
    linkedinUrl: null,
    photoUrl: "/images/leadership/swaminathan.jpg",
    photoAlt: "Swaminathan, Chief Technical Adviser at Caldim Engineering Services",
    initials: "S",
  },
  {
    id: "leader-bala",
    name: "Bala",
    title: "Director",
    credentials: "",
    bio: "",
    location: "",
    email: null,
    linkedinUrl: null,
    photoUrl: "/images/leadership/bala.jpg",
    photoAlt: "Bala, Director at Caldim Engineering Services",
    initials: "B",
  },
  {
    id: "leader-uvaraj",
    name: "Uvaraj",
    title: "President",
    credentials: "",
    bio: "",
    location: "",
    email: null,
    linkedinUrl: null,
    photoUrl: "/images/leadership/uvaraj.jpg",
    photoAlt: "Uvaraj, President at Caldim Engineering Services",
    initials: "U",
  },
  {
    id: "leader-arun",
    name: "Arun",
    title: "General Manager",
    credentials: "",
    bio: "",
    location: "",
    email: null,
    linkedinUrl: null,
    photoUrl: "/images/leadership/arun.jpg",
    photoAlt: "Arun, General Manager at Caldim Engineering Services",
    initials: "A",
  },
];

/** Derives display initials from a name, e.g. "Bala Subramanian" → "BS". */
export function initialsFrom(name: string): string {
  const parts = name
    .replace(/[[\]]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Shipped certificate and document defaults used until an editor uploads or curates slots in /admin.
 */
export const defaultCertificates: CertificateItemView[] = [
  {
    id: "cert-sfe-recommendation-img",
    kind: "image",
    category: "recommendation",
    caption: "Steel Fab Enterprises Letter of Recommendation",
    meta: "Steel Fab Enterprises, LLC · AISC Fabricator & Erector",
    alt: "Steel Fab Enterprises Letter of Recommendation for Caldim Engineering",
    format: "webp",
    width: 1236,
    height: 1600,
    url: "/certificates/SFE Letter of Recommendation - CALDIM 3-28-22.webp",
    thumbnailUrl: "/certificates/thumbnails/SFE Letter of Recommendation - CALDIM 3-28-22.webp",
  },
  {
    id: "cert-ironfs-recommendation-img",
    kind: "image",
    category: "recommendation",
    caption: "Iron Fabrication Services Recommendation",
    meta: "Iron Fabrication Services, Inc.",
    alt: "Iron Fabrication Services Recommendation Letter for Caldim Engineering",
    format: "webp",
    width: 1236,
    height: 1600,
    url: "/certificates/IRONFS -recommendation letter.webp",
    thumbnailUrl: "/certificates/thumbnails/IRONFS -recommendation letter.webp",
  },
  {
    id: "cert-builders-steel-endorsement",
    kind: "image",
    category: "recommendation",
    caption: "Builder's Steel Letter of Recommendation",
    meta: "Builder's Steel Co.",
    alt: "Builder's Steel Letter of Recommendation for Caldim Engineering",
    format: "webp",
    width: 1236,
    height: 1600,
    url: "/certificates/BUILDERS STEEL letter of recommendation.webp",
    thumbnailUrl: "/certificates/thumbnails/BUILDERS STEEL letter of recommendation.webp",
  },
];

