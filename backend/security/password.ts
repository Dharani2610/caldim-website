import "server-only";
import { hash, verify } from "@node-rs/argon2";
import { randomInt } from "node:crypto";

/**
 * Password hashing.
 *
 * argon2id at OWASP's recommended second-choice profile (19 MiB, t=2, p=1).
 * Memory-hard by construction, so a leaked hash costs an attacker RAM per
 * guess rather than the near-free parallelism a GPU gets against bcrypt/SHA.
 */
// Algorithm 2 is argon2id. The enum is a `const enum`, which `isolatedModules`
// (required by Next's SWC pipeline) can't inline, so the numeric value is used
// directly rather than importing it.
const ARGON2_OPTIONS = {
  algorithm: 2,
  memoryCost: 19456, // KiB
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, ARGON2_OPTIONS);
}

/**
 * Verifies a password. Any error (corrupt digest, wrong algorithm) is treated
 * as a failed match rather than propagating — a malformed row must not become
 * a 500 that tells an attacker the account exists.
 */
export async function verifyPassword(digest: string, plain: string): Promise<boolean> {
  try {
    return await verify(digest, plain, ARGON2_OPTIONS);
  } catch {
    return false;
  }
}

/**
 * A dummy digest verified against whenever the submitted email doesn't exist.
 * Without it, a missing account returns in ~1 ms while a real one takes ~50 ms,
 * which is enough to enumerate valid admin emails from the outside.
 */
let dummyDigest: string | null = null;

export async function burnPasswordCycle(plain: string): Promise<void> {
  if (!dummyDigest) {
    dummyDigest = await hashPassword("caldim-timing-equalizer-not-a-real-password");
  }
  await verifyPassword(dummyDigest, plain);
}

/** Characters that are trivially confusable — excluded from generated codes. */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRecoveryCode(): string {
  const pick = () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  const group = () => Array.from({ length: 5 }, pick).join("");
  return `${group()}-${group()}`;
}

export interface PasswordPolicyResult {
  ok: boolean;
  problems: string[];
}

/**
 * Length-first policy, per NIST SP 800-63B: a long passphrase beats a short
 * string with a symbol bolted on. We check length and a small blocklist rather
 * than demanding a character-class zoo that pushes people toward "Passw0rd!".
 */
const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "12345678",
  "123456789",
  "qwertyuiop",
  "letmein123",
  "administrator",
  "caldim123",
  "caldimengineering",
  "changeme123",
  "welcome123",
  "iloveyou1",
]);

export function checkPasswordPolicy(
  password: string,
  context: { email?: string; name?: string } = {}
): PasswordPolicyResult {
  const problems: string[] = [];
  const value = password.normalize("NFKC");

  if (value.length < 12) problems.push("Use at least 12 characters.");
  if (value.length > 200) problems.push("Keep it under 200 characters.");
  if (/^\s|\s$/.test(password)) problems.push("Remove leading or trailing spaces.");

  const lower = value.toLowerCase();
  if (COMMON_PASSWORDS.has(lower)) problems.push("That password is on the common-password blocklist.");

  const localPart = context.email?.split("@")[0]?.toLowerCase();
  if (localPart && localPart.length > 3 && lower.includes(localPart)) {
    problems.push("Don't include your email address.");
  }
  if (context.name) {
    for (const part of context.name.toLowerCase().split(/\s+/)) {
      if (part.length > 3 && lower.includes(part)) {
        problems.push("Don't include your own name.");
        break;
      }
    }
  }

  // A single repeated character or a straight run has almost no entropy
  // regardless of how long it is.
  if (/^(.)\1+$/.test(value)) problems.push("Don't repeat a single character.");
  if (new Set(value).size < 6) problems.push("Use a wider mix of characters.");

  return { ok: problems.length === 0, problems: Array.from(new Set(problems)) };
}
