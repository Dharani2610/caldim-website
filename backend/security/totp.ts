import "server-only";
import { authenticator } from "otplib";
import { getAdminUsersCollection, type AdminUserDoc } from "@/backend/db";
import { env } from "@/backend/env";
import { decrypt, encrypt } from "@/backend/security/crypto";
import { generateRecoveryCode, hashPassword, verifyPassword } from "@/backend/security/password";

export type AdminUser = AdminUserDoc & { id: string };

/**
 * Time-based one-time passwords (RFC 6238) — the second factor for admin
 * sign-in. Works with any authenticator app; deliberately not SMS, which is
 * the weakest second factor in common use.
 */

// A one-step window either side absorbs clock drift between the server and the
// phone without meaningfully widening the guessing window.
authenticator.options = { window: 1, step: 30, digits: 6 };

export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

/** The otpauth:// URI an authenticator app scans. */
export function totpUri(secret: string, accountEmail: string): string {
  return authenticator.keyuri(accountEmail, "Caldim Engineering Admin", secret);
}

export function verifyTotpCode(secret: string, token: string): boolean {
  const cleaned = token.replace(/\D/g, "");
  if (cleaned.length !== 6) return false;
  try {
    return authenticator.check(cleaned, secret);
  } catch {
    return false;
  }
}

/** Secrets are stored encrypted and only decrypted to check a single code. */
export function encryptSecret(secret: string): string {
  return encrypt(secret);
}

export function decryptSecret(stored: string): string | null {
  try {
    return decrypt(stored);
  } catch {
    return null;
  }
}



export interface RecoveryCodeBundle {
  /** Plaintext codes — shown to the user exactly once, never stored. */
  codes: string[];
  /** argon2id digests array. */
  hashes: string[];
  /** argon2id digests, serialised for JSON storage if needed. */
  serialisedHashes: string;
}

export async function generateRecoveryCodes(count = 10): Promise<RecoveryCodeBundle> {
  const codes = Array.from({ length: count }, generateRecoveryCode);
  const hashes = await Promise.all(codes.map((code) => hashPassword(code)));
  return { codes, hashes, serialisedHashes: JSON.stringify(hashes) };
}

/**
 * Checks a recovery code and, on a match, burns it. Codes are single-use: an
 * intercepted code is worthless the moment it has been redeemed.
 */
export async function redeemRecoveryCode(user: AdminUser, submitted: string): Promise<boolean> {
  if (!user.totpRecoveryHashes) return false;

  let hashes: string[];
  if (Array.isArray(user.totpRecoveryHashes)) {
    hashes = user.totpRecoveryHashes;
  } else if (typeof user.totpRecoveryHashes === "string") {
    try {
      hashes = JSON.parse(user.totpRecoveryHashes);
    } catch {
      return false;
    }
  } else {
    return false;
  }
  if (!Array.isArray(hashes) || hashes.length === 0) return false;

  const normalised = submitted.trim().toUpperCase();

  for (let i = 0; i < hashes.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    if (await verifyPassword(hashes[i], normalised)) {
      const remaining = hashes.filter((_, index) => index !== i);
      const adminUsers = await getAdminUsersCollection();
      await adminUsers.updateOne(
        { _id: user.id },
        { $set: { totpRecoveryHashes: remaining, updatedAt: new Date() } }
      );
      return true;
    }
  }
  return false;
}

/**
 * Whether this account still owes a second factor. With REQUIRE_TOTP on, an
 * account that hasn't enrolled is pushed through enrolment before it can reach
 * anything else.
 */
export function totpRequiredFor(user: AdminUser): boolean {
  return user.totpEnabled || env.requireTotp;
}

