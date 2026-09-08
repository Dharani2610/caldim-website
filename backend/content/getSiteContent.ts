import "server-only";
import { cache } from "react";
import { and, asc, eq } from "drizzle-orm";
import {
  DatabaseNotConfigured,
  db,
  contentBlocks,
  galleryItems,
  leaders,
  mediaAssets,
} from "@/backend/db";
import { deliveryUrl, videoPosterUrl } from "@/backend/media/cloudinary";
import {
  defaultCertificates,
  defaultContent,
  defaultLeaders,
  initialsFrom,
} from "@/backend/content/defaults";
import type {
  CertificateItemView,
  ContentBlocks,
  GalleryItemView,
  LeaderView,
  SiteContent,
} from "@/shared/content/types";
import { contentBlockSchemas, isContentBlockKey } from "@/backend/security/validation";

/**
 * Reads the site's content: whatever /admin has saved, layered over the
 * shipped defaults.
 *
 * Two properties matter here. First, every stored value is re-validated on the
 * way *out*, not only on the way in — so a row edited directly in the database,
 * or written by an older version of the schema, can never inject an unexpected
 * shape into a component. Second, any failure falls back to the default block
 * rather than throwing: a bad row degrades one section, it doesn't take the
 * homepage down.
 */

/**
 * Reports a read failure once per process, not once per request.
 *
 * "No DATABASE_URL yet" is a setup step, not a crash: the site is rendering
 * perfectly well from its shipped content. Printing a stack trace for it on
 * every page load buries the one line that actually tells you what to do.
 */
const reported = new Set<string>();

function reportUnavailable(area: string, error: unknown) {
  if (error instanceof DatabaseNotConfigured) {
    if (reported.has("unconfigured")) return;
    reported.add("unconfigured");
    console.warn(
      `\n  [content] No database configured — serving the shipped content.\n` +
        `            ${error.message}\n`
    );
    return;
  }
  if (reported.has(area)) return;
  reported.add(area);
  console.error(`[content] ${area} unavailable — using defaults`, error);
}

/** React's per-request cache — one query per render, not one per section. */
export const getContentBlocks = cache(async (): Promise<ContentBlocks> => {
  const merged: ContentBlocks = structuredClone(defaultContent);

  try {
    const { getContentBlocksCollection, isDatabaseConfigured } = await import("@/backend/db");
    if (!isDatabaseConfigured()) return merged;
    const contentCol = await getContentBlocksCollection();
    const rows = await contentCol.find({}).toArray();

    for (const row of rows) {
      if (!isContentBlockKey(row._id)) continue;
      const parsed = contentBlockSchemas[row._id].safeParse(row.value);
      if (parsed.success) {
        (merged as Record<string, unknown>)[row._id] = parsed.data;
      } else {
        console.warn(`[content] stored block "${row._id}" failed validation — using default`);
      }
    }
  } catch (error) {
    reportUnavailable("content blocks", error);
  }

  return merged;
});


export const getLeaders = cache(async (): Promise<LeaderView[]> => {
  try {
    const { getLeadersCollection, getMediaAssetsCollection, isDatabaseConfigured } =
      await import("@/backend/db");
    if (!isDatabaseConfigured()) return defaultLeaders;
    const leadersCol = await getLeadersCollection();
    const mediaCol = await getMediaAssetsCollection();
    const rows = await leadersCol
      .find({ published: true })
      .sort({ sortOrder: 1, createdAt: 1 })
      .toArray();

    if (rows.length === 0) return defaultLeaders;

    const photoIds = rows.map((r) => r.photoId).filter((id): id is string => Boolean(id));
    const photos =
      photoIds.length > 0 ? await mediaCol.find({ _id: { $in: photoIds } }).toArray() : [];
    const photoMap = new Map(photos.map((p) => [p._id, p]));

    return rows.map((leader) => {
      const photo = leader.photoId ? photoMap.get(leader.photoId) : null;
      return {
        id: leader._id,
        name: leader.name,
        title: leader.title,
        credentials: leader.credentials,
        bio: leader.bio,
        location: leader.location,
        email: leader.email || null,
        linkedinUrl: leader.linkedinUrl || null,
        photoUrl: photo
          ? deliveryUrl(photo.publicId, photo.resourceType, { width: 640, height: 640 })
          : null,
        photoAlt: photo?.altText || `${leader.name}, ${leader.title}`,
        initials: leader.initials || initialsFrom(leader.name),
      };
    });
  } catch (error) {
    reportUnavailable("leadership", error);
    return defaultLeaders;
  }
});


export const getSiteContent = cache(async (): Promise<SiteContent> => {
  const [blocks, leaders, certificates] = await Promise.all([
    getContentBlocks(),
    getLeaders(),
    getCertificates(),
  ]);
  return { ...blocks, leaders, certificates };
});

/**
 * Media an editor has placed in a named slot.
 *
 * Like `getLeaders`, an empty result is not an error: the section falls back to
 * the artwork that ships with the site, so a fresh install looks finished
 * rather than broken, and a database outage degrades one section instead of
 * taking the page down.
 */
export const getGalleryItems = cache(
  async (collection = "gallery"): Promise<GalleryItemView[]> => {
    try {
      const rows = await db
        .select({ item: galleryItems, media: mediaAssets })
        .from(galleryItems)
        .innerJoin(mediaAssets, eq(galleryItems.mediaId, mediaAssets.id))
        .where(
          and(eq(galleryItems.collection, collection), eq(galleryItems.published, true))
        )
        .orderBy(asc(galleryItems.sortOrder), asc(galleryItems.createdAt));

      return rows.map(({ item, media }) => ({
        id: item.id,
        kind: media.resourceType === "video" ? "video" : "image",
        caption: item.caption,
        meta: item.meta,
        alt: media.altText || item.caption || media.originalName,
        width: media.width,
        height: media.height,
        url: deliveryUrl(media.publicId, media.resourceType, { width: 1600 }),
        // Every video gets a poster: without one the browser shows a blank
        // rectangle until the first frame decodes.
        posterUrl:
          media.resourceType === "video" ? videoPosterUrl(media.publicId, 1280) : null,
      }));
    } catch (error) {
      reportUnavailable("gallery", error);
      return [];
    }
  }
);

/**
 * Certificates and accreditation documents/images placed by editors.
 *
 * Degrades gracefully to an empty array with no database or credentials,
 * allowing the public certificates page to display a clean placeholder/empty state.
 */
export const getCertificates = cache(
  async (): Promise<CertificateItemView[]> => {
    try {
      const rows = await db
        .select({ item: galleryItems, media: mediaAssets })
        .from(galleryItems)
        .innerJoin(mediaAssets, eq(galleryItems.mediaId, mediaAssets.id))
        .where(
          and(eq(galleryItems.collection, "certificates"), eq(galleryItems.published, true))
        )
        .orderBy(asc(galleryItems.sortOrder), asc(galleryItems.createdAt));

      if (rows.length === 0) return defaultCertificates;

      return rows.map(({ item, media }) => ({
        id: item.id,
        kind: media.resourceType,
        caption: item.caption,
        meta: item.meta,
        alt: media.altText || item.caption || media.originalName,
        format: media.format,
        width: media.width,
        height: media.height,
        url:
          media.resourceType === "raw"
            ? media.secureUrl || deliveryUrl(media.publicId, "raw")
            : deliveryUrl(media.publicId, media.resourceType, { width: 1600 }),
        thumbnailUrl:
          media.resourceType === "image"
            ? deliveryUrl(media.publicId, "image", { width: 800, height: 600, crop: "fit" })
            : null,
      }));
    } catch (error) {
      reportUnavailable("certificates", error);
      return defaultCertificates;
    }
  }
);
