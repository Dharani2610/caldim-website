/**
 * Environment preflight.
 *
 * Run this first when something won't start. It reports what the app found
 * rather than what it expected, which is usually enough to see the problem
 * without reading a stack trace.
 *
 *   npm run doctor
 */
import { existsSync } from "node:fs";
import path from "node:path";

const ok = (m) => console.log(`  ✓ ${m}`);
const bad = (m) => console.log(`  ✗ ${m}`);
const note = (m) => console.log(`      ${m}`);

let failures = 0;

console.log("\n  Caldim Engineering — environment check\n");

// ── Node ──────────────────────────────────────────────────────────────────
const [major, minor] = process.versions.node.split(".").map(Number);
if (major > 22 || (major === 22 && minor >= 5)) {
  ok(`Node ${process.versions.node}`);
} else {
  failures += 1;
  bad(`Node ${process.versions.node} is too old`);
  note("Install Node 22 LTS or newer from https://nodejs.org");
}


// ── Configuration ─────────────────────────────────────────────────────────
if (existsSync(".env")) {
  ok(".env present");

  const required = ["SESSION_SECRET", "APP_ENCRYPTION_KEY", "IP_HASH_SALT"];
  const missing = required.filter((key) => !process.env[key]?.trim());

  if (missing.length === 0) {
    ok("secrets set");
  } else if (process.env.NODE_ENV === "production") {
    failures += 1;
    bad(`missing secrets: ${missing.join(", ")}`);
    note('Generate each with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"');
  } else {
    ok(`secrets: ${missing.length} unset — development will generate temporary ones`);
  }
} else {
  failures += 1;
  bad(".env missing");
  note("Copy the template:  cp .env.example .env    (Windows: copy .env.example .env)");
}

// ── Migrations ────────────────────────────────────────────────────────────
if (existsSync(path.resolve("drizzle")) && existsSync(path.resolve("drizzle/meta"))) {
  ok("migrations present");
} else {
  failures += 1;
  bad("migrations missing");
  note("Run: npm run db:generate");
}

// ── Cloudinary ────────────────────────────────────────────────────────────
const cloudinaryKeys = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
const missingCloudinary = cloudinaryKeys.filter((key) => !process.env[key]?.trim());

if (missingCloudinary.length === 0) {
  ok(`Cloudinary configured (cloud: ${process.env.CLOUDINARY_CLOUD_NAME})`);
} else {
  failures += 1;
  bad(`Cloudinary not configured: ${missingCloudinary.join(", ")}`);
  note("Cloudinary console → Settings → API Keys. Media uploads will fail without these.");
}

// ── Outbound SMTP (Optional) ──────────────────────────────────────────────
const smtpKeys = ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM_EMAIL"];
const setSmtpKeys = smtpKeys.filter((key) => process.env[key]?.trim());
if (setSmtpKeys.length === smtpKeys.length) {
  ok(`SMTP email configured (host: ${process.env.SMTP_HOST})`);
} else if (setSmtpKeys.length > 0) {
  note(`SMTP email partially configured (missing: ${smtpKeys.filter((k) => !process.env[k]?.trim()).join(", ")})`);
} else {
  note("SMTP email not configured (optional — RFQ notification emails will be skipped)");
}

// ── Database ──────────────────────────────────────────────────────────────
const dbUrl = process.env.DATABASE_URL?.trim();

if (!dbUrl) {
  failures += 1;
  bad("DATABASE_URL is not set");
  note("Supabase → Project Settings → Database → Connection string → URI");
  note("Use the pooled connection (port 6543) here.");
} else if (!/^postgres(ql)?:\/\//.test(dbUrl)) {
  failures += 1;
  bad("DATABASE_URL is not a Postgres connection string");
  note("This project moved from SQLite to Supabase Postgres. A file: URL no longer works.");
} else {
  if (dbUrl.includes(":5432")) {
    note("DATABASE_URL points at the direct connection (:5432).");
    note("The app should use the pooler on :6543; keep :5432 in DIRECT_DATABASE_URL.");
  }

  try {
    const { openDatabase } = await import("./db.mjs");
    const sql = openDatabase();
    try {
      const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM admin_users`;
      ok("connected to Supabase");
      if (n > 0) ok(`${n} admin account(s)`);
      else {
        failures += 1;
        bad("no admin account — run: npm run db:seed");
      }
    } finally {
      await sql.end({ timeout: 5 });
    }
  } catch (error) {
    failures += 1;
    if (/relation .* does not exist/i.test(error.message)) {
      bad("connected, but the schema is missing — run: npm run db:migrate");
    } else {
      bad(`could not reach the database: ${error.message}`);
    }
  }
}

console.log(
  failures === 0
    ? "\n  Everything looks fine. Start with: npm run dev\n"
    : `\n  ${failures} problem(s) above. Fix those, then run npm run doctor again.\n`
);

process.exit(failures === 0 ? 0 : 1);
