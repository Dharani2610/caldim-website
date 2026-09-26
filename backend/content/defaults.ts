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

export const defaultEvents: ContentBlocks["events"] = [];

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
    name: "R. Swami",
    title: "Chief Technical Adviser",
    credentials: "",
    bio: "",
    education: "Diploma in Ship Building Technology",
    experience: "~50 years across multiple industries",
    highlights: [
      "NISD Certified Detailer Class II",
      "17 years as GM at H&R Steel Detailing (retired 2017)",
      "Expertise in shipbuilding, offshore, power, mining",
      "Extensive US industrial and commercial project experience",
    ],
    location: "",
    email: null,
    linkedinUrl: null,
    photoUrl: "/images/leadership/swaminathan.jpg",
    photoAlt: "R. Swami, Chief Technical Adviser at Caldim Engineering Services",
    initials: "RS",
  },
  {
    id: "leader-bala",
    name: "G. Bala",
    title: "Director",
    credentials: "",
    bio: "",
    education: "Mechanical Engineering",
    experience: "22+ years in American Steel Detailing (AISC)",
    highlights: [
      "NISD Certified Steel Detailer",
      "Experience with TRC Engineering, PETROFAC, Black Stone Group Tech",
      "On-site experience in Tennessee, USA",
      "International experience in Saudi Arabia",
    ],
    location: "",
    email: null,
    linkedinUrl: null,
    photoUrl: "/images/leadership/Bala.jpeg",
    photoAlt: "G. Bala, Director at Caldim Engineering Services",
    initials: "GB",
  },
  {
    id: "leader-uvaraj",
    name: "K. Uvaraj",
    title: "President",
    credentials: "",
    bio: "",
    education: "Civil Engineering",
    experience: "23+ years in steel detailing",
    highlights: [
      "H&R Steel Detailing veteran",
      "TRC Engineering experience",
      "Black Stone Group Tech, Team Detailing Services",
      "Expert in complex structural projects",
    ],
    location: "",
    email: null,
    linkedinUrl: null,
    photoUrl: "/images/leadership/Uvaraj.jpeg",
    photoAlt: "K. Uvaraj, President at Caldim Engineering Services",
    initials: "KU",
  },
  {
    id: "leader-arun",
    name: "Arun",
    title: "General Manager",
    credentials: "",
    bio: "",
    education: "M.Tech Manufacturing Engineering (BITS Pilani), B.E. Production (PSG College of Technology)",
    experience: "16+ years across automotive and engineering industries",
    highlights: [
      "Previously Program Manager at Mahindra & Mahindra Farm Division",
      "Sourcing and NPD Manager at Ashok Leyland",
      "Expertise in manufacturing, operations, and business development",
      "Strong background in new product development and sourcing",
    ],
    location: "",
    email: null,
    linkedinUrl: null,
    photoUrl: "/images/leadership/Arun.jpeg",
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

