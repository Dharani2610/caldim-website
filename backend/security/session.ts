import "server-only";
import { cookies, headers } from "next/headers";
import { and, eq, isNull, lt, ne, or } from "drizzle-orm";
import {
  adminUsers,
  db,
  isDatabaseConfigured,
  newId,
  one,
  sessions,
  type AdminUser,
  type Session,
} from "@/backend/db";
import { env } from "@/backend/env";
import { hashIp, randomToken, sha256 } from "@/backend/security/crypto";

/**
 * Server-side sessions.
 *
 * The cookie carries an opaque random token and nothing else — no user id, no
 * role, no signed claims. Authority lives in the database row, so revoking a
 * session (sign-out, password change, "sign out everywhere") takes effect on
 * the very next request instead of waiting for a token to expire on its own.
 */

/**
 * `__Host-` is not a naming convention — browsers enforce it: the cookie must
 * be Secure, path=/, and carry no Domain attribute, which makes it impossible
 * for a sibling subdomain to overwrite it. The prefix is rejected over plain
 * HTTP, so local development uses the bare name.
 */
export function sessionCookieName(): string {
  return env.secureCookies ? "__Host-caldim_session" : "caldim_session";
}

export interface AuthenticatedSession {
  session: Session;
  user: AdminUser;
}

function idleExpiry(from = new Date()): Date {
  return new Date(from.getTime() + env.sessionIdleMinutes * 60_000);
}

function absoluteExpiry(from = new Date()): Date {
  return new Date(from.getTime() + env.sessionAbsoluteHours * 3_600_000);
}

/** Best-effort client IP, trusting only the first hop of X-Forwarded-For. */
export function clientIp(): string | null {
  const h = headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return h.get("x-real-ip");
}

export function clientUserAgent(): string {
  return (headers().get("user-agent") ?? "").slice(0, 400);
}

/**
 * Issues a new session and sets the cookie. Called only once credentials have
 * been verified. A session still owing a TOTP code is created with
 * `fullyAuthenticated: false` and unlocks nothing until that code is accepted.
 *
 * A fresh row is always created rather than reusing whatever cookie the
 * browser arrived with — that is what closes off session fixation.
 */
export async function createSession(
  userId: string,
  { fullyAuthenticated }: { fullyAuthenticated: boolean }
): Promise<string> {
  const token = randomToken(32);
  const nowDate = new Date();

  await db.insert(sessions)
    .values({
      id: newId(),
      tokenHash: sha256(token),
      userId,
      fullyAuthenticated,
      ipHash: hashIp(clientIp()),
      userAgent: clientUserAgent(),
      lastSeenAt: nowDate,
      expiresAt: idleExpiry(nowDate),
      absoluteExpiresAt: absoluteExpiry(nowDate),
      createdAt: nowDate,
    });

  cookies().set(sessionCookieName(), token, {
    httpOnly: true,
    secure: env.secureCookies,
    // "lax" so a normal top-level navigation to /admin keeps the session,
    // while a cross-site form POST does not carry it.
    sameSite: "lax",
    path: "/",
    maxAge: env.sessionAbsoluteHours * 3600,
  });

  return token;
}

/** Promotes a half-authenticated session once the second factor is satisfied. */
export async function markFullyAuthenticated(sessionId: string): Promise<void> {
  await db.update(sessions).set({ fullyAuthenticated: true }).where(eq(sessions.id, sessionId));
}

/**
 * Reads and validates the current session.
 *
 * `requireFullAuth` defaults to true: everything except the 2FA challenge
 * itself must refuse a session that has only cleared the password step.
 */
export async function getSession({
  requireFullAuth = true,
}: { requireFullAuth?: boolean } = {}): Promise<AuthenticatedSession | null> {
  const token = cookies().get(sessionCookieName())?.value;
  if (!token) return null;

  // No database means no way to validate a session. Returning null — rather
  // than letting the query throw — means /admin redirects to the login page,
  // where the 503 from `guard` explains what is actually missing. It also
  // fails *closed*: an unreachable database can never grant access.
  if (!isDatabaseConfigured()) return null;

  const row = await one(db
    .select()
    .from(sessions)
    .innerJoin(adminUsers, eq(sessions.userId, adminUsers.id))
    .where(eq(sessions.tokenHash, sha256(token))));

  if (!row) return null;

  const session = row.sessions;
  const user = row.admin_users;
  const nowDate = new Date();

  const invalid =
    session.revokedAt !== null ||
    session.expiresAt <= nowDate ||
    session.absoluteExpiresAt <= nowDate ||
    user.disabled;

  if (invalid) {
    // Revoke eagerly so an expired row can't be resurrected by a clock change.
    if (session.revokedAt === null) {
      await db.update(sessions).set({ revokedAt: nowDate }).where(eq(sessions.id, session.id));
    }
    return null;
  }

  if (requireFullAuth && !session.fullyAuthenticated) return null;

  // Slide the idle window, but never past the absolute deadline. Writing on
  // every request would be wasteful, so only refresh once a minute has passed.
  if (nowDate.getTime() - session.lastSeenAt.getTime() > 60_000) {
    const nextExpiry = new Date(
      Math.min(idleExpiry(nowDate).getTime(), session.absoluteExpiresAt.getTime()));
    await db.update(sessions)
      .set({ lastSeenAt: nowDate, expiresAt: nextExpiry })
      .where(eq(sessions.id, session.id));
  }

  return { session, user };
}

/** Revokes the caller's session and clears the cookie. */
export async function destroySession(): Promise<void> {
  const name = sessionCookieName();
  const token = cookies().get(name)?.value;

  if (token) {
    await db.update(sessions)
      .set({ revokedAt: new Date() })
      .where(eq(sessions.tokenHash, sha256(token)));
  }

  cookies().set(name, "", {
    httpOnly: true,
    secure: env.secureCookies,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Revokes every session for a user — the safety valve if a laptop goes
 * missing, and what a password change triggers automatically.
 */
export async function revokeAllSessions(
  userId: string,
  exceptSessionId?: string
): Promise<number> {
  const result = await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(sessions.userId, userId),
        isNull(sessions.revokedAt),
        exceptSessionId ? ne(sessions.id, exceptSessionId) : undefined
      )
    )
    .returning({ id: sessions.id });
  // better-sqlite3 reported affected rows on `.changes`; the Postgres driver
  // does not, so the count comes from RETURNING instead — which is exact
  // rather than driver-dependent.
  return result.length;
}

/** Housekeeping: drop rows that can no longer authenticate anything. */
export async function pruneExpiredSessions(): Promise<void> {
  const nowDate = new Date();
  const staleCutoff = new Date(nowDate.getTime() - 7 * 24 * 3600_000);
  try {
    await db.delete(sessions)
      .where(
        or(lt(sessions.absoluteExpiresAt, nowDate), lt(sessions.revokedAt, staleCutoff)));
  } catch {
    // Housekeeping must never break a request.
  }
}
