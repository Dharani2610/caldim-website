import "server-only";
import { randomBytes } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/backend/env";
import * as schema from "@/backend/db/schema";

export * from "@/backend/db/schema";

/**
 * Supabase Postgres, over postgres-js.
 *
 * Two things about this connection are worth knowing before changing it.
 *
 * **Use the pooler.** Supabase gives you a direct connection on port 5432 and
 * a Supavisor pooler on 6543. Next runs many short-lived server contexts, and
 * a direct connection per context exhausts Postgres' connection slots quickly.
 * The pooled URI is what belongs in DATABASE_URL for the app; the direct URI
 * is only needed for migrations, which is why they are a separate script.
 *
 * **Prepared statements are off.** Supavisor runs in transaction mode, where a
 * connection is handed to whichever transaction needs it next. Named prepared
 * statements are per-connection state, so under transaction pooling they leak
 * across clients and fail with "prepared statement already exists". Passing
 * `prepare: false` makes postgres-js send unnamed statements, which are still
 * parameterised — the SQL-injection protection is unchanged, only the
 * server-side plan cache is given up.
 */

const globalForDb = globalThis as unknown as {
  __caldimSql?: ReturnType<typeof postgres>;
  __caldimDb?: ReturnType<typeof createClient>;
};

/** Thrown when there is no connection string at all, as opposed to one that
 *  fails to connect. Callers use it to tell "not set up yet" from "down". */
export class DatabaseNotConfigured extends Error {
  constructor() {
    super(
      "DATABASE_URL is not set. Copy the pooled connection string from " +
        "Supabase → Project Settings → Database → Connection string → URI, " +
        "then put it in .env. Run `npm run doctor` to check."
    );
    this.name = "DatabaseNotConfigured";
  }
}

export function isDatabaseConfigured(): boolean {
  return Boolean(env.databaseUrl);
}

function createSql() {
  if (!env.databaseUrl) throw new DatabaseNotConfigured();

  return postgres(env.databaseUrl, {
    // Supabase terminates TLS at the pooler with its own certificate chain.
    ssl: env.databaseSsl ? "require" : undefined,
    max: env.databasePoolMax,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
    onnotice: () => undefined,
  });
}

type DbClient = ReturnType<typeof drizzle<typeof schema>>;

function createClient(): DbClient {
  const sql = globalForDb.__caldimSql ?? createSql();
  globalForDb.__caldimSql = sql;
  return drizzle(sql, { schema });
}

/**
 * One handle per process, created on first use rather than on import.
 *
 * The laziness is the point, not an optimisation. Connecting at module scope
 * meant that importing this file with no DATABASE_URL threw during evaluation
 * — before any caller's try/catch existed to catch it — so a missing
 * connection string took the whole homepage down with a 500 instead of
 * falling back to the shipped content the way it was designed to. Deferring
 * the connection to the first property access moves the failure inside the
 * caller's try block, where it can be handled.
 *
 * Caching also matters: Next re-evaluates modules on every hot reload, so
 * without it each edit would open another pool until Postgres refused new
 * connections.
 */
function resolveDb(): DbClient {
  if (!globalForDb.__caldimDb) globalForDb.__caldimDb = createClient();
  return globalForDb.__caldimDb;
}

export const db = new Proxy({} as DbClient, {
  get(_target, property) {
    const client = resolveDb() as unknown as Record<string | symbol, unknown>;
    const value = client[property];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

/**
 * Collision-resistant, sortable id.
 *
 * The timestamp prefix keeps rows roughly insertion-ordered on disk (good for
 * a B-tree primary key), and 12 random bytes make guessing the id of a record
 * you weren't shown infeasible — which matters because ids appear in URLs.
 */
export function newId(): string {
  return Date.now().toString(36) + randomBytes(12).toString("hex");
}

/**
 * First row of a query, or `undefined`.
 *
 * SQLite's driver had `.get()` for this. The Postgres driver always resolves
 * to an array, and `(await query)[0]` at sixty call sites reads worse than a
 * name — particularly where the query is already several lines long.
 */
export async function one<T>(query: PromiseLike<T[]>): Promise<T | undefined> {
  const rows = await query;
  return rows[0];
}
