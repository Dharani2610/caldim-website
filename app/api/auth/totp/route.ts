import { NextResponse } from "next/server";
import { audit } from "@/backend/security/audit";
import { hashIp } from "@/backend/security/crypto";
import { verifyCsrf } from "@/backend/security/csrf";
import { jsonError, jsonOk } from "@/backend/security/guard";
import { RULES, consume, reset } from "@/backend/security/rateLimit";
import {
  clientIp,
  getSession,
  markFullyAuthenticated,
  revokeAllSessions,
} from "@/backend/security/session";
import { decryptSecret, redeemRecoveryCode, verifyTotpCode } from "@/backend/security/totp";
import { totpChallengeSchema } from "@/backend/security/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Second factor at sign-in.
 *
 * Only reachable with a session that has already cleared the password step.
 * Six digits is one-in-a-million per guess, so the real defence is volume
 * control: eight attempts, then a fifteen-minute block, tracked per account
 * and per address.
 */
export async function POST(request: Request) {
  if (verifyCsrf(request)) {
    return jsonError("Request rejected. Reload the page and try again.", 403);
  }

  const auth = await getSession({ requireFullAuth: false });
  if (!auth) return jsonError("Your sign-in expired. Start again.", 401);

  const { user, session } = auth;
  if (session.fullyAuthenticated) return jsonOk({ next: "/admin" });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Malformed request.", 400);
  }

  const parsed = totpChallengeSchema.safeParse(body);
  if (!parsed.success) return jsonError("Enter the 6-digit code from your authenticator app.", 400);

  const ipKey = hashIp(clientIp()) ?? "unknown-ip";
  const [byUser, byIp] = await Promise.all([
    consume(RULES.totp, `user:${user.id}`),
    consume(RULES.totp, `ip:${ipKey}`),
  ]);
  const throttled = !byUser.allowed ? byUser : !byIp.allowed ? byIp : null;
  if (throttled) {
    await audit({
      action: "totp.challenge.failure",
      outcome: "failure",
      userId: user.id,
      meta: { reason: "rate_limited" },
    });
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(throttled.retryAfter) } });
  }

  let accepted = false;
  let usedRecovery = false;

  if (parsed.data.mode === "recovery") {
    accepted = await redeemRecoveryCode(user, parsed.data.code);
    usedRecovery = accepted;
  } else if (user.totpSecret) {
    const secret = decryptSecret(user.totpSecret);
    accepted = secret ? verifyTotpCode(secret, parsed.data.code) : false;
  }

  if (!accepted) {
    await audit({
      action: "totp.challenge.failure",
      outcome: "failure",
      userId: user.id,
      actorInfo: user.email,
      meta: { mode: parsed.data.mode },
    });
    return jsonError("That code wasn't accepted. Check your authenticator and try again.", 401);
  }

  markFullyAuthenticated(session.id);
  await Promise.all([reset(RULES.totp, `user:${user.id}`), reset(RULES.totp, `ip:${ipKey}`)]);

  if (usedRecovery) {
    // A recovery code means the authenticator is gone. Drop every other
    // session, so a device the user can no longer reach isn't left signed in.
    revokeAllSessions(user.id, session.id);
    await audit({ action: "totp.recovery_used", userId: user.id, actorInfo: user.email });
  }

  await audit({ action: "totp.challenge.success", userId: user.id, actorInfo: user.email });

  return jsonOk({
    next: user.mustChangePassword ? "/admin/security/password" : "/admin",
    usedRecovery,
  });
}
