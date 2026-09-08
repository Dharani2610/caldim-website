import { NextResponse } from "next/server";
import { getAdminUsersCollection, toAdminUser } from "@/backend/db";
import { env } from "@/backend/env";
import { audit } from "@/backend/security/audit";
import { hashIp } from "@/backend/security/crypto";
import { verifyCsrf } from "@/backend/security/csrf";
import { jsonError, jsonOk } from "@/backend/security/guard";
import { burnPasswordCycle, verifyPassword } from "@/backend/security/password";
import { RULES, consume, reset } from "@/backend/security/rateLimit";
import { clientIp, createSession } from "@/backend/security/session";
import { totpRequiredFor } from "@/backend/security/totp";
import { loginSchema } from "@/backend/security/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Password step of admin sign-in.
 *
 * Every failure path is deliberately uniform — the same message, roughly the
 * same timing — whether the email is unknown, the password is wrong, or the
 * account is disabled. An attacker learns only "that didn't work", never
 * "that account exists but the password was wrong".
 */
const GENERIC_FAILURE = "Those credentials weren't recognised.";

export async function POST(request: Request) {
  const csrfFailure = verifyCsrf(request);
  if (csrfFailure) {
    await audit({ action: "csrf.rejected", outcome: "failure", entity: "/api/auth/login" });
    return jsonError("Request rejected. Reload the page and try again.", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Malformed request.", 400);
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return jsonError(GENERIC_FAILURE, 401);

  const { email, password, website } = parsed.data;

  // Honeypot: a real form leaves this empty. Answer as though it worked, so a
  // bot moves on instead of retrying against a differently named field.
  if (website) {
    await audit({
      action: "login.failure",
      outcome: "failure",
      actorInfo: email,
      meta: { reason: "honeypot" },
    });
    return jsonOk({ next: "/admin" });
  }

  const ipKey = hashIp(clientIp()) ?? "unknown-ip";

  // Rate limit before touching the database, keyed on both the address and the
  // account so neither dimension can be attacked in isolation.
  const [ipBudget, accountBudget] = await Promise.all([
    consume(RULES.login, `ip:${ipKey}`),
    consume(RULES.login, `email:${email}`),
  ]);
  const throttled = !ipBudget.allowed ? ipBudget : !accountBudget.allowed ? accountBudget : null;
  if (throttled) {
    await audit({ action: "login.rate_limited", outcome: "failure", actorInfo: email });
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(throttled.retryAfter) } });
  }

  const adminUsers = await getAdminUsersCollection();
  const userDoc = await adminUsers.findOne({ email });
  const user = userDoc ? toAdminUser(userDoc) : null;

  if (!user) {
    // Spend the ~50 ms an argon2 verification costs, so a missing account
    // can't be spotted by how fast the rejection comes back.
    await burnPasswordCycle(password);
    await audit({
      action: "login.failure",
      outcome: "failure",
      actorInfo: email,
      meta: { reason: "no_such_user" },
    });
    return jsonError(GENERIC_FAILURE, 401);
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await burnPasswordCycle(password);
    await audit({ action: "login.locked", outcome: "failure", userId: user.id, actorInfo: email });
    return jsonError(
      "This account is temporarily locked after repeated failed sign-ins. Try again shortly.",
      423);
  }

  const passwordOk = await verifyPassword(user.passwordHash, password);

  if (!passwordOk || user.disabled) {
    const attempts = user.failedAttempts + 1;
    const shouldLock = attempts >= env.maxLoginAttempts;

    await adminUsers.updateOne(
      { _id: user.id },
      {
        $set: {
          failedAttempts: shouldLock ? 0 : attempts,
          lockedUntil: shouldLock
            ? new Date(Date.now() + env.lockoutMinutes * 60_000)
            : user.lockedUntil,
          updatedAt: new Date(),
        },
      }
    );

    await audit({
      action: shouldLock ? "login.locked" : "login.failure",
      outcome: "failure",
      userId: user.id,
      actorInfo: email,
      meta: { reason: user.disabled ? "disabled" : "bad_password", attempts },
    });

    return jsonError(GENERIC_FAILURE, 401);
  }

  // Success — clear the failure counters for this account.
  await adminUsers.updateOne(
    { _id: user.id },
    {
      $set: {
        failedAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      },
    }
  );
  await Promise.all([reset(RULES.login, `email:${email}`), reset(RULES.login, `ip:${ipKey}`)]);

  const needsSecondFactor = totpRequiredFor(user);

  await createSession(user.id, { fullyAuthenticated: !needsSecondFactor });

  if (needsSecondFactor) {
    await audit({
      action: "login.success",
      userId: user.id,
      actorInfo: email,
      meta: { stage: "password_only" },
    });
    return jsonOk({
      next: user.totpEnabled ? "/admin/verify" : "/admin/security/two-factor",
      requiresTotp: true,
      enrolled: user.totpEnabled,
    });
  }

  await audit({
    action: "login.success",
    userId: user.id,
    actorInfo: email,
    meta: { stage: "complete" },
  });
  return jsonOk({
    next: user.mustChangePassword ? "/admin/security/password" : "/admin",
    requiresTotp: false,
    mustChangePassword: user.mustChangePassword,
  });
}

