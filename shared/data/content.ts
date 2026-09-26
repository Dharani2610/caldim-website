export const services = [
  {
    id: "estimation",
    mark: "E1",
    title: "Estimation & Takeoff",
    summary:
      "Tonnage takeoffs and connection-count estimates from bid-set or IFC drawings, turned around fast enough to make your bid deadline.",
    deliverables: [
      "Material takeoffs from bid-set or IFC drawings",
      "Tonnage & connection-count estimates",
      "Budget pricing for detailing & connection design",
      "Fast turnaround to match bid deadlines",
    ],
    standard: "AISC 303",
  },
  {
    id: "structural",
    mark: "S1",
    title: "Structural Steel Detailing",
    summary:
      "Shop and erection drawings built for the field, not just for approval. Advance bills that let your shop cut before the model is even finished.",
    deliverables: [
      "Shop drawings — single & multi-piece assemblies",
      "Erection drawings & anchor bolt plans",
      "Advance bills of material for early procurement",
      "RFI tracking and turnaround inside your schedule",
    ],
    standard: "AISC 360 / AISC 303 / CISC",
  },
  {
    id: "misc",
    mark: "M1",
    title: "Miscellaneous Steel Detailing",
    summary:
      "Stairs, rails, ladders, and platforms are where most RFIs live. We detail them to walk-through accuracy on the first issue.",
    deliverables: [
      "Egress, industrial & monumental stairs",
      "Handrails, guardrails & caged/ship ladders",
      "Platforms, canopies & structural embeds",
      "NAAMM AMP 521 / OSHA 1910 / IBC compliant",
    ],
    standard: "NAAMM AMP 521 / OSHA 1910 / IBC",
  },
  {
    id: "connections",
    mark: "C1",
    title: "Connections Design with PE Stamp",
    summary:
      "Delegated connection design, calculated and stamped by licensed PEs in all 50 states — moment, shear, bracing, and base plate.",
    deliverables: [
      "Moment, shear & bracing connection design",
      "Base plate & anchorage design",
      "Full calculation packages, submittal-ready",
      "PE stamps valid in all 50 US states",
    ],
    standard: "AISC 360-22",
  },
  {
    id: "joist-deck",
    mark: "J1",
    title: "Joist & Deck Detailing",
    summary:
      "SJI-compliant joist layouts and joist girder detailing, coordinated with metal deck placement before steel ever leaves the shop.",
    deliverables: [
      "Joist layout & joist girder detailing",
      "Roof, floor & composite deck layouts",
      "Deck accessory & closure coordination",
      "SJI / SDI standard compliance",
    ],
    standard: "SJI / SDI",
  },
  {
    id: "digital-automation",
    mark: "D1",
    title: "Digital Automation Services",
    summary:
      "Custom scripts, templates, and Tekla PowerFab pipelines that take the repetitive work out of your detailing and push clean data straight into the shop.",
    deliverables: [
      "Tekla & SDS/2 custom components, macros & report templates",
      "Model-to-shop data exchange via Tekla PowerFab",
      "Automated BOM, CNC (NC/DSTV) & MIS file generation",
      "Drawing-standard setup and batch QC checking routines",
    ],
    standard: "Tekla PowerFab / API",
  },
] as const;

export const processPhases = [
  {
    step: "01",
    phase: "RFQ",
    label: "Scope & quote",
    description:
      "Send drawings, tonnage, and timeline. We return a fixed-fee quote and start date — usually within 2 business days.",
  },
  {
    step: "02",
    phase: "Model Setup",
    label: "Model built",
    description:
      "Tekla or SDS/2 model set up from IFC, DWG, or PDF contract documents, grids and levels matched to the EOR set.",
  },
  {
    step: "03",
    phase: "Detailing",
    label: "Drawings drafted",
    description:
      "Shop and erection drawings, advance bills, and connection layouts drafted against your fabricator standards.",
  },
  {
    step: "04",
    phase: "QC / Checking",
    label: "Independently checked",
    description:
      "A second detailer, not the modeler, checks every sheet against the contract documents before it leaves our shop.",
  },
  {
    step: "05",
    phase: "Connection Design & Stamp",
    label: "PE stamped",
    description:
      "Delegated connections calculated per AISC 360-22 and stamped by a licensed PE in the project's state of record.",
  },
  {
    step: "06",
    phase: "Deliverables & RFI Support",
    label: "Issued for fab",
    description:
      "Final package issued in your preferred format, with RFI turnaround support through erection.",
  },
] as const;

export const projects = [
  {
    id: "austin-mixed-use",
    type: "8-story mixed-use",
    location: "Austin, TX",
    tons: "1,240",
    drawings: "610",
    connections: "380",
    scheduleSaved: "3 weeks",
    note: "Full structural + misc detailing, connection design, and joist/deck coordination on a compressed fast-track schedule.",
  },
  {
    id: "midwest-distribution",
    type: "Distribution center, 620,000 SF",
    location: "Joliet, IL",
    tons: "2,850",
    drawings: "940",
    connections: "540",
    scheduleSaved: "5 weeks",
    note: "Long-span joist girder roof system detailed alongside base plate and bracing connection design for a single steel package.",
  },
  {
    id: "vancouver-parkade",
    type: "Precast/steel hybrid parkade",
    location: "Vancouver, BC",
    tons: "760",
    drawings: "410",
    connections: "265",
    scheduleSaved: "2 weeks",
    note: "CISC-compliant detailing with egress stair and guardrail packages carried through to erection support.",
  },
] as const;

export const software = [
  "Tekla",
  "SDS2 by ALLPLAN",
  "AutoCAD",
  "Bluebeam",
] as const;

export const standards = [
  "AISC 360",
  "AISC 303",
  "CISC",
  "NAAMM AMP 521",
  "SJI",
  "SDI",
  "OSHA 1910",
  "IBC",
] as const;

export const stats = [
  { value: 150, suffix: "+", label: "Employees" },
  { value: 48000, suffix: "+", label: "Tons detailed" },
  { value: 6200, suffix: "+", label: "Drawings issued" },
  { value: 310, suffix: "+", label: "Projects delivered" },
  { value: 1450, suffix: "+", label: "PE stamps issued" },
] as const;

export const pillars = [
  {
    title: "Accuracy",
    stat: "RFI rate < 0.8%",
    description:
      "Every sheet passes an independent check against contract documents before issue — not a self-check by the modeler.",
  },
  {
    title: "Speed",
    stat: "Avg. 8-day turnaround",
    description:
      "Fixed-fee quotes with committed dates. Advance bills issued early so your shop isn't waiting on the full package.",
  },
  {
    title: "Coverage",
    stat: "50-state PE stamping",
    description:
      "Licensed structural engineers stamp connection calcs in every US state, so multi-state projects run through one team.",
  },
  {
    title: "Communication",
    stat: "1 dedicated PM per project",
    description:
      "A dedicated project manager with 15+ years in Tekla and SDS/2 is assigned to every job — one point of contact from RFQ to RFI close-out, not a shared inbox.",
  },
] as const;

export const team = [
  {
    role: "Project Manager — Tekla & SDS/2",
    credentials: "15+ years",
    note: "Dedicated Tekla and SDS/2 PM. Every project is assigned its own PM, start to finish.",
  },
  {
    role: "Principal, Connections Design",
    credentials: "PE, SE",
    note: "20+ years stamping delegated connections across the US and Canada.",
  },
  {
    role: "Detailing Manager",
    credentials: "Tekla Certified",
    note: "Runs QC on every structural and misc. steel package before issue.",
  },
  {
    role: "Estimating Lead",
    credentials: "Tekla / SDS-2",
    note: "Owns takeoffs and budget pricing, from bid-set to fixed-fee quote.",
  },
  {
    role: "Joist & Deck Lead",
    credentials: "SJI-familiar",
    note: "Coordinates joist girder and deck layouts with steel and precast trades.",
  },
] as const;

export const testimonials = [
  {
    quote:
      "[Placeholder — fabricator quote on turnaround and RFI rate to go here.]",
    attribution: "[Name, Title — Fabricator]",
  },
  {
    quote:
      "[Placeholder — GC quote on connection design coverage across states to go here.]",
    attribution: "[Name, Title — General Contractor]",
  },
  {
    quote:
      "[Placeholder — EOR quote on calc package quality to go here.]",
    attribution: "[Name, Title — Structural EOR]",
  },
] as const;

export const certifications = [
  "NISD Certified Steel Detailer",
  "AISC 360-22 Connection Design",
  "AISC 303 — Code of Standard Practice",
  "CISC Certified Detailing",
  "ISO 9001:2015 Quality Management",
  "PE Seal — All 50 US States",
] as const;

export const careers = {
  blurb:
    "We're a detailing and connection-design team split between Hosur and Chennai, growing steadily as our client list does. If you've got Tekla, SDS/2, or PE-stamp experience, we'd like to hear from you.",
  roles: [
    "Structural Steel Detailer",
    "Connection Design Engineer (PE)",
    "Estimator / Takeoff Specialist",
    "QC / Checking Detailer",
  ],
} as const;

export const projectTypes = services.map((s) => s.title);

export const offices = [
  {
    city: "Corporate Office — Chennai",
    address:
      "Minimac Center #118, First Floor,\nArcot Road, Valasaravakkam,\nChennai – 600087, Tamil Nadu, India",
    name: "",
    phone: "248-455 3855",
    tag: "HEADQUARTERS",
    isInternational: false,
  },
  {
    city: "Registered Office — Hosur",
    address:
      "Plot No. 22, 23, 24, 2nd Floor, Durga Bhavani Towers,\nNear RTO Check Post, NH 207, Bagalur Road,\nHosur – 635103, Tamil Nadu, India",
    name: "",
    phone: "04344610637",
    tag: "BRANCH OFFICE",
    isInternational: false,
  },
  {
    city: "USA — INTERNATIONAL OFFICE",
    address:
      "8668 John Hickman Pkwy, Suite 903, Frisco, Texas 75034, USA",
    name: "Caldim Tech Services LLC",
    phone: "+1 (248) 455-3855",
    tag: "INTERNATIONAL EXTENSION",
    isInternational: true,
  },
] as const;

export const directContacts = [
  { name: "Bala", email: "bala@caldimengg.com" },
  { name: "Uvaraj", email: "uvaraj@caldimengg.com" },
  { name: "Swami", email: "swami@caldimengg.com" },
  { name: "Arun", email: "arunkumar.ponnusamy@caldimengg.com" },
] as const;
