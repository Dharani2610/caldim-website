import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { contentBlocks, db } from "@/backend/db";
import { getContentBlocks } from "@/backend/content/getSiteContent";
import { audit } from "@/backend/security/audit";
import { guard, jsonError, jsonOk } from "@/backend/security/guard";
import { RULES } from "@/backend/security/rateLimit";
import { contentBlockSchemas, fieldErrors, isContentBlockKey } from "@/backend/security/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Returns the effective content — stored overrides layered over defaults. */
export async function GET(request: Request) {
  const gate = await guard(request, { csrf: false });
  if (!gate.ok) return gate.response;
  return jsonOk({ content: await getContentBlocks() });
}

/**
 * Saves one content block.
 *
 * The key is checked against the schema map before anything else, so this
 * endpoint can only ever write the handful of rows the site knows how to
 * render — it is not a general-purpose "write anything into the database"
 * hole. The value is then parsed by that key's schema, and it is the *parsed*
 * output that gets stored, so anything extra a client sent is dropped rather
 * than persisted.
 */
export async function PUT(request: Request) {
  const gate = await guard(request, { rateLimit: RULES.adminWrite });
  if (!gate.ok) return gate.response;

  let body: { key?: unknown; value?: unknown };
  try {
    body = (await request.json()) as { key?: unknown; value?: unknown };
  } catch {
    return jsonError("Malformed request.", 400);
  }

  if (typeof body.key !== "string" || !isContentBlockKey(body.key)) {
    return jsonError("Unknown content section.", 400);
  }

  const parsed = contentBlockSchemas[body.key].safeParse(body.value);
  if (!parsed.success) {
    return jsonError("Some fields need fixing before this can be saved.", 400, {
      fields: fieldErrors(parsed.error),
    });
  }

  const value = parsed.data;
  const nowDate = new Date();

  const { getContentBlocksCollection } = await import("@/backend/db");
  const contentCol = await getContentBlocksCollection();
  await contentCol.updateOne(
    { _id: body.key },
    {
      $set: { value, updatedById: gate.user.id, updatedAt: nowDate },
      $setOnInsert: { createdAt: nowDate },
    },
    { upsert: true }
  );

  await audit({
    action: "content.updated",
    userId: gate.user.id,
    actorInfo: gate.user.email,
    entity: "ContentBlock",
    entityId: body.key,
  });

  // Push the change to the public page immediately.
  revalidatePath("/");

  return jsonOk({ key: body.key, value: parsed.data });
}

/** Reverts a block to the shipped default by deleting the override. */
export async function DELETE(request: Request) {
  const gate = await guard(request, { rateLimit: RULES.adminWrite });
  if (!gate.ok) return gate.response;

  const key = new URL(request.url).searchParams.get("key") ?? "";
  if (!isContentBlockKey(key)) return jsonError("Unknown content section.", 400);

  const { getContentBlocksCollection } = await import("@/backend/db");
  const contentCol = await getContentBlocksCollection();
  await contentCol.deleteOne({ _id: key });

  await audit({
    action: "content.updated",
    userId: gate.user.id,
    actorInfo: gate.user.email,
    entity: "ContentBlock",
    entityId: key,
    meta: { change: "reverted_to_default" },
  });

  revalidatePath("/");
  return jsonOk({ key, reverted: true });
}

