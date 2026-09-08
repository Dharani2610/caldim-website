import { readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

/**
 * Applies pending migrations to Supabase.
 *
 * Migrations are a deploy step rather than something the app does at startup,
 * which is a deliberate change from the SQLite setup. On one local file,
 * migrating on boot was free and could not race. Against a hosted Postgres
 * with several server instances, boot-time migration means every instance
 * racing to take the same DDL lock on every cold start — so it runs once, on
 * purpose, from here.
 *
 * It connects over DIRECT_DATABASE_URL (port 5432). The pooler on 6543 runs in
 * transaction mode and hands connections between clients; DDL and the advisory
 * lock the migrator takes are per-connection state, so a migration over the
 * pooler can deadlock or apply half a change set.
 */

const url = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

if (!url) {
  console.error(
    "[migrate] No connection string.\n" +
      "          Set DIRECT_DATABASE_URL to the direct (port 5432) URI from\n" +
      "          Supabase → Project Settings → Database → Connection string."
  );
  process.exit(1);
}

if (url.includes(":6543")) {
  console.warn(
    "[migrate] DIRECT_DATABASE_URL points at the pooler (:6543).\n" +
      "          Use the direct connection on :5432 for migrations — see above."
  );
}

const folder = path.resolve("drizzle");

const files = (await readdir(folder).catch(() => [])).filter((f) => f.endsWith(".sql"));
if (files.length === 0) {
  console.error("[migrate] No .sql files in ./drizzle. Run `npm run db:generate` first.");
  process.exit(1);
}

// `max: 1` because the migrator must hold one connection for the whole run.
const ssl = process.env.DATABASE_SSL === "false" ? undefined : "require";
const sql = postgres(url, { max: 1, ssl, prepare: false, onnotice: () => {} });

try {
  console.log(`[migrate] applying ${files.length} migration file(s)…`);
  await migrate(drizzle(sql), { migrationsFolder: folder });
  console.log("[migrate] up to date.");
} catch (error) {
  console.error("[migrate] failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
