import "server-only";
import { lt } from "drizzle-orm";
import { auditLogs, db, newId } from "@/backend/db";
import { hashIp } from "@/backend/security/crypto";
import { clientIp, clientUserAgent } from "@/backend/security/session";

/**
 * Append-only audit trail.
 *
 * Every privileged action — successful or not — lands here with who, what,
 * when, and a salted hash of where from. Failures matter as much as successes:
 * a run of `login.failure` rows is the earliest signal anyone gets that the
 * site is under attack.
 */

export type AuditAction =
  | "login.success"
  | "login.failure"
  | "login.locked"
  | "login.rate_limited"
  | "logout"
  | "totp.challenge.success"
  | "totp.challenge.failure"
  | "totp.enrolled"
  | "totp.disabled"
  | "totp.recovery_used"
  | "password.changed"
  | "sessions.revoked"
  | "content.updated"
  | "leader.created"
  | "leader.updated"
  | "leader.deleted"
  | "leader.reordered"
  | "media.uploaded"
  | "media.updated"
  | "media.deleted"
  | "gallery.created"
  | "gallery.updated"
  | "gallery.deleted"
  | "gallery.reordered"
  | "contact.received"
  | "csrf.rejected";

export interface AuditInput {
  action: AuditAction;
  userId?: string | null;
  /** Free-text actor label for events with no user row yet (e.g. an email). */
  actorInfo?: string;
  entity?: string;
  entityId?: string;
  outcome?: "success" | "failure";
  meta?: Record<string, unknown>;
}

/**
 * Keys whose values never reach the log, whatever a caller passes. An audit
 * trail that quietly accumulates passwords is worse than no audit trail.
 */
const REDACTED_KEYS = /pass|secret|token|code|hash|otp|key|cookie/i;

/**
 * Returns a plain object, not a JSON string.
 *
 * `meta` is a jsonb column and Drizzle serialises it on the way in. Handing it
 * an already-stringified value would store a JSON *string* containing JSON,
 * which reads back as a string — queryable only with a second parse, and
 * useless to `meta->>'key'` in a Supabase query.
 */
function sanitiseMeta(
  meta: Record<string, unknown> | undefined
): Record<string, unknown> | null {
  if (!meta) return null;
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (REDACTED_KEYS.test(key)) {
      safe[key] = "[redacted]";
    } else if (typeof value === "string") {
      safe[key] = value.slice(0, 300);
    } else if (value === null || ["number", "boolean"].includes(typeof value)) {
      safe[key] = value;
    } else {
      // Anything else (arrays, nested objects, Dates) is flattened to a short
      // string so a caller can't bloat a log row with an arbitrary structure.
      safe[key] = JSON.stringify(value)?.slice(0, 300) ?? null;
    }
  }
  return safe;
}

/**
 * Records an event. Never throws: an audit-write failure must not turn a
 * working request into a 500, and must not become a way to break the app.
 */
export async function audit(input: AuditInput): Promise<void> {
  try {
    await db.insert(auditLogs)
      .values({
        id: newId(),
        action: input.action,
        userId: input.userId ?? null,
        actorInfo: (input.actorInfo ?? "").slice(0, 200),
        entity: input.entity ?? "",
        entityId: input.entityId ?? "",
        outcome: input.outcome ?? "success",
        ipHash: hashIp(clientIp()),
        userAgent: clientUserAgent(),
        meta: sanitiseMeta(input.meta),
        createdAt: new Date(),
      });
  } catch (error) {
    console.error("[audit] failed to record event", input.action, error);
  }
}

/** Trims the trail to the retention window. */
export async function pruneAuditLog(retentionDays = 365): Promise<void> {
  try {
    await db.delete(auditLogs)
      .where(lt(auditLogs.createdAt, new Date(Date.now() - retentionDays * 24 * 3600_000)));
  } catch {
    // Housekeeping must never break a request.
  }
}
