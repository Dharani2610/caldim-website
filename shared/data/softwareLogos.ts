export interface SoftwareLogo {
  name: string;
  src: string;
  alt: string;
  w: number;
  h: number;
}

export const softwareLogos: readonly SoftwareLogo[] = [
  { name: "Bluebeam", src: "/images/software/bluebeam.png", alt: "Bluebeam logo", w: 220, h: 57 },
  { name: "Tekla", src: "/images/software/tekla.png", alt: "Tekla Structures logo", w: 516, h: 130 },
  { name: "SDS2 by ALLPLAN", src: "/images/software/sds2.png", alt: "SDS2 by ALLPLAN logo", w: 730, h: 242 },
  { name: "AutoCAD", src: "/images/software/autocad.png", alt: "AutoCAD logo", w: 1084, h: 334 },
] as const;

export const trustStripCredentials =
  "PE-STAMPED IN ALL 50 STATES · AISC MEMBER · 150+ EMPLOYEES · 48,000+ TONS DETAILED";
