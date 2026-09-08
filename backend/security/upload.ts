import "server-only";
import path from "node:path";
import sharp, { type Metadata, type Sharp } from "sharp";
import { fileTypeFromBuffer } from "file-type";
import { env } from "@/backend/env";
import { checksumBytes, randomToken } from "@/backend/security/crypto";
import {
  type CloudinaryKind,
  type UploadedAsset,
  uploadBuffer,
} from "@/backend/media/cloudinary";

/**
 * Upload handling.
 *
 * The rule is unchanged by the move to Cloudinary: nothing a browser sends is
 * trusted — not the filename, not the declared Content-Type, not the
 * extension. What differs is only the destination.
 *
 * It would have been tempting to hand raw uploads straight to Cloudinary and
 * let it sort them out. We don't, for images, because the re-encode below is
 * the step that actually neutralises a malicious file, and doing it here means
 * the bytes Cloudinary stores are already clean rather than merely being
 * cleaned on the way out.
 */

/** Images we accept, keyed by the magic-byte signature we detect. */
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

/** Video we accept for direct upload, keyed the same way. */
const ALLOWED_VIDEO_TYPES = new Map<string, string>([
  ["video/mp4", "mp4"],
  ["video/quicktime", "mov"],
  ["video/webm", "webm"],
  ["video/x-matroska", "mkv"],
]);

/** Documents accepted on the public RFQ form. Stored, never rendered. */
const ALLOWED_DOCUMENT_TYPES = new Map<string, { extension: string; mime: string }>([
  ["application/pdf", { extension: "pdf", mime: "application/pdf" }],
  ["application/zip", { extension: "zip", mime: "application/zip" }],
  ["image/vnd.dwg", { extension: "dwg", mime: "application/acad" }],
]);

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

export interface StoredUpload extends UploadedAsset {
  mimeType: string;
  originalName: string;
}

/**
 * Reduces a user-supplied filename to something safe to store as a label.
 * The result is never used to build a path or a public_id — those come from a
 * random token — so this only has to be sane, not unique.
 */
export function sanitiseFilename(name: string): string {
  const base = path.basename(name).normalize("NFKD");
  const cleaned = base
    .replace(/[^\w.\-() ]+/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^\.+/, "")
    .trim();
  return (cleaned || "upload").slice(0, 120);
}

/** An unguessable, collision-resistant Cloudinary public_id leaf. */
export function newPublicId(): string {
  return `${Date.now().toString(36)}-${randomToken(9)}`;
}

/**
 * Validates an image, then uploads it to Cloudinary.
 *
 * The decisive step is the re-encode: the bytes are decoded by sharp and
 * written back out fresh. A polyglot file — a valid PNG with a PHP payload, or
 * HTML appended after the image data — does not survive, because only the
 * decoded pixels are carried across. EXIF goes with it, which also strips the
 * GPS coordinates phones bury in photographs.
 */
export async function storeImageUpload(
  file: File,
  { maxBytes = env.maxUploadBytes, maxDimension = 2600 } = {}
): Promise<StoredUpload> {
  if (file.size === 0) throw new UploadError("The file is empty.");
  if (file.size > maxBytes) {
    throw new UploadError(`Images must be ${Math.floor(maxBytes / 1024 / 1024)}MB or smaller.`);
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  // Re-check after reading: `file.size` is a client-supplied claim.
  if (bytes.byteLength > maxBytes) {
    throw new UploadError("The file is larger than it claimed to be.");
  }

  // Sniff the real type from the leading bytes, ignoring the declared one.
  const detected = await fileTypeFromBuffer(bytes);
  if (!detected || !ALLOWED_IMAGE_TYPES.has(detected.mime)) {
    throw new UploadError("Upload a JPEG, PNG, WebP, or AVIF image.");
  }

  let pipeline: Sharp;
  let metadata: Metadata;
  try {
    pipeline = sharp(bytes, { failOn: "error", limitInputPixels: 40_000_000 });
    metadata = await pipeline.metadata();
  } catch {
    throw new UploadError("That image could not be read. Try re-exporting it.");
  }

  if (!metadata.width || !metadata.height) {
    throw new UploadError("That image has no readable dimensions.");
  }
  // A "decompression bomb": tiny on disk, enormous once decoded.
  if (metadata.width * metadata.height > 40_000_000) {
    throw new UploadError("That image is too large to process.");
  }

  const output = await pipeline
    .rotate() // apply EXIF orientation before the metadata is discarded
    .resize({
      width: maxDimension,
      height: maxDimension,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 88, effort: 4 })
    .toBuffer({ resolveWithObject: true });

  let uploaded: UploadedAsset;
  try {
    uploaded = await uploadBuffer(output.data, {
      kind: "image",
      publicId: newPublicId(),
      filename: sanitiseFilename(file.name),
    });
  } catch (error) {
    console.error("[upload] cloudinary image upload failed", error);
    throw new UploadError("That image could not be sent to the media host.");
  }

  return {
    ...uploaded,
    // Trust our own re-encode over whatever Cloudinary reports the format as.
    mimeType: "image/webp",
    width: uploaded.width ?? output.info.width,
    height: uploaded.height ?? output.info.height,
    checksum: checksumBytes(output.data),
    originalName: sanitiseFilename(file.name),
  };
}

/**
 * Validates and stores either an image or a PDF document for admin site media.
 *
 * Anti-spoofing:
 *  - Sniffs real magic bytes from the leading buffer.
 *  - Images (JPEG, PNG, WebP, AVIF) go through Sharp re-encode to sanitize and strip EXIF,
 *    stored as `kind: "image"`.
 *  - PDFs must match `%PDF-` header at byte offset 0. They bypass Sharp and are stored as
 *    `kind: "raw"` with format "pdf".
 *  - Any other file or spoofed file (e.g. .txt renamed to .pdf) is rejected immediately.
 */
export async function storeAdminMediaUpload(
  file: File,
  { maxBytes = env.maxUploadBytes } = {}
): Promise<StoredUpload> {
  if (file.size === 0) throw new UploadError("The file is empty.");
  if (file.size > maxBytes) {
    throw new UploadError(`Files must be ${Math.floor(maxBytes / 1024 / 1024)}MB or smaller.`);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.byteLength > maxBytes) {
    throw new UploadError("The file is larger than it claimed to be.");
  }

  const detected = await fileTypeFromBuffer(bytes);
  const isPdfHeader =
    bytes.length >= 5 && bytes.subarray(0, 5).toString("ascii") === "%PDF-";

  if (isPdfHeader || detected?.mime === "application/pdf") {
    if (!isPdfHeader) {
      throw new UploadError("The PDF document has an invalid or corrupted header.");
    }

    let uploaded: UploadedAsset;
    try {
      uploaded = await uploadBuffer(bytes, {
        kind: "raw",
        publicId: `cert-${newPublicId()}.pdf`,
        filename: sanitiseFilename(file.name),
      });
    } catch (error) {
      console.error("[upload] cloudinary pdf upload failed", error);
      throw new UploadError("That PDF document could not be sent to the media host.");
    }

    return {
      ...uploaded,
      resourceType: "raw",
      format: "pdf",
      mimeType: "application/pdf",
      checksum: checksumBytes(bytes),
      originalName: sanitiseFilename(file.name),
    };
  }

  if (detected && ALLOWED_IMAGE_TYPES.has(detected.mime)) {
    return storeImageUpload(file, { maxBytes });
  }

  throw new UploadError("Upload a JPEG, PNG, WebP, or AVIF image, or a valid PDF document.");
}

/**
 * Checks a video *before* the browser is allowed to upload it.
 *
 * Video never passes through the server — a 200MB body through a route handler
 * is slow, memory-hungry, and beyond the request limit of most hosts. So the
 * browser uploads straight to Cloudinary against a short-lived signature. That
 * moves the validation earlier: we inspect the leading bytes the client sends
 * us, and only then issue a signature. Cloudinary re-encodes on delivery, so a
 * file that lies about its type produces a broken asset rather than a served
 * payload — and the confirm step re-reads the truth from Cloudinary anyway.
 */
export function checkVideoHeader(
  header: Buffer,
  declaredSize: number
): { extension: string; mimeType: string } {
  if (declaredSize <= 0) throw new UploadError("The file is empty.");
  if (declaredSize > env.maxVideoUploadBytes) {
    throw new UploadError(
      `Video must be ${Math.floor(env.maxVideoUploadBytes / 1024 / 1024)}MB or smaller.`);
  }

  // MP4 and MOV both use the ISO base media format: the box at offset 4 is
  // "ftyp", and the brand that follows says which. WebM and MKV are Matroska,
  // which starts with the EBML magic 1A 45 DF A3.
  const isIso = header.length >= 12 && header.subarray(4, 8).toString("ascii") === "ftyp";
  const isMatroska =
    header.length >= 4 &&
    header[0] === 0x1a &&
    header[1] === 0x45 &&
    header[2] === 0xdf &&
    header[3] === 0xa3;

  if (isIso) {
    const brand = header.subarray(8, 12).toString("ascii");
    if (brand.startsWith("qt")) return { extension: "mov", mimeType: "video/quicktime" };
    return { extension: "mp4", mimeType: "video/mp4" };
  }
  if (isMatroska) return { extension: "webm", mimeType: "video/webm" };

  throw new UploadError("Upload an MP4, MOV, WebM, or MKV video.");
}

/** The MIME type recorded for a confirmed video, from Cloudinary's format. */
export function videoMimeForFormat(format: string): string {
  const wanted = format.toLowerCase();
  const match = Array.from(ALLOWED_VIDEO_TYPES.entries()).find(([, ext]) => ext === wanted);
  return match ? match[0] : "video/mp4";
}

/**
 * Stores an RFQ attachment. These are never re-encoded (a DWG has no safe
 * canonical form) and never rendered — they go to Cloudinary as `raw`, which
 * is delivered as an opaque download rather than interpreted as media.
 */
export async function storeDocumentUpload(
  file: File,
  { maxBytes = env.maxPublicUploadBytes } = {}
): Promise<StoredUpload> {
  if (file.size === 0) throw new UploadError("The file is empty.");
  if (file.size > maxBytes) {
    throw new UploadError(`Attachments must be ${Math.floor(maxBytes / 1024 / 1024)}MB or smaller.`);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.byteLength > maxBytes) {
    throw new UploadError("The file is larger than it claimed to be.");
  }

  const detected = await fileTypeFromBuffer(bytes);
  const extension = path.extname(file.name).toLowerCase().replace(".", "");

  // DWG/DXF/IFC are CAD formats `file-type` may not recognise; allow them by
  // extension but only when the sniffer found nothing it actively disagrees
  // with. Anything it *does* identify must be on the allowlist.
  const cadExtensions = new Set(["dwg", "dxf", "ifc"]);
  const known = detected ? ALLOWED_DOCUMENT_TYPES.get(detected.mime) : undefined;

  if (detected && !known) {
    throw new UploadError("Attach a PDF, ZIP, or CAD file (DWG, DXF, IFC).");
  }
  if (!detected && !cadExtensions.has(extension)) {
    throw new UploadError("Attach a PDF, ZIP, or CAD file (DWG, DXF, IFC).");
  }

  const resolved = known ?? { extension, mime: "application/octet-stream" };

  let uploaded: UploadedAsset;
  try {
    uploaded = await uploadBuffer(bytes, {
      kind: "raw",
      publicId: `rfq-${newPublicId()}.${resolved.extension}`,
      filename: sanitiseFilename(file.name),
    });
  } catch (error) {
    console.error("[upload] cloudinary document upload failed", error);
    throw new UploadError("That attachment could not be stored.");
  }

  return {
    ...uploaded,
    mimeType: resolved.mime,
    checksum: checksumBytes(bytes),
    originalName: sanitiseFilename(file.name),
  };
}

export type { CloudinaryKind };
