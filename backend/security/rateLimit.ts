import "server-only";
import { and, eq, isNull, lt, or } from "drizzle-orm";
import { db, one, rateLimits } from "@/backend/db";
import { hashIp } from "@/backend/security/crypto";
import { clientIp } from "@/backend/security/session";

/**
 * Persistent fixed-window rate limiting.
 *
 * Counters live in the database rather than process memory, so a restart
 * doesn't hand an attacker a fresh budget and the limit still holds if the app
 * is run with more than one worker.
 */

export interface RateLimitRule {
  /** Namespace, e.g. "login" — keeps unrelated limits off the same counter. */
  name: string;
  /** Requests permitted per window. */
  limit: number;
  /** Window length, seconds. */
  windowSeconds: number;
  /** How long to block once exceeded. Defaults to the window length. */
  blockSeconds?: number;
}

export const RULES = {
  login: { name: "login", limit: 8, windowSeconds: 600, blockSeconds: 900 },
  totp: { name: "totp", limit: 8, windowSeconds: 600, blockSeconds: 900 },
  passwordChange: { name: "pwchange", limit: 6, windowSeconds: 3600 },
  adminWrite: { name: "adminwrite", limit: 240, windowSeconds: 600 },
  upload: { name: "upload", limit: 40, windowSeconds: 600 },
  contact: { name: "contact", limit: 5, windowSeconds: 3600, blockSeconds: 3600 },
} as const satisfies Record<string, RateLimitRule>;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Seconds until the caller may retry. Only meaningful when blocked. */
  retryAfter: number;
}

/**
 * Consumes one unit against `rule` for `identifier`.
 *
 * Callers combine a per-account and a per-IP limit so that neither one noisy
 * address nor a distributed attempt against a single account slips through the
 * gap the other would leave.
 */
export async function consume(
  rule: RateLimitRule,
  identifier: string
): Promise<RateLimitResult> {
  const key = `${rule.name}:${identifier}`;
  const nowDate = new Date();
  const windowMs = rule.windowSeconds * 1000;

  const existing = await one(db.select().from(rateLimits).where(eq(rateLimits.key, key)));

  if (existing?.blockedUntil && existing.blockedUntil > nowDate) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((existing.blockedUntil.getTime() - nowDate.getTime()) / 1000),
    };
  }

  const windowExpired =
    !existing || nowDate.getTime() - existing.windowStart.getTime() >= windowMs;

  if (windowExpired) {
    await db.insert(rateLimits)
      .values({ key, count: 1, windowStart: nowDate, blockedUntil: null, updatedAt: nowDate })
      .onConflictDoUpdate({
        target: rateLimits.key,
        set: { count: 1, windowStart: nowDate, blockedUntil: null, updatedAt: nowDate },
      });
    return { allowed: true, remaining: rule.limit - 1, retryAfter: 0 };
  }

  const nextCount = existing.count + 1;

  if (nextCount > rule.limit) {
    const blockMs = (rule.blockSeconds ?? rule.windowSeconds) * 1000;
    const blockedUntil = new Date(nowDate.getTime() + blockMs);
    await db.update(rateLimits)
      .set({ count: nextCount, blockedUntil, updatedAt: nowDate })
      .where(eq(rateLimits.key, key));
    return { allowed: false, remaining: 0, retryAfter: Math.ceil(blockMs / 1000) };
  }

  await db.update(rateLimits)
    .set({ count: nextCount, updatedAt: nowDate })
    .where(eq(rateLimits.key, key));

  return { allowed: true, remaining: rule.limit - nextCount, retryAfter: 0 };
}

/** Clears a counter — called after a successful sign-in. */
export async function reset(rule: RateLimitRule, identifier: string): Promise<void> {
  await db.delete(rateLimits).where(eq(rateLimits.key, `${rule.name}:${identifier}`));
}

/** Convenience: limit by the caller's (hashed) IP address. */
export async function consumeByIp(rule: RateLimitRule): Promise<RateLimitResult> {
  return consume(rule, `ip:${hashIp(clientIp()) ?? "unknown"}`);
}

/** Housekeeping: drop counters whose window closed a while ago. */
export async function pruneRateLimits(): Promise<void> {
  const nowDate = new Date();
  const cutoff = new Date(nowDate.getTime() - 24 * 3600_000);
  try {
    await db.delete(rateLimits)
      .where(
        and(
          lt(rateLimits.windowStart, cutoff),
          or(isNull(rateLimits.blockedUntil), lt(rateLimits.blockedUntil, nowDate))
        ));
  } catch {
    // Housekeeping must never break a request.
  }
}
