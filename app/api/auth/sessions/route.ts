import { getSessionsCollection } from "@/backend/db";
import { audit } from "@/backend/security/audit";
import { guard, jsonOk } from "@/backend/security/guard";
import { revokeAllSessions } from "@/backend/security/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Lists the caller's live sessions, so they can spot one they don't recognise. */
export async function GET(request: Request) {
  const gate = await guard(request, { csrf: false });
  if (!gate.ok) return gate.response;

  const sessions = await getSessionsCollection();
  const rows = await sessions
    .find({
      userId: gate.user.id,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    })
    .sort({ lastSeenAt: -1 })
    .toArray();

  return jsonOk({
    sessions: rows.map((row) => ({
      id: row._id,
      userAgent: row.userAgent,
      lastSeenAt: row.lastSeenAt,
      createdAt: row.createdAt,
      absoluteExpiresAt: row.absoluteExpiresAt,
      current: row._id === gate.session.id,
    })),
  });
}

/** "Sign out everywhere else" — the control to reach for after losing a device. */
export async function DELETE(request: Request) {
  const gate = await guard(request);
  if (!gate.ok) return gate.response;

  const revoked = await revokeAllSessions(gate.user.id, gate.session.id);
  await audit({
    action: "sessions.revoked",
    userId: gate.user.id,
    actorInfo: gate.user.email,
    meta: { count: revoked },
  });

  return jsonOk({ revoked });
}

