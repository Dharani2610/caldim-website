import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { env } from "@/backend/env";

/**
 * Low-level cryptographic primitives, kept in one file so every call site uses
 * the same construction and there is a single place to audit.
 */

/** Normalises a base64/hex/utf-8 secret into exactly 32 bytes via SHA-256. */
function keyFrom(secret: string): Buffer {
  return createHash("sha256").update(secret, "utf8").digest();
}

const ENCRYPTION_KEY = keyFrom(env.encryptionKey);

/** URL-safe random token. 32 bytes = 256 bits of entropy. */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** SHA-256, hex encoded. Used for storing session-token digests. */
export function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

/**
 * Keyed hash of an IP address. Logs and rate-limit keys hold this instead of
 * the address itself, so the audit trail stays useful without storing PII in
 * a form that is meaningful to anyone who reads the database.
 */
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  return createHmac("sha256", env.ipHashSalt).update(ip).digest("hex").slice(0, 32);
}

/** HMAC-SHA256 over `value`, keyed by the session secret. */
export function sign(value: string): string {
  return createHmac("sha256", env.sessionSecret).update(value).digest("base64url");
}

/**
 * Constant-time string comparison. Falls back to `false` on length mismatch
 * rather than letting `timingSafeEqual` throw, which would itself leak length.
 */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    // Still burn a comparison so the timing profile doesn't reveal the mismatch.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/**
 * AES-256-GCM. Output is `v1.<iv>.<authTag>.<ciphertext>`, all base64url.
 * The version prefix leaves room to rotate the construction later without
 * being unable to read existing rows.
 */
export function encrypt(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    "v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function decrypt(payload: string): string {
  const [version, ivPart, tagPart, dataPart] = payload.split(".");
  if (version !== "v1" || !ivPart || !tagPart || !dataPart) {
    throw new Error("Malformed ciphertext");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    ENCRYPTION_KEY,
    Buffer.from(ivPart, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataPart, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

/** SHA-256 of a byte buffer — integrity checksum for uploads. */
export function checksumBytes(bytes: Buffer | Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}
