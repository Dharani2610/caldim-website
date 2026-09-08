import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, galleryItems, mediaAssets, one } from "@/backend/db";
import { audit } from "@/backend/security/audit";
import { guard, jsonError, jsonOk } from "@/backend/security/guard";
import { RULES } from "@/backend/security/rateLimit";
import { fieldErrors, galleryItemSchema } from "@/backend/security/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const gate = await guard(request, { rateLimit: RULES.adminWrite });
  if (!gate.ok) return gate.response;

  if (!/^[a-z0-9]{28,48}$/i.test(params.id)) return jsonError("Not found.", 404);

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

  const media = await one(
    db.select().from(mediaAssets).where(eq(mediaAssets.id, data.mediaId))
  );
  if (!media || media.resourceType === "raw") {
    return jsonError("That asset could not be found.", 400);
  }

  const item = await one(
    db
      .update(galleryItems)
      .set({
        collection: data.collection,
        mediaId: data.mediaId,
        caption: data.caption,
        meta: data.meta,
        posterId: data.posterId || null,
        published: data.published,
        sortOrder: data.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(galleryItems.id, params.id))
      .returning()
  );

  if (!item) return jsonError("Not found.", 404);

  await audit({
    action: "gallery.updated",
    userId: gate.user.id,
    actorInfo: gate.user.email,
    entity: "GalleryItem",
    entityId: item.id,
    meta: { collection: item.collection },
  });

  revalidatePath("/");
  return jsonOk({ item });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const gate = await guard(request, { rateLimit: RULES.adminWrite });
  if (!gate.ok) return gate.response;

  if (!/^[a-z0-9]{28,48}$/i.test(params.id)) return jsonError("Not found.", 404);

  // Removing a placement never touches the asset itself — the upload stays in
  // the library, ready to be used somewhere else.
  const removed = await one(
    db.delete(galleryItems).where(eq(galleryItems.id, params.id)).returning()
  );
  if (!removed) return jsonError("Not found.", 404);

  await audit({
    action: "gallery.deleted",
    userId: gate.user.id,
    actorInfo: gate.user.email,
    entity: "GalleryItem",
    entityId: params.id,
    meta: { collection: removed.collection },
  });

  revalidatePath("/");
  return jsonOk({ deleted: params.id });
}
