import { db, mediaAssets, newId, one } from "@/backend/db";
import { env } from "@/backend/env";
import { audit } from "@/backend/security/audit";
import { guard, jsonError, jsonOk } from "@/backend/security/guard";
import { RULES } from "@/backend/security/rateLimit";
import {
  UploadError,
  checkVideoHeader,
  newPublicId,
  sanitiseFilename,
  videoMimeForFormat,
} from "@/backend/security/upload";
import { optionalText } from "@/backend/security/validation";
import {
  CloudinaryNotConfigured,
  deliveryUrl,
  destroyAsset,
  signUpload,
  verifyUploaded,
  videoPosterUrl,
} from "@/backend/media/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Video upload, in two steps.
 *
 * A video is far too big to buffer through a route handler, so the bytes go
 * from the browser straight to Cloudinary. That would normally mean trusting
 * the client, which we don't, so the flow is split:
 *
 *   POST /api/admin/media/video          → validate, then issue a signature
 *   PUT  /api/admin/media/video          → confirm, by asking Cloudinary
 *
 * The signature covers the folder and public_id we chose, so the browser
 * cannot upload somewhere else, overwrite an existing asset, or change the
 * resource type. And because a client could still simply *lie* about having
 * uploaded, the confirm step never records what the browser reports — it looks
 * the asset up in Cloudinary's Admin API and stores what Cloudinary says.
 */

/** Step one: check the file's leading bytes, then sign an upload for it. */
export async function POST(request: Request) {
  const gate = await guard(request, { rateLimit: RULES.upload });
  if (!gate.ok) return gate.response;

  let payload: { header?: string; size?: number; filename?: string };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return jsonError("Send a JSON body.", 400);
  }

  const size = Number(payload.size ?? 0);
  // The browser sends the first 32 bytes, base64-encoded. That is enough to
  // read the container magic without shipping the file itself.
  const header = Buffer.from(String(payload.header ?? ""), "base64");
  if (header.byteLength < 12) {
    return jsonError("That file could not be read.", 400);
  }

  let checked: { extension: string; mimeType: string };
  try {
    checked = checkVideoHeader(header, size);
  } catch (error) {
    if (error instanceof UploadError) return jsonError(error.message, 400);
    throw error;
  }

  try {
    const signature = signUpload({ kind: "video", publicId: newPublicId() });
    return jsonOk({
      ...signature,
      maxBytes: env.maxVideoUploadBytes,
      expectedMime: checked.mimeType,
    });
  } catch (error) {
    if (error instanceof CloudinaryNotConfigured) return jsonError(error.message, 503);
    throw error;
  }
}

/** Step two: verify the upload really happened, and record it. */
export async function PUT(request: Request) {
  const gate = await guard(request, { rateLimit: RULES.upload });
  if (!gate.ok) return gate.response;

  let payload: { publicId?: string; originalName?: string; altText?: string; title?: string };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return jsonError("Send a JSON body.", 400);
  }

  const publicId = String(payload.publicId ?? "").trim();
  if (!publicId || publicId.length > 200) return jsonError("Nothing to confirm.", 400);

  let uploaded;
  try {
    // Everything recorded below comes from this call, not from the request
    // body — the client's account of its own upload is never the source of
    // truth. `verifyUploaded` also refuses any public_id outside the folder
    // the signature was scoped to.
    uploaded = await verifyUploaded(publicId, "video");
  } catch (error) {
    if (error instanceof CloudinaryNotConfigured) return jsonError(error.message, 503);
    throw error;
  }

  if (!uploaded) {
    return jsonError("That upload could not be verified. Try again.", 400);
  }

  if (uploaded.byteSize > env.maxVideoUploadBytes) {
    // It slipped past the client-side check; remove it rather than keep it.
    await destroyAsset(uploaded.publicId, "video");
    return jsonError(
      `Video must be ${Math.floor(env.maxVideoUploadBytes / 1024 / 1024)}MB or smaller.`,
      413
    );
  }

  const altText = optionalText(200).parse(payload.altText ?? "");
  const title = optionalText(160).parse(payload.title ?? "");
  const originalName = sanitiseFilename(payload.originalName ?? "video");

  const asset = await one(
    db
      .insert(mediaAssets)
      .values({
        id: newId(),
        publicId: uploaded.publicId,
        resourceType: "video",
        format: uploaded.format,
        secureUrl: uploaded.secureUrl,
        originalName,
        mimeType: videoMimeForFormat(uploaded.format),
        byteSize: uploaded.byteSize,
        width: uploaded.width ?? null,
        height: uploaded.height ?? null,
        duration: uploaded.duration ?? null,
        checksum: uploaded.checksum,
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
    meta: {
      originalName: asset.originalName,
      bytes: asset.byteSize,
      kind: "video",
      seconds: asset.duration,
    },
  });

  return jsonOk(
    {
      asset: {
        ...asset,
        createdAt: asset.createdAt.toISOString(),
        url: deliveryUrl(asset.publicId, "video"),
        thumbnailUrl: videoPosterUrl(asset.publicId, 480),
      },
    },
    201
  );
}
