import "server-only";
import { randomBytes } from "node:crypto";

/**
 * Fail-fast environment validation.
 *
 * Secrets are read exactly once, at module load, and the process refuses to
 * start if any of them is missing, too short, or left at a placeholder value.
 * That turns "we forgot to set the session secret in production" from a silent
 * security hole into a boot failure.
 */

const MIN_SECRET_BYTES = 32;

/** Values that look like a secret but are the ones we ship in .env.example. */
const PLACEHOLDERS = new Set([
  "change-me",
  "changeme",
  "replace-me",
  "your-secret-here",
  "generate-with-openssl-rand-base64-32",
]);

function readSecret(name: string, { required }: { required: boolean }): string {
  const raw = process.env[name]?.trim() ?? "";

  if (!raw) {
    if (required) {
      throw new Error(
        `[env] ${name} is not set. Generate one with:\n` +
          `      node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
      );
    }
    return "";
  }

  if (PLACEHOLDERS.has(raw.toLowerCase())) {
    throw new Error(`[env] ${name} is still set to a placeholder value. Generate a real secret.`);
  }

  // Accept base64 or hex; measure the decoded length so a short hex string
  // can't masquerade as a long key.
  const decoded = /^[0-9a-f]+$/i.test(raw)
    ? Buffer.from(raw, "hex")
    : Buffer.from(raw, "base64");
  const byteLength = decoded.length || Buffer.byteLength(raw, "utf8");

  if (byteLength < MIN_SECRET_BYTES) {
    throw new Error(
      `[env] ${name} must decode to at least ${MIN_SECRET_BYTES} bytes (got ${byteLength}).`
    );
  }

  return raw;
}

/**
 * In development we generate ephemeral secrets so `npm run dev` works from a
 * fresh clone. They rotate on every restart (sessions drop, which is fine
 * locally) and are never used when NODE_ENV is production.
 */
const isProduction = process.env.NODE_ENV === "production";

function devFallback(label: string): string {
  if (isProduction) {
    throw new Error(`[env] ${label} must be set explicitly in production.`);
  }
  return randomBytes(32).toString("base64");
}

function secret(name: string): string {
  const value = readSecret(name, { required: isProduction });
  return value || devFallback(name);
}

function bool(name: string, fallback: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (raw === undefined || raw === "") return fallback;
  return raw === "1" || raw === "true" || raw === "yes";
}

function int(name: string, fallback: number): number {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : fallback;
}

export const env = {
  isProduction,
  nodeEnv: process.env.NODE_ENV ?? "development",

  /** Canonical public origin — used for cookie scoping and absolute URLs. */
  siteUrl: (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),

  /**
   * Supabase Postgres. Use the *pooled* connection string (port 6543) here —
   * see the note in lib/db/index.ts. The direct string (5432) belongs in
   * DIRECT_DATABASE_URL and is used only by migrations.
   */
  databaseUrl: (process.env.DATABASE_URL ?? "").trim(),
  directDatabaseUrl: (process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL ?? "").trim(),
  /** Supabase always requires TLS; set false only for a local Postgres. */
  databaseSsl: bool("DATABASE_SSL", true),
  databasePoolMax: int("DATABASE_POOL_MAX", 10),

  /** Cloudinary — where every photo and video actually lives. */
  cloudinaryCloudName: (process.env.CLOUDINARY_CLOUD_NAME ?? "").trim(),
  cloudinaryApiKey: (process.env.CLOUDINARY_API_KEY ?? "").trim(),
  cloudinaryApiSecret: (process.env.CLOUDINARY_API_SECRET ?? "").trim(),
  /** Everything we upload is namespaced under this folder. */
  cloudinaryFolder: (process.env.CLOUDINARY_FOLDER ?? "caldim").trim().replace(/^\/+|\/+$/g, ""),

  /** Signs session cookies and CSRF tokens. */
  sessionSecret: secret("SESSION_SECRET"),
  /** Encrypts TOTP secrets at rest (AES-256-GCM). */
  encryptionKey: secret("APP_ENCRYPTION_KEY"),
  /** Salts IP addresses before they are logged, so logs hold no raw PII. */
  ipHashSalt: secret("IP_HASH_SALT"),

  /** Idle timeout, minutes. */
  sessionIdleMinutes: int("SESSION_IDLE_MINUTES", 60),
  /** Absolute timeout, hours — never extended by activity. */
  sessionAbsoluteHours: int("SESSION_ABSOLUTE_HOURS", 12),

  /** Consecutive failures before an account is temporarily locked. */
  maxLoginAttempts: int("MAX_LOGIN_ATTEMPTS", 5),
  lockoutMinutes: int("LOCKOUT_MINUTES", 15),

  /** Upload ceiling in bytes for admin media. */
  maxUploadBytes: int("MAX_UPLOAD_BYTES", 5 * 1024 * 1024),
  /** Upload ceiling for public RFQ attachments. */
  maxPublicUploadBytes: int("MAX_PUBLIC_UPLOAD_BYTES", 25 * 1024 * 1024),
  /**
   * Upload ceiling for admin video. Larger than the image limit because video
   * never passes through our server — the browser uploads it straight to
   * Cloudinary against a short-lived signature we issue.
   */
  maxVideoUploadBytes: int("MAX_VIDEO_UPLOAD_BYTES", 200 * 1024 * 1024),

  /** Requires 2FA to be enrolled before the admin area unlocks. */
  requireTotp: bool("REQUIRE_TOTP", false),

  /** Set false only when terminating TLS somewhere that isn't HTTPS. */
  secureCookies: bool("SECURE_COOKIES", isProduction),

  /** Optional outbound mail for RFQ notifications. */
  contactNotifyTo: process.env.CONTACT_NOTIFY_TO ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",

  /** Optional SMTP outbound mail for RFQ notifications & auto-confirmations. */
  smtpHost: (process.env.SMTP_HOST ?? process.env.EMAIL_HOST ?? "").trim(),
  smtpPort: int("SMTP_PORT", int("EMAIL_PORT", 587)),
  smtpUser: (process.env.SMTP_USER ?? process.env.EMAIL_USER ?? "").trim(),
  smtpPassword: (
    process.env.SMTP_PASSWORD ??
    process.env.SMTP_PASS ??
    process.env.EMAIL_PASS ??
    ""
  ).trim(),
  smtpSecure: bool("SMTP_SECURE", false),
  smtpFromEmail: (process.env.SMTP_FROM_EMAIL ?? process.env.EMAIL_FROM ?? "").trim(),
  smtpFromName: (process.env.SMTP_FROM_NAME ?? "Caldim Engineering").trim(),
  contactNotifyEmail: (
    process.env.CONTACT_NOTIFY_EMAIL ??
    process.env.CONTACT_NOTIFY_TO ??
    "quotes@caldimengg.com"
  ).trim(),
} as const;

export type Env = typeof env;
