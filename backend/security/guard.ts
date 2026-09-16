import "server-only";
import { NextResponse } from "next/server";
import type { AdminUser, Session } from "@/backend/db";
import { audit } from "@/backend/security/audit";
import { verifyCsrf } from "@/backend/security/csrf";
import { consume, consumeByIp, type RateLimitRule } from "@/backend/security/rateLimit";
import { isDatabaseConfigured } from "@/backend/db";
import { getSession } from "@/backend/security/session";
import { hashIp } from "@/backend/security/crypto";
import { clientIp } from "@/backend/security/session";

/**
 * One gate every privileged route handler passes through, so no endpoint can
 * accidentally ship without CSRF checking, rate limiting, or an auth check.
 * Forgetting a guard is the most common way an admin API leaks; making the
 * guard the only way to get a `user` makes that mistake hard to commit.
 */

export interface GuardOptions {
  /** Skip CSRF for genuinely safe (GET/HEAD) handlers. */
  csrf?: boolean;
  rateLimit?: RateLimitRule;
  /** Restrict to the "owner" role. */
  ownerOnly?: boolean;
}

export type GuardResult =
  | { ok: true; user: AdminUser; session: Session }
  | { ok: false; response: NextResponse };

/** A deliberately vague body — error text should never be a discovery tool. */
function deny(status: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

export async function guard(
  request: Request,
  { csrf = true, rateLimit, ownerOnly = false }: GuardOptions = {}
): Promise<GuardResult> {
  // Nothing behind this guard can work without a database — sessions, rate
  // limits and the audit log all live there. Saying so plainly beats letting
  // every route throw its own unhandled 500.
  if (!isDatabaseConfigured()) {
    return {
      ok: false,
      response: deny(503, "The database isn't configured yet. See the server log for setup steps."),
    };
  }

  if (csrf) {
    const failure = verifyCsrf(request);
    if (failure) {
      await audit({
        action: "csrf.rejected",
        outcome: "failure",
        entity: new URL(request.url).pathname,
        meta: { reason: failure },
      });
      return { ok: false, response: deny(403, "Request rejected. Reload the page and try again.") };
    }
  }

  const auth = await getSession();
  if (!auth) {
    return { ok: false, response: deny(401, "Sign in to continue.") };
  }

  if (auth.user.mustChangePassword) {
    return {
      ok: false,
      response: deny(403, "Password change required before accessing admin resources."),
    };
  }

  if (ownerOnly && auth.user.role !== "owner") {
    return { ok: false, response: deny(403, "You don't have permission to do that.") };
  }

  if (rateLimit) {
    // Two independent budgets: one per account, one per address. Neither a
    // single busy address nor one compromised account can exhaust the other.
    const [byUser, byIp] = await Promise.all([
      consume(rateLimit, `user:${auth.user.id}`),
      consumeByIp(rateLimit),
    ]);
    const blocked = !byUser.allowed ? byUser : !byIp.allowed ? byIp : null;
    if (blocked) {
      return {
        ok: false,
        response: NextResponse.json(
          { ok: false, error: "Too many requests. Wait a moment and try again." },
          { status: 429, headers: { "Retry-After": String(blocked.retryAfter) } }
        ),
      };
    }
  }

  return { ok: true, user: auth.user, session: auth.session };
}

/**
 * The same CSRF + rate-limit treatment for endpoints that are public by
 * design (the RFQ form), where there is no session to check.
 */
export async function guardPublic(
  request: Request,
  { rateLimit }: { rateLimit?: RateLimitRule } = {}
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const failure = verifyCsrf(request);
  if (failure) {
    return { ok: false, response: deny(403, "Request rejected. Reload the page and try again.") };
  }

  if (rateLimit) {
    try {
      if (isDatabaseConfigured()) {
        const result = await consume(rateLimit, hashIp(clientIp()) ?? "unknown-ip");
        if (!result.allowed) {
          return {
            ok: false,
            response: NextResponse.json(
              { ok: false, error: "Too many submissions. Please try again later." },
              { status: 429, headers: { "Retry-After": String(result.retryAfter) } }
            ),
          };
        }
      }
    } catch (error) {
      console.error("[guardPublic] rate-limit check failed", error);
    }
  }

  return { ok: true };
}

/** Uniform JSON success shape, with caching explicitly disabled. */
export function jsonOk<T extends Record<string, unknown>>(data: T, status = 200) {
  return NextResponse.json(
    { ok: true, ...data },
    { status, headers: { "Cache-Control": "no-store" } });
}

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json(
    { ok: false, error: message, ...extra },
    { status, headers: { "Cache-Control": "no-store" } });
}
