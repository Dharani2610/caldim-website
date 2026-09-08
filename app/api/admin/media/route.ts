import { desc, eq } from "drizzle-orm";
import { db, mediaAssets, newId, one } from "@/backend/db";
import { env } from "@/backend/env";
import { audit } from "@/backend/security/audit";
import { guard, jsonError, jsonOk } from "@/backend/security/guard";
import { RULES } from "@/backend/security/rateLimit";
import { UploadError, storeAdminMediaUpload } from "@/backend/security/upload";
import { optionalText } from "@/backend/security/validation";
import {
  CloudinaryNotConfigured,
  deliveryUrl,
  videoPosterUrl,
} from "@/backend/media/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Shapes a row for the admin library, including its delivery URLs. */
function present(asset: {
  id: string;
  publicId: string;
  resourceType: "image" | "video" | "raw";
  originalName: string;
  mimeType: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  altText: string;
  title: string;
  createdAt: Date;
}) {
  return {
    ...asset,
    createdAt: asset.createdAt.toISOString(),
    /** Full-size delivery, format-negotiated by Cloudinary. */
    url: deliveryUrl(asset.publicId, asset.resourceType),
    /** A small still for the grid — a frame grab for video. */
    thumbnailUrl:
      asset.resourceType === "video"
        ? videoPosterUrl(asset.publicId, 480)
        : asset.resourceType === "raw"
        ? null
        : deliveryUrl(asset.publicId, asset.resourceType, { width: 480, height: 360 }),
  };
}

export async function GET(request: Request) {
  const gate = await guard(request, { csrf: false });
  if (!gate.ok) return gate.response;

  const assets = await db
    .select({
      id: mediaAssets.id,
      publicId: mediaAssets.publicId,
      resourceType: mediaAssets.resourceType,
      originalName: mediaAssets.originalName,
      mimeType: mediaAssets.mimeType,
      byteSize: mediaAssets.byteSize,
      width: mediaAssets.width,
      height: mediaAssets.height,
      duration: mediaAssets.duration,
      altText: mediaAssets.altText,
      title: mediaAssets.title,
      createdAt: mediaAssets.createdAt,
    })
    .from(mediaAssets)
    .orderBy(desc(mediaAssets.createdAt))
    .limit(300);

  return jsonOk({ assets: assets.map(present) });
}

/**
 * Image or Document (PDF) upload.
 *
 * `storeAdminMediaUpload` does the security work — magic-byte sniffing, dimension
 * limits, Sharp re-encoding for images, and %PDF- header verification for documents.
 */
export async function POST(request: Request) {
  const gate = await guard(request, { rateLimit: RULES.upload });
  if (!gate.ok) return gate.response;

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data")) {
    return jsonError("Send the file as multipart/form-data.", 415);
  }

  // Reject an oversized body before buffering it into memory.
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > env.maxUploadBytes + 64 * 1024) {
    return jsonError(
      `Files must be ${Math.floor(env.maxUploadBytes / 1024 / 1024)}MB or smaller.`,
      413
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("That upload could not be read.", 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("Choose a file to upload.", 400);

  const altText = optionalText(200).parse(form.get("altText")?.toString() ?? "");
  const title = optionalText(160).parse(form.get("title")?.toString() ?? "");

  let stored;
  try {
    stored = await storeAdminMediaUpload(file);
  } catch (error) {
    if (error instanceof UploadError) return jsonError(error.message, 400);
    if (error instanceof CloudinaryNotConfigured) return jsonError(error.message, 503);
    console.error("[media] upload failed", error);
    return jsonError("That upload could not be processed.", 500);
  }

  const asset = await one(
    db
      .insert(mediaAssets)
      .values({
        id: newId(),
        publicId: stored.publicId,
        resourceType: stored.resourceType,
        format: stored.format,
        secureUrl: stored.secureUrl,
        originalName: stored.originalName,
        mimeType: stored.mimeType,
        byteSize: stored.byteSize,
        width: stored.width ?? null,
        height: stored.height ?? null,
        duration: null,
        checksum: stored.checksum,
        altText,
        title,
        uploadedById: gate.user.id,
        createdAt: new Date(),
      })
      .returning()
  );

  if (!asset) return jsonError("That upload could not be recorded.", 500);

  await audit({
    action: "media.uploaded",
    userId: gate.user.id,
    actorInfo: gate.user.email,
    entity: "MediaAsset",
    entityId: asset.id,
    meta: { originalName: asset.originalName, bytes: asset.byteSize, kind: asset.resourceType },
  });

  return jsonOk({ asset: present(asset) }, 201);
}

/** Updates the alt text or title of an existing asset. */
export async function PATCH(request: Request) {
  const gate = await guard(request, { rateLimit: RULES.adminWrite });
  if (!gate.ok) return gate.response;

  let payload: { id?: string; altText?: string; title?: string };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return jsonError("Send a JSON body.", 400);
  }

  if (!payload.id || !/^[a-z0-9]{28,48}$/i.test(payload.id)) {
    return jsonError("Not found.", 404);
  }

  const altText = optionalText(200).parse(payload.altText ?? "");
  const title = optionalText(160).parse(payload.title ?? "");

  const updated = await one(
    db
      .update(mediaAssets)
      .set({ altText, title })
      .where(eq(mediaAssets.id, payload.id))
      .returning()
  );

  if (!updated) return jsonError("Not found.", 404);

  await audit({
    action: "media.updated",
    userId: gate.user.id,
    actorInfo: gate.user.email,
    entity: "MediaAsset",
    entityId: updated.id,
  });

  return jsonOk({ asset: present(updated) });
}
