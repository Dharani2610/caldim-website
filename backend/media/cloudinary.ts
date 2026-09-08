import "server-only";
import { createHash } from "node:crypto";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { env } from "@/backend/env";

/**
 * Cloudinary — the single place that talks to the asset host.
 *
 * Nothing else in the app builds a Cloudinary URL, signs a request, or knows
 * the API secret. That matters because the secret is what authorises uploads
 * and deletes: it is read here, from the server environment, and never
 * reaches a client bundle or a response body.
 */

let configured = false;

/** Throws if Cloudinary credentials are missing, rather than failing later
 *  inside the SDK with a less useful message. */
export function cloudinaryClient() {
  if (!env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
    throw new CloudinaryNotConfigured(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY " +
        "and CLOUDINARY_API_SECRET (Cloudinary console → Settings → API Keys).");
  }
  if (!configured) {
    cloudinary.config({
      cloud_name: env.cloudinaryCloudName,
      api_key: env.cloudinaryApiKey,
      api_secret: env.cloudinaryApiSecret,
      secure: true,
    });
    configured = true;
  }
  return cloudinary;
}

export class CloudinaryNotConfigured extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CloudinaryNotConfigured";
  }
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret);
}

export type CloudinaryKind = "image" | "video" | "raw";

/** The folder an asset of each kind is filed under. */
export function folderFor(kind: CloudinaryKind): string {
  const base = env.cloudinaryFolder || "caldim";
  return kind === "video" ? `${base}/video` : kind === "raw" ? `${base}/files` : `${base}/images`;
}

export interface UploadedAsset {
  publicId: string;
  resourceType: CloudinaryKind;
  format: string;
  secureUrl: string;
  byteSize: number;
  width?: number;
  height?: number;
  duration?: number;
  checksum: string;
}

/**
 * Uploads bytes we already hold and have already validated.
 *
 * Used for images (which we re-encode first, see lib/security/upload.ts) and
 * for RFQ attachments. Video does not come through here — it is far too large
 * to buffer through a route handler, and uses the signed direct upload below.
 */
export function uploadBuffer(
  bytes: Buffer,
  {
    kind,
    publicId,
    filename,
  }: { kind: CloudinaryKind; publicId: string; filename?: string }
): Promise<UploadedAsset> {
  const client = cloudinaryClient();

  return new Promise((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      {
        resource_type: kind,
        folder: folderFor(kind),
        public_id: publicId,
        // We name every asset ourselves, so Cloudinary must not derive one
        // from the (untrusted) filename.
        use_filename: false,
        unique_filename: false,
        overwrite: false,
        // Strip any remaining metadata at rest as well as on delivery.
        invalidate: true,
        context: filename ? { original_filename: filename.slice(0, 200) } : undefined,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary returned no result."));
          return;
        }
        resolve(describe(result, bytes));
      });
    stream.end(bytes);
  });
}

function describe(result: UploadApiResponse, bytes?: Buffer): UploadedAsset {
  return {
    publicId: result.public_id,
    resourceType: (result.resource_type as CloudinaryKind) ?? "image",
    format: result.format ?? "",
    secureUrl: result.secure_url,
    byteSize: result.bytes ?? bytes?.byteLength ?? 0,
    width: result.width ?? undefined,
    height: result.height ?? undefined,
    duration: typeof result.duration === "number" ? result.duration : undefined,
    checksum: bytes
      ? createHash("sha256").update(bytes).digest("hex")
      : // Cloudinary's etag is an MD5 of the stored bytes. For direct uploads
        // we never see the bytes, so this is the only integrity value we can
        // record — it is a dedupe key, not a security control.
        `etag:${result.etag ?? ""}`,
  };
}

/**
 * Signs a browser-to-Cloudinary upload.
 *
 * The signature covers exactly the parameters the browser is allowed to send —
 * folder, public_id, timestamp — so a client cannot redirect the upload to a
 * different folder, overwrite an existing asset, or change the resource type.
 * It expires with Cloudinary's own one-hour timestamp window.
 *
 * The secret itself is used only to compute the digest and never leaves the
 * server; the API *key* that goes back to the browser is public by design.
 */
export function signUpload({
  kind,
  publicId,
}: {
  kind: CloudinaryKind;
  publicId: string;
}): {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  publicId: string;
  endpoint: string;
} {
  const client = cloudinaryClient();
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = folderFor(kind);

  const signature = client.utils.api_sign_request(
    { folder, public_id: publicId, timestamp },
    env.cloudinaryApiSecret);

  return {
    cloudName: env.cloudinaryCloudName,
    apiKey: env.cloudinaryApiKey,
    timestamp,
    signature,
    folder,
    publicId,
    endpoint: `https://api.cloudinary.com/v1_1/${env.cloudinaryCloudName}/${kind}/upload`,
  };
}

/**
 * Confirms a direct upload actually happened, by asking Cloudinary.
 *
 * This is the reason a client's report of a successful upload is never
 * trusted: without it, anyone holding a session could POST an arbitrary
 * public_id and have the site render an asset they do not own. We look the
 * asset up ourselves and record only what Cloudinary tells us — size, format,
 * dimensions, duration — discarding whatever the browser claimed.
 */
export async function verifyUploaded(
  publicId: string,
  kind: CloudinaryKind
): Promise<UploadedAsset | null> {
  const client = cloudinaryClient();

  // Refuse anything that isn't in the folder we signed for, before spending
  // an API call on it.
  if (!publicId.startsWith(`${folderFor(kind)}/`)) return null;

  try {
    const resource = await client.api.resource(publicId, { resource_type: kind });
    return describe(resource as UploadApiResponse);
  } catch {
    return null;
  }
}

/** Removes an asset. A missing asset is not an error. */
export async function destroyAsset(publicId: string, kind: CloudinaryKind): Promise<void> {
  try {
    await cloudinaryClient().uploader.destroy(publicId, {
      resource_type: kind,
      invalidate: true,
    });
  } catch (error) {
    // A delete that fails leaves an orphan in Cloudinary, which is untidy but
    // harmless — the row is gone, so the site will never reference it again.
    console.error("[cloudinary] destroy failed", publicId, error);
  }
}

/**
 * Builds a delivery URL with transformations applied.
 *
 * `f_auto,q_auto` is what makes Cloudinary worth having: it negotiates AVIF or
 * WebP per browser and picks a quality level per image, so we store one
 * original and serve the right thing everywhere.
 */
export function deliveryUrl(
  publicId: string,
  kind: CloudinaryKind,
  { width, height, crop = "fill" }: { width?: number; height?: number; crop?: string } = {}
): string {
  if (!env.cloudinaryCloudName) return "";
  const parts = ["f_auto", "q_auto"];
  if (width) parts.push(`w_${Math.round(width)}`);
  if (height) parts.push(`h_${Math.round(height)}`);
  if (width || height) parts.push(`c_${crop}`);

  return [
    "https://res.cloudinary.com",
    env.cloudinaryCloudName,
    kind,
    "upload",
    parts.join(","),
    publicId,
  ].join("/");
}

/** A still frame from a video, for use as a poster image. */
export function videoPosterUrl(publicId: string, width = 1280): string {
  if (!env.cloudinaryCloudName) return "";
  return [
    "https://res.cloudinary.com",
    env.cloudinaryCloudName,
    "video",
    "upload",
    `so_auto,f_auto,q_auto,w_${Math.round(width)},c_fill`,
    `${publicId}.jpg`,
  ].join("/");
}
