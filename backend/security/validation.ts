import { z } from "zod";

/**
 * Every value that crosses a trust boundary is parsed by one of these schemas
 * before anything else looks at it. Parsing, not checking: the rest of the app
 * only ever sees typed, bounded, trimmed data.
 */

/** Strips control characters, normalises Unicode, trims, and bounds length. */
export const safeText = (max: number, min = 0) =>
  z
    .string()
    .transform((value) =>
      value
        .normalize("NFKC")
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u001F\u007F]/g, "")
        .trim()
    )
    .pipe(z.string().min(min).max(max));

export const optionalText = (max: number) =>
  z
    .string()
    .optional()
    .default("")
    .transform((value) =>
      (value ?? "")
        .normalize("NFKC")
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u001F\u007F]/g, "")
        .trim()
        .slice(0, max)
    );

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(5)
  .max(254)
  .email("Enter a valid email address.");

/**
 * URLs are restricted to http(s). Without this, a `javascript:` or `data:`
 * URL saved into a leader's LinkedIn field would become stored XSS the moment
 * it was rendered as an href.
 */
export const httpUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine((value) => {
    if (value === "") return true;
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }, "Enter a full https:// URL.");

export const optionalHttpUrl = z
  .string()
  .optional()
  .default("")
  .transform((value) => (value ?? "").trim())
  .pipe(httpUrlSchema);

// ─── Auth ────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password.").max(200),
  /**
   * Honeypot. Accepted as any string rather than constrained to empty, so a
   * bot that fills it reaches the handler and gets a fake success instead of
   * a validation error — an error tells the bot which field to skip next time.
   */
  website: z.string().max(200).optional().default(""),
});

export const totpChallengeSchema = z.object({
  code: z.string().trim().min(6).max(14),
  mode: z.enum(["totp", "recovery"]).default("totp"),
});

export const totpEnrolSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code."),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1).max(200),
    newPassword: z.string().min(12, "Use at least 12 characters.").max(200),
    confirmPassword: z.string().min(1).max(200),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "The two new passwords don't match.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "Choose a password you haven't used here before.",
    path: ["newPassword"],
  });

// ─── Leadership ──────────────────────────────────────────────────────────

export const leaderSchema = z.object({
  name: safeText(120, 2),
  title: safeText(140, 2),
  credentials: optionalText(80),
  bio: optionalText(1200),
  location: optionalText(120),
  email: z
    .string()
    .optional()
    .default("")
    .transform((value) => (value ?? "").trim().toLowerCase())
    .refine((value) => value === "" || z.string().email().safeParse(value).success, {
      message: "Enter a valid email address.",
    }),
  linkedinUrl: optionalHttpUrl,
  photoId: z
    .string()
    .optional()
    .default("")
    .transform((value) => (value ?? "").trim())
    .pipe(z.string().max(40)),
  published: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export const leaderReorderSchema = z.object({
  order: z.array(z.string().min(1).max(40)).max(60),
});

// ─── Gallery placement ───────────────────────────────────────────────────

/**
 * The named slots a photo or video can be placed in.
 *
 * A closed list rather than free text: `collection` is what the public
 * sections query by, so an editor typing "shop floor" instead of "shopfloor"
 * would silently publish to nowhere.
 */
export const GALLERY_COLLECTIONS = [
  "gallery",
  "projects",
  "shopfloor",
  "certificates",
] as const;
export type GalleryCollection = (typeof GALLERY_COLLECTIONS)[number];

export const galleryItemSchema = z.object({
  collection: z.enum(GALLERY_COLLECTIONS).default("gallery"),
  mediaId: z.string().min(1).max(48),
  caption: optionalText(160),
  meta: optionalText(120),
  posterId: z
    .string()
    .optional()
    .default("")
    .transform((value) => (value ?? "").trim())
    .pipe(z.string().max(48)),
  published: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export const galleryReorderSchema = z.object({
  order: z.array(z.string().min(1).max(48)).max(200),
});

// ─── Editable site content ───────────────────────────────────────────────

export const heroContentSchema = z.object({
  eyebrow: safeText(120, 1),
  headingLine1: safeText(60, 1),
  headingLine2: safeText(60),
  subheading: safeText(400, 1),
  primaryCta: safeText(40, 1),
  secondaryCta: safeText(40, 1),
});

export const serviceSchema = z.object({
  id: safeText(40, 1),
  mark: safeText(6, 1),
  title: safeText(120, 1),
  summary: safeText(600, 1),
  standard: safeText(80),
  deliverables: z.array(safeText(200, 1)).max(10),
});

export const projectSchema = z.object({
  id: safeText(60, 1),
  type: safeText(120, 1),
  location: safeText(80, 1),
  tons: safeText(20),
  drawings: safeText(20),
  connections: safeText(20),
  scheduleSaved: safeText(30),
  note: safeText(500),
});

export const statSchema = z.object({
  value: z.coerce.number().int().min(0).max(100_000_000),
  suffix: optionalText(6),
  label: safeText(60, 1),
});

export const pillarSchema = z.object({
  title: safeText(60, 1),
  stat: safeText(80),
  description: safeText(500),
});

export const testimonialSchema = z.object({
  quote: safeText(600, 1),
  attribution: safeText(140, 1),
});

export const eventSchema = z.object({
  date: safeText(40, 1),
  title: safeText(140, 1),
  location: safeText(120),
  note: safeText(400),
});

export const officeSchema = z.object({
  city: safeText(120, 1),
  address: safeText(500, 1),
});

export const directContactSchema = z.object({
  name: safeText(60, 1),
  email: emailSchema,
});

export const careersSchema = z.object({
  blurb: safeText(1000, 1),
  roles: z.array(safeText(120, 1)).max(20),
});

/**
 * The set of editable content blocks, keyed exactly as they are stored. A
 * write to any other key is rejected — the admin API can't be tricked into
 * creating arbitrary rows.
 */
export const contentBlockSchemas = {
  hero: heroContentSchema,
  services: z.array(serviceSchema).max(12),
  projects: z.array(projectSchema).max(24),
  stats: z.array(statSchema).max(8),
  pillars: z.array(pillarSchema).max(8),
  testimonials: z.array(testimonialSchema).max(12),
  events: z.array(eventSchema).max(12),
  certifications: z.array(safeText(120, 1)).max(20),
  offices: z.array(officeSchema).max(8),
  directContacts: z.array(directContactSchema).max(20),
  careers: careersSchema,
} as const;

export type ContentBlockKey = keyof typeof contentBlockSchemas;

export const CONTENT_BLOCK_KEYS = Object.keys(contentBlockSchemas) as ContentBlockKey[];

export function isContentBlockKey(value: string): value is ContentBlockKey {
  return Object.prototype.hasOwnProperty.call(contentBlockSchemas, value);
}

// ─── Public contact form ─────────────────────────────────────────────────

export const contactSchema = z.object({
  name: safeText(120, 2),
  company: safeText(160, 2),
  email: emailSchema,
  role: optionalText(120),
  projectType: optionalText(120),
  tonnage: optionalText(60),
  timeline: optionalText(200),
  message: optionalText(4000),
  /**
   * Honeypot — invisible to people, irresistible to form-filling bots. Any
   * string is accepted here so the handler, not the schema, decides what to do
   * with it; a validation error would tell the bot exactly which field to omit.
   */
  website: z.string().max(200).optional().default(""),
  /** Round-trip time. A submission faster than a human could type is a bot. */
  elapsedMs: z.coerce.number().int().min(0).max(86_400_000).optional().default(0),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type LeaderInput = z.infer<typeof leaderSchema>;
export type GalleryItemInput = z.infer<typeof galleryItemSchema>;

/** Flattens a ZodError into `{ field: message }` for form rendering. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}
