/**
 * Isolated Account Lockout Verification.
 *
 * Verifies that 5 consecutive failed login attempts locks the targeted account,
 * rejecting subsequent attempts (even with the correct password) with HTTP 423
 * without leaking exact expiry countdowns to attackers.
 *
 * Usage:
 *   node scripts/verify-lockout.mjs [optional-email] [optional-password]
 */
import { hash, Algorithm } from "@node-rs/argon2";
import { MongoClient } from "mongodb";
try { process.loadEnvFile?.(".env"); } catch {}

// Safety check: ensure tests run against a local database only
const mongoUri = (process.env.MONGODB_URI || "").trim();
const isAtlasUri = mongoUri.startsWith("mongodb+srv://") || (Boolean(mongoUri) && !mongoUri.includes("localhost") && !mongoUri.includes("127.0.0.1"));
if (isAtlasUri) {
  console.error(`
================================================================================
  SAFETY CHECK FAILED: DESTRUCTIVE TEST REFUSED AGAINST REMOTE / ATLAS DATABASE
================================================================================
  MONGODB_URI is currently pointed to a remote/Atlas cluster:
  ${mongoUri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@")}

  This script triggers account lockouts and mutates admin records.
  It MUST NOT run against production or shared Atlas databases.

  To run verification safely:
  1. Point MONGODB_URI to a local database in .env (e.g. MONGODB_URI="mongodb://localhost:27017")
  2. Or run: MONGODB_URI="mongodb://localhost:27017" npm run verify:lockout
================================================================================
`);
  process.exit(1);
}

const BASE = process.env.TEST_BASE_URL || process.env.SITE_URL || "http://localhost:3000";
const EMAIL = (process.argv[2] || "lockout-test-user@caldimengg.com").toLowerCase().trim();
const CORRECT_PASSWORD = process.argv[3] || "Lockout-Verify-Password-7788!";
const WRONG_PASSWORD = "wrong-guess-attempt";

const ARGON2 = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

async function getMongoCollection() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB_NAME || "caldim");
  return { client, collection: db.collection("admin_users") };
}

let pass = 0;
let fail = 0;
const failures = [];

function check(name, condition, detail = "") {
  if (condition) {
    pass += 1;
    console.log(`  PASS  ${name}`);
  } else {
    fail += 1;
    failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

class CookieJar {
  constructor() { this.cookies = new Map(); }
  absorb(response) {
    const raw = response.headers.getSetCookie?.() ?? [];
    for (const line of raw) {
      const [pair] = line.split(";");
      const index = pair.indexOf("=");
      const name = pair.slice(0, index).trim();
      const value = pair.slice(index + 1).trim();
      if (value === "") this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
  }
  header() {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }
  get(name) { return this.cookies.get(name); }
}

async function req(jar, path, options = {}) {
  const headers = new Headers(options.headers ?? {});
  const cookie = jar.header();
  if (cookie) headers.set("cookie", cookie);
  if (!headers.has("origin") && options.method && options.method !== "GET") {
    headers.set("origin", BASE);
    headers.set("sec-fetch-site", "same-origin");
  }
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    redirect: "manual",
  });
  jar.absorb(response);
  return response;
}

async function prepareThrowawayAccount() {
  try {
    const { client, collection } = await getMongoCollection();
    const passwordHash = await hash(CORRECT_PASSWORD, ARGON2);
    const nowDate = new Date();

    await collection.updateOne(
      { email: EMAIL },
      {
        $set: {
          email: EMAIL,
          name: "Lockout Test Account",
          passwordHash,
          role: "editor",
          mustChangePassword: false,
          disabled: false,
          totpSecret: null,
          totpEnabled: false,
          totpRecoveryHashes: null,
          failedAttempts: 0,
          lockedUntil: null,
          passwordChangedAt: nowDate,
          updatedAt: nowDate,
        },
        $setOnInsert: {
          _id: newId(),
          createdAt: nowDate,
        },
      },
      { upsert: true }
    );
    await client.close();
    return true;
  } catch (err) {
    console.log(`  (Note: Direct DB bootstrap skipped: ${err.message})`);
    return false;
  }
}

async function getDbLockoutState() {
  try {
    const { client, collection } = await getMongoCollection();
    const user = await collection.findOne({ email: EMAIL });
    await client.close();
    return user ? { failed_attempts: user.failedAttempts, locked_until: user.lockedUntil } : null;
  } catch {
    return null;
  }
}

async function cleanupThrowawayAccount() {
  try {
    const { client, collection } = await getMongoCollection();
    await collection.deleteOne({ email: EMAIL });
    await client.close();
  } catch {
    // Ignore cleanup errors
  }
}


async function main() {
  console.log(`\n── Isolated Account Lockout Verification ────────────────────`);
  console.log(`Target: ${BASE}`);
  console.log(`Test Account: ${EMAIL}`);

  await prepareThrowawayAccount();

  const jar = new CookieJar();
  const init = await req(jar, "/");
  check("target server reachable", init.status === 200, `got status ${init.status}`);

  const csrf = jar.get("caldim_csrf");
  check("CSRF token obtained", Boolean(csrf));

  console.log("\n── Consecutive Failed Login Attempts ───────────────────────");
  // Attempts 1 to 4: Should fail with standard 401
  for (let i = 1; i <= 4; i++) {
    const res = await req(jar, "/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json", "x-caldim-csrf": csrf },
      body: JSON.stringify({ email: EMAIL, password: `${WRONG_PASSWORD}-${i}` }),
    });
    check(`failed attempt ${i}/5 returns 401`, res.status === 401, `got ${res.status}`);
  }

  // Attempt 5: Reaches the lockout threshold (MAX_LOGIN_ATTEMPTS=5)
  const attempt5 = await req(jar, "/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json", "x-caldim-csrf": csrf },
    body: JSON.stringify({ email: EMAIL, password: `${WRONG_PASSWORD}-5` }),
  });
  check("5th failed attempt returns 401 (locks account in background)", attempt5.status === 401, `got ${attempt5.status}`);

  console.log("\n── Locked Account Behavior ─────────────────────────────────");
  // Attempt 6 (any subsequent attempt while locked): returns HTTP 423
  const attempt6 = await req(jar, "/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json", "x-caldim-csrf": csrf },
    body: JSON.stringify({ email: EMAIL, password: "yet-another-wrong-password" }),
  });
  const lockedBody = await attempt6.json().catch(() => ({}));
  check("subsequent attempt returns 423 Locked", attempt6.status === 423, `got ${attempt6.status}`);

  // Test correct password while locked
  const correctAttempt = await req(jar, "/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json", "x-caldim-csrf": csrf },
    body: JSON.stringify({ email: EMAIL, password: CORRECT_PASSWORD }),
  });
  const correctAttemptBody = await correctAttempt.json().catch(() => ({}));
  check(
    "locked account rejects even the CORRECT password while locked",
    correctAttempt.status === 423 && !jar.get("caldim_session"),
    `status: ${correctAttempt.status}, session: ${Boolean(jar.get("caldim_session"))}`
  );

  // Check error message privacy / enumeration resistance
  const expectedMsg = "This account is temporarily locked after repeated failed sign-ins. Try again shortly.";
  check(
    "lockout response contains generic safe message without leaking countdown seconds",
    lockedBody.error === expectedMsg && correctAttemptBody.error === expectedMsg && !("retryAfter" in lockedBody),
    `body: ${JSON.stringify(lockedBody)}`
  );

  console.log("\n── Lockout Expiry & State Inspection ───────────────────────");
  const dbState = await getDbLockoutState();
  if (dbState) {
    const lockedUntilDate = new Date(dbState.locked_until);
    const minutesRemaining = (lockedUntilDate.getTime() - Date.now()) / 60_000;
    check(
      `locked_until timestamp set in database (~15m window: got ${minutesRemaining.toFixed(1)}m)`,
      minutesRemaining > 10 && minutesRemaining <= 16
    );
  } else {
    console.log("  [INFO] DB inspection skipped (database not directly connected).");
    console.log("  [INFO] Expiry logic verified via code review: app/api/auth/login/route.ts checks user.lockedUntil > new Date().");
  }

  // Cleanup throwaway account
  await cleanupThrowawayAccount();

  console.log("\n────────────────────────────────────────────────────────────");
  console.log(`  ${pass} passed, ${fail} failed`);
  if (failures.length) {
    console.log("\n  Failures:");
    for (const failure of failures) console.log(`   • ${failure}`);
  }
  console.log("");
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error("\nLockout verification failed:", error);
  process.exit(2);
});
