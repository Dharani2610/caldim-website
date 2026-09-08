import "server-only";
import { cookies, headers } from "next/headers";
import { env } from "@/backend/env";
import { safeEqual } from "@/backend/security/crypto";

/**
 * CSRF defence, in two independent layers.
 *
 * 1. Origin / Sec-Fetch-Site check — rejects cross-site writes outright.
 * 2. Double-submit token — the request must echo, in a header, the value held
 *    in a cookie. An attacker on another origin can cause a request to be
 *    *sent* with our cookies, but the same-origin policy stops them reading
 *    the cookie, so they cannot know what to echo back.
 *
 * The cookie carries no signature, and doesn't need one. The classic weakness
 * of double-submit is a sibling subdomain that can write cookies for the
 * parent domain; the `__Host-` prefix closes that off at the browser level,
 * because a cookie with that prefix can only be set by this exact host, over
 * HTTPS, with no Domain attribute. That is a stronger guarantee than an HMAC,
 * and it avoids sharing a secret between the Edge middleware that mints the
 * token and the Node runtime that checks it.
 *
 * The token itself is issued in middleware — a Server Component cannot write
 * cookies, so the layout only ever *reads* the value middleware prepared.
 */

export const CSRF_HEADER = "x-caldim-csrf";
/** Set by middleware on the request, so the first render sees a fresh token. */
export const CSRF_REQUEST_HEADER = "x-csrf-token";

export function csrfCookieName(): string {
  return env.secureCookies ? "__Host-caldim_csrf" : "caldim_csrf";
}

/** A well-formed token is 32 random bytes, base64url encoded. */
export function isWellFormedCsrfToken(token: string | undefined): token is string {
  return typeof token === "string" && /^[A-Za-z0-9_-]{40,64}$/.test(token);
}

/**
 * The token for this request, for a Server Component to hand to the client.
 *
 * Prefers the header middleware set (which reflects a token minted on *this*
 * request, before the browser has the cookie) and falls back to the cookie.
 */
export function getOrCreateCsrfToken(): string {
  const fromMiddleware = headers().get(CSRF_REQUEST_HEADER);
  if (isWellFormedCsrfToken(fromMiddleware ?? undefined)) return fromMiddleware as string;

  const fromCookie = cookies().get(csrfCookieName())?.value;
  return isWellFormedCsrfToken(fromCookie) ? fromCookie : "";
}

export type CsrfFailure = "origin" | "missing" | "mismatch";

/**
 * Validates a mutating request. Returns null when it is safe, or a short
 * reason code the caller turns into a 403.
 */
export function verifyCsrf(request: Request): CsrfFailure | null {
  const h = headers();

  // ── Layer 1: where did this request come from? ──────────────────────────
  const site = h.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return "origin";

  const origin = h.get("origin");
  if (origin) {
    const expected = new Set([env.siteUrl.replace(/\/$/, "")]);
    const host = h.get("host");
    if (host) {
      expected.add(`https://${host}`);
      if (!env.isProduction) expected.add(`http://${host}`);
    }
    if (!expected.has(origin.replace(/\/$/, ""))) return "origin";
  } else if (!site) {
    // Neither Origin nor Sec-Fetch-Site: too old, or too odd, to trust with a
    // state-changing request.
    return "origin";
  }

  // ── Layer 2: double-submit ─────────────────────────────────────────────
  const cookieToken = cookies().get(csrfCookieName())?.value;
  const headerToken = request.headers.get(CSRF_HEADER);

  if (!cookieToken || !headerToken) return "missing";
  if (!isWellFormedCsrfToken(cookieToken)) return "mismatch";
  if (!safeEqual(cookieToken, headerToken)) return "mismatch";

  return null;
}
