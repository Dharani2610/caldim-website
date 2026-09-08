/**
 * Shared database bootstrap for the CLI scripts.
 *
 * The scripts run outside Next, so they open their own connection. They talk
 * raw SQL through postgres-js rather than building a Drizzle instance: these
 * are short, one-shot administrative tasks, and tagged-template SQL is both
 * parameterised and easier to read than a query builder for a single INSERT.
 *
 * Migrations are *not* applied here — that is `npm run db:migrate`, over the
 * direct connection. See scripts/migrate.mjs for why.
 */
import { randomBytes } from "node:crypto";
import postgres from "postgres";

export function openDatabase() {
  const url = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy the connection string from\n" +
        "  Supabase → Project Settings → Database → Connection string → URI"
    );
  }

  return postgres(url, {
    max: 1,
    ssl: process.env.DATABASE_SSL === "false" ? undefined : "require",
    prepare: false,
    onnotice: () => {},
  });
}

/** Matches lib/db's id format: sortable timestamp prefix + 96 random bits. */
export function newId() {
  return Date.now().toString(36) + randomBytes(12).toString("hex");
}
