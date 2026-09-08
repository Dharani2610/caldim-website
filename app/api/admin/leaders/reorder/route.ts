import { revalidatePath } from "next/cache";
import { eq, inArray } from "drizzle-orm";
import { db, leaders } from "@/backend/db";
import { audit } from "@/backend/security/audit";
import { guard, jsonError, jsonOk } from "@/backend/security/guard";
import { RULES } from "@/backend/security/rateLimit";
import { leaderReorderSchema } from "@/backend/security/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Persists a drag-and-drop reorder of the leadership grid. */
export async function POST(request: Request) {
  const gate = await guard(request, { rateLimit: RULES.adminWrite });
  if (!gate.ok) return gate.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Malformed request.", 400);
  }

  const parsed = leaderReorderSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid ordering.", 400);

  const ids = parsed.data.order;
  if (ids.length === 0) return jsonOk({ order: [] });

  const known = await db
    .select({ id: leaders.id })
    .from(leaders)
    .where(inArray(leaders.id, ids));

  // Every id must resolve to a real row. A partial match means the client is
  // out of date (or making things up) — either way, we don't guess.
  if (known.length !== ids.length) {
    return jsonError("The list is out of date. Refresh and try again.", 409);
  }

  // One transaction, so a failure halfway through can't leave the grid in a
  // half-reordered state. Postgres runs this as a real BEGIN/COMMIT; the
  // updates are sequential rather than concurrent so they share the one
  // connection the transaction holds.
  await db.transaction(async (tx) => {
    for (let index = 0; index < ids.length; index += 1) {
      const id = ids[index];
      await tx
        .update(leaders)
        .set({ sortOrder: index, updatedAt: new Date() })
        .where(eq(leaders.id, id));
    }
  });

  await audit({
    action: "leader.reordered",
    userId: gate.user.id,
    actorInfo: gate.user.email,
    entity: "Leader",
    meta: { count: ids.length },
  });

  revalidatePath("/");
  return jsonOk({ order: ids });
}
