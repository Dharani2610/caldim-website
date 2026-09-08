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

  const { getMediaAssetsCollection } = await import("@/backend/db");
  const mediaCol = await getMediaAssetsCollection();
  const assets = await mediaCol
    .find({})
    .sort({ createdAt: -1 })
    .limit(300)
    .toArray();

  return jsonOk({
    assets: assets.map((a) =>
      present({
        id: a._id,
        publicId: a.publicId,
        resourceType: a.resourceType,
        originalName: a.originalName,
        mimeType: a.mimeType,
        byteSize: a.byteSize,
        width: a.width ?? null,
        height: a.height ?? null,
        duration: a.duration ?? null,
        altText: a.altText,
        title: a.title,
        createdAt: a.createdAt,
      })
    ),
  });
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

  const { getMediaAssetsCollection } = await import("@/backend/db");
  const mediaCol = await getMediaAssetsCollection();
  const assetId = newId();
  const assetDoc = {
    _id: assetId,
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
  };

  await mediaCol.insertOne(assetDoc);

  await audit({
    action: "media.uploaded",
    userId: gate.user.id,
    actorInfo: gate.user.email,
    entity: "MediaAsset",
    entityId: assetId,
    meta: { originalName: assetDoc.originalName, bytes: assetDoc.byteSize, kind: assetDoc.resourceType },
  });

  return jsonOk(
    {
      asset: present({
        ...assetDoc,
        id: assetId,
      }),
      url: `/api/media/${assetId}`,
    },
    201
  );
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

  const { getMediaAssetsCollection } = await import("@/backend/db");
  const mediaCol = await getMediaAssetsCollection();

  await mediaCol.updateOne(
    { _id: payload.id },
    { $set: { altText, title } }
  );

  const updated = await mediaCol.findOne({ _id: payload.id });
  if (!updated) return jsonError("Not found.", 404);

  await audit({
    action: "media.updated",
    userId: gate.user.id,
    actorInfo: gate.user.email,
    entity: "MediaAsset",
    entityId: updated._id,
  });

  return jsonOk({
    asset: present({
      ...updated,
      id: updated._id,
      width: updated.width ?? null,
      height: updated.height ?? null,
      duration: updated.duration ?? null,
    }),
  });
}

