import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { db, sessions } from "@/backend/db";
import { audit } from "@/backend/security/audit";
import { guard, jsonOk } from "@/backend/security/guard";
import { revokeAllSessions } from "@/backend/security/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Lists the caller's live sessions, so they can spot one they don't recognise. */
export async function GET(request: Request) {
  const gate = await guard(request, { csrf: false });
  if (!gate.ok) return gate.response;

  const rows = await db
    .select({
      id: sessions.id,
      userAgent: sessions.userAgent,
      lastSeenAt: sessions.lastSeenAt,
      createdAt: sessions.createdAt,
      absoluteExpiresAt: sessions.absoluteExpiresAt,
    })
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, gate.user.id),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, new Date())
      )
    )
    .orderBy(desc(sessions.lastSeenAt));

  return jsonOk({
    sessions: rows.map((row) => ({ ...row, current: row.id === gate.session.id })),
  });
}

/** "Sign out everywhere else" — the control to reach for after losing a device. */
export async function DELETE(request: Request) {
  const gate = await guard(request);
  if (!gate.ok) return gate.response;

  const revoked = revokeAllSessions(gate.user.id, gate.session.id);
  await audit({
    action: "sessions.revoked",
    userId: gate.user.id,
    actorInfo: gate.user.email,
    meta: { count: revoked },
  });

  return jsonOk({ revoked });
}
