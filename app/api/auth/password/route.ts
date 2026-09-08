import { eq } from "drizzle-orm";
import { adminUsers, db } from "@/backend/db";
import { audit } from "@/backend/security/audit";
import { verifyCsrf } from "@/backend/security/csrf";
import { jsonError, jsonOk } from "@/backend/security/guard";
import { checkPasswordPolicy, hashPassword, verifyPassword } from "@/backend/security/password";
import { RULES, consume } from "@/backend/security/rateLimit";
import { getSession, revokeAllSessions } from "@/backend/security/session";
import { fieldErrors, passwordChangeSchema } from "@/backend/security/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Password change.
 *
 * Requires the current password even though the caller is already signed in.
 * Session hijacking and unattended laptops both stop here: holding a session
 * is not, on its own, permission to change the credential that created it.
 */
export async function POST(request: Request) {
  if (verifyCsrf(request)) {
    return jsonError("Request rejected. Reload the page and try again.", 403);
  }

  // A half-authenticated session is allowed through, because a freshly seeded
  // account is sent straight here to replace its temporary password.
  const auth = await getSession({ requireFullAuth: false });
  if (!auth) return jsonError("Sign in to continue.", 401);

  const budget = await consume(RULES.passwordChange, `user:${auth.user.id}`);
  if (!budget.allowed) return jsonError("Too many attempts. Try again shortly.", 429);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Malformed request.", 400);
  }

  const parsed = passwordChangeSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Check the fields below.", 400, { fields: fieldErrors(parsed.error) });
  }

  const { currentPassword, newPassword } = parsed.data;

  if (!(await verifyPassword(auth.user.passwordHash, currentPassword))) {
    await audit({ action: "password.changed", outcome: "failure", userId: auth.user.id });
    return jsonError("Your current password wasn't recognised.", 401, {
      fields: { currentPassword: "That's not your current password." },
    });
  }

  const policy = checkPasswordPolicy(newPassword, {
    email: auth.user.email,
    name: auth.user.name,
  });
  if (!policy.ok) {
    return jsonError(policy.problems[0], 400, {
      fields: { newPassword: policy.problems.join(" ") },
    });
  }

  await db.update(adminUsers)
    .set({
      passwordHash: await hashPassword(newPassword),
      mustChangePassword: false,
      passwordChangedAt: new Date(),
      failedAttempts: 0,
      lockedUntil: null,
      updatedAt: new Date(),
    })
    .where(eq(adminUsers.id, auth.user.id));

  // Every other session was authorised by the old password, so none survive
  // the change. The current one is kept so the user isn't ejected mid-task.
  const revoked = revokeAllSessions(auth.user.id, auth.session.id);

  await audit({
    action: "password.changed",
    userId: auth.user.id,
    actorInfo: auth.user.email,
    meta: { revokedSessions: revoked },
  });

  return jsonOk({ revokedSessions: revoked, next: "/admin" });
}
