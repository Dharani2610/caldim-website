import { revalidatePath } from "next/cache";
import { asc, count, eq } from "drizzle-orm";
import { db, leaders, mediaAssets, newId, one } from "@/backend/db";
import { initialsFrom } from "@/backend/content/defaults";
import { audit } from "@/backend/security/audit";
import { guard, jsonError, jsonOk } from "@/backend/security/guard";
import { RULES } from "@/backend/security/rateLimit";
import { fieldErrors, leaderSchema } from "@/backend/security/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A bounded list keeps one compromised session from filling the disk. */
const MAX_LEADERS = 40;

export async function GET(request: Request) {
  const gate = await guard(request, { csrf: false });
  if (!gate.ok) return gate.response;

  const rows = await db
    .select({ leader: leaders, photo: mediaAssets })
    .from(leaders)
    .leftJoin(mediaAssets, eq(leaders.photoId, mediaAssets.id))
    .orderBy(asc(leaders.sortOrder), asc(leaders.createdAt));

  return jsonOk({
    leaders: rows.map(({ leader, photo }) => ({
      ...leader,
      photoUrl: photo ? `/api/media/${photo.id}` : null,
      photoAlt: photo?.altText ?? "",
    })),
  });
}

export async function POST(request: Request) {
  const gate = await guard(request, { rateLimit: RULES.adminWrite });
  if (!gate.ok) return gate.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Malformed request.", 400);
  }

  const parsed = leaderSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Check the fields below.", 400, { fields: fieldErrors(parsed.error) });
  }

  const existing = (await one(db.select({ value: count() }).from(leaders)))?.value ?? 0;
  if (existing >= MAX_LEADERS) {
    return jsonError(`You can have at most ${MAX_LEADERS} leadership entries.`, 409);
  }

  const data = parsed.data;

  // Verify the referenced photo exists rather than trusting the id.
  if (data.photoId) {
    const photo = await one(db.select().from(mediaAssets).where(eq(mediaAssets.id, data.photoId)));
    if (!photo) return jsonError("That photo could not be found. Upload it again.", 400);
  }

  const nowDate = new Date();
  const leader = await one(db
    .insert(leaders)
    .values({
      id: newId(),
      name: data.name,
      title: data.title,
      credentials: data.credentials,
      bio: data.bio,
      location: data.location,
      email: data.email || null,
      linkedinUrl: data.linkedinUrl || null,
      photoId: data.photoId || null,
      initials: initialsFrom(data.name),
      published: data.published,
      sortOrder: data.sortOrder || existing,
      createdAt: nowDate,
      updatedAt: nowDate,
    })
    .returning());

  if (!leader) return jsonError("That profile could not be saved.", 500);

  await audit({
    action: "leader.created",
    userId: gate.user.id,
    actorInfo: gate.user.email,
    entity: "Leader",
    entityId: leader.id,
    meta: { name: leader.name },
  });

  revalidatePath("/");
  return jsonOk({ leader }, 201);
}
