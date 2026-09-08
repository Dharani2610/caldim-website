import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, galleryItems, leaders, mediaAssets, one } from "@/backend/db";
import { audit } from "@/backend/security/audit";
import { guard, jsonError, jsonOk } from "@/backend/security/guard";
import { RULES } from "@/backend/security/rateLimit";
import { destroyAsset } from "@/backend/media/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const gate = await guard(request, { rateLimit: RULES.adminWrite });
  if (!gate.ok) return gate.response;

  if (!/^[a-z0-9]{28,48}$/i.test(params.id)) return jsonError("Not found.", 404);

  const asset = await one(db.select().from(mediaAssets).where(eq(mediaAssets.id, params.id)));
  if (!asset) return jsonError("Not found.", 404);

  const inUse = await db
    .select({ id: leaders.id, name: leaders.name })
    .from(leaders)
    .where(eq(leaders.photoId, params.id));

  if (inUse.length > 0) {
    return jsonError(
      `That photo is still used by ${inUse.map((l) => l.name).join(", ")}. Replace it there first.`,
      409
    );
  }

  const placed = await db
    .select({ id: galleryItems.id, collection: galleryItems.collection })
    .from(galleryItems)
    .where(eq(galleryItems.mediaId, params.id));

  if (placed.length > 0) {
    const slots = Array.from(new Set(placed.map((item) => item.collection))).join(", ");
    return jsonError(`That asset is still placed in ${slots}. Remove it there first.`, 409);
  }

  // Delete the row first: an orphan left in Cloudinary is harmless and
  // sweepable, whereas a row pointing at an asset that no longer exists
  // renders as a broken image on the live site.
  await db.delete(mediaAssets).where(eq(mediaAssets.id, params.id));
  await destroyAsset(asset.publicId, asset.resourceType);

  await audit({
    action: "media.deleted",
    userId: gate.user.id,
    actorInfo: gate.user.email,
    entity: "MediaAsset",
    entityId: params.id,
    meta: { originalName: asset.originalName },
  });

  revalidatePath("/");
  return jsonOk({ deleted: params.id });
}
