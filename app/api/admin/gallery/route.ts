import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { db, galleryItems, mediaAssets, newId, one } from "@/backend/db";
import { audit } from "@/backend/security/audit";
import { guard, jsonError, jsonOk } from "@/backend/security/guard";
import { RULES } from "@/backend/security/rateLimit";
import { fieldErrors, galleryItemSchema } from "@/backend/security/validation";
import { deliveryUrl, videoPosterUrl } from "@/backend/media/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Gallery placement — putting an uploaded asset somewhere on the site.
 *
 * The media library is a store; this is the arrangement. Keeping them apart
 * means one upload can appear in several places, and removing it from a page
 * doesn't delete the file.
 */

export async function GET(request: Request) {
  const gate = await guard(request, { csrf: false });
  if (!gate.ok) return gate.response;

  const rows = await db
    .select({ item: galleryItems, media: mediaAssets })
    .from(galleryItems)
    .innerJoin(mediaAssets, eq(galleryItems.mediaId, mediaAssets.id))
    .orderBy(asc(galleryItems.collection), asc(galleryItems.sortOrder));

  return jsonOk({
    items: rows.map(({ item, media }) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      media: {
        id: media.id,
        resourceType: media.resourceType,
        originalName: media.originalName,
        altText: media.altText,
        duration: media.duration,
        url: deliveryUrl(media.publicId, media.resourceType),
        thumbnailUrl:
          media.resourceType === "video"
            ? videoPosterUrl(media.publicId, 480)
            : deliveryUrl(media.publicId, media.resourceType, { width: 480, height: 360 }),
      },
    })),
  });
}

export async function POST(request: Request) {
  const gate = await guard(request, { rateLimit: RULES.adminWrite });
  if (!gate.ok) return gate.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Send a JSON body.", 400);
  }

  const parsed = galleryItemSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Check the highlighted fields.", 422, {
      fields: fieldErrors(parsed.error),
    });
  }
  const data = parsed.data;

  // The asset has to exist before it can be placed. Without this a stale admin
  // tab could publish a slot pointing at a deleted upload.
  const media = await one(
    db.select().from(mediaAssets).where(eq(mediaAssets.id, data.mediaId))
  );
  if (!media) return jsonError("That asset could not be found. Upload it again.", 400);
  if (media.resourceType === "raw" && data.collection !== "certificates") {
    return jsonError("Only photos and videos can be placed in this gallery section.", 400);
  }

  if (data.posterId) {
    const poster = await one(
      db.select().from(mediaAssets).where(eq(mediaAssets.id, data.posterId))
    );
    if (!poster || poster.resourceType !== "image") {
      return jsonError("The poster must be an uploaded photo.", 400);
    }
  }

  const nowDate = new Date();
  const item = await one(
    db
      .insert(galleryItems)
      .values({
        id: newId(),
        collection: data.collection,
        mediaId: data.mediaId,
        caption: data.caption,
        meta: data.meta,
        posterId: data.posterId || null,
        published: data.published,
        sortOrder: data.sortOrder,
        createdAt: nowDate,
        updatedAt: nowDate,
      })
      .returning()
  );

  if (!item) return jsonError("That placement could not be saved.", 500);

  await audit({
    action: "gallery.created",
    userId: gate.user.id,
    actorInfo: gate.user.email,
    entity: "GalleryItem",
    entityId: item.id,
    meta: { collection: item.collection, mediaId: item.mediaId },
  });

  revalidatePath("/");
  return jsonOk({ item }, 201);
}
