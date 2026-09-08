import "server-only";
import { getRateLimitsCollection, isDatabaseConfigured } from "@/backend/db";
import { hashIp } from "@/backend/security/crypto";
import { clientIp } from "@/backend/security/session";

/**
 * Persistent fixed-window rate limiting.
 *
 * Counters live in MongoDB (rate_limits collection) rather than process memory,
 * so a restart doesn't hand an attacker a fresh budget and the limit still
 * holds if the app is run with more than one worker.
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
 * Uses atomic MongoDB operations so concurrent requests cannot race.
 */
export async function consume(
  rule: RateLimitRule,
  identifier: string
): Promise<RateLimitResult> {
  if (!isDatabaseConfigured()) {
    // If DB is unconfigured, fail open for rate limiting so setup errors are caught properly elsewhere
    return { allowed: true, remaining: rule.limit, retryAfter: 0 };
  }

  const key = `${rule.name}:${identifier}`;
  const nowDate = new Date();
  const windowMs = rule.windowSeconds * 1000;
  const blockMs = (rule.blockSeconds ?? rule.windowSeconds) * 1000;
  const windowCutoff = new Date(nowDate.getTime() - windowMs);
  const blockDate = new Date(nowDate.getTime() + blockMs);
  const defaultTtl = new Date(nowDate.getTime() + Math.max(windowMs, blockMs) + 60_000);

  const collection = await getRateLimitsCollection();

  // Try to atomically increment an existing active unblocked window
  const res = await collection.findOneAndUpdate(
    {
      _id: key,
      windowStart: { $gte: windowCutoff },
      $or: [
        { blockedUntil: null },
        { blockedUntil: { $lte: nowDate } },
      ],
    },
    [
      {
        $set: {
          count: { $add: ["$count", 1] },
          updatedAt: nowDate,
          blockedUntil: {
            $cond: {
              if: { $gt: [{ $add: ["$count", 1] }, rule.limit] },
              then: blockDate,
              else: null,
            },
          },
          expiresAt: {
            $cond: {
              if: { $gt: [{ $add: ["$count", 1] }, rule.limit] },
              then: new Date(blockDate.getTime() + 60_000),
              else: defaultTtl,
            },
          },
        },
      },
    ],
    { returnDocument: "after" }
  );

  if (res) {
    if (res.blockedUntil && res.blockedUntil > nowDate) {
      return {
        allowed: false,
        remaining: 0,
        retryAfter: Math.ceil((res.blockedUntil.getTime() - nowDate.getTime()) / 1000),
      };
    }
    return {
      allowed: true,
      remaining: Math.max(0, rule.limit - res.count),
      retryAfter: 0,
    };
  }

  // If findOneAndUpdate didn't match, check if the record is currently blocked
  const blockedDoc = await collection.findOne({
    _id: key,
    blockedUntil: { $gt: nowDate },
  });

  if (blockedDoc?.blockedUntil && blockedDoc.blockedUntil > nowDate) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((blockedDoc.blockedUntil.getTime() - nowDate.getTime()) / 1000),
    };
  }

  // Window either expired or record doesn't exist yet: start fresh window with count = 1
  await collection.updateOne(
    { _id: key },
    {
      $set: {
        count: 1,
        windowStart: nowDate,
        blockedUntil: null,
        expiresAt: defaultTtl,
        updatedAt: nowDate,
      },
    },
    { upsert: true }
  );

  return { allowed: true, remaining: rule.limit - 1, retryAfter: 0 };
}

/** Clears a counter — called after a successful sign-in. */
export async function reset(rule: RateLimitRule, identifier: string): Promise<void> {
  if (!isDatabaseConfigured()) return;
  try {
    const collection = await getRateLimitsCollection();
    await collection.deleteOne({ _id: `${rule.name}:${identifier}` });
  } catch {
    // Best-effort reset
  }
}

/** Convenience: limit by the caller's (hashed) IP address. */
export async function consumeByIp(rule: RateLimitRule): Promise<RateLimitResult> {
  return consume(rule, `ip:${hashIp(clientIp()) ?? "unknown"}`);
}

/** Housekeeping: drop counters whose window closed a while ago. */
export async function pruneRateLimits(): Promise<void> {
  if (!isDatabaseConfigured()) return;
  try {
    const collection = await getRateLimitsCollection();
    await collection.deleteMany({ expiresAt: { $lt: new Date() } });
  } catch {
    // Housekeeping must never break a request.
  }
}

