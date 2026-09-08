import type { Config } from "drizzle-kit";

/**
 * drizzle-kit reads this to generate SQL migrations from lib/db/schema.ts.
 *
 * Migrations connect *directly* to Postgres (port 5432), not through the
 * Supavisor pooler the app uses. DDL and advisory locks are connection state,
 * and transaction pooling hands connections between clients — so a migration
 * run over the pooler can deadlock or apply half a change set.
 */
export default {
  schema: "./backend/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
} satisfies Config;
