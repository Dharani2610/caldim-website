import type { z } from "zod";
import type { contentBlockSchemas } from "@/backend/security/validation";

/**
 * The shape of every editable block, derived from the Zod schemas rather than
 * declared twice. If a schema changes, the type changes with it and anything
 * that reads the old shape stops compiling.
 */
export type ContentBlocks = {
  [K in keyof typeof contentBlockSchemas]: z.infer<(typeof contentBlockSchemas)[K]>;
};

export type HeroContent = ContentBlocks["hero"];
export type ServiceContent = ContentBlocks["services"][number];
export type ProjectContent = ContentBlocks["projects"][number];
export type StatContent = ContentBlocks["stats"][number];
export type PillarContent = ContentBlocks["pillars"][number];
export type TestimonialContent = ContentBlocks["testimonials"][number];
export type EventContent = ContentBlocks["events"][number];
export type OfficeContent = ContentBlocks["offices"][number];
export type DirectContact = ContentBlocks["directContacts"][number];
export type CareersContent = ContentBlocks["careers"];

/** A leadership entry as the public site consumes it. */
export interface LeaderView {
  id: string;
  name: string;
  title: string;
  credentials: string;
  bio: string;
  location: string;
  email: string | null;
  linkedinUrl: string | null;
  /** Route to the stored image, or null when only initials are available. */
  photoUrl: string | null;
  photoAlt: string;
  initials: string;
}

export interface SiteContent extends ContentBlocks {
  leaders: LeaderView[];
  certificates?: CertificateItemView[];
}

/** A photo or video an editor has placed in a slot on the public site. */
export interface GalleryItemView {
  id: string;
  kind: "image" | "video";
  caption: string;
  meta: string;
  alt: string;
  width: number | null;
  height: number | null;
  url: string;
  /** Poster frame for a video; null for a still. */
  posterUrl: string | null;
}

/** A certificate or accreditation document/image shown on /certificates. */
export interface CertificateItemView {
  id: string;
  kind: "image" | "raw" | "video";
  category?: "certification" | "recommendation";
  caption: string;
  meta: string;
  alt: string;
  format: string;
  width: number | null;
  height: number | null;
  url: string;
  thumbnailUrl: string | null;
}

