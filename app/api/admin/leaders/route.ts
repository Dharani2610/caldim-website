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

  try {
    const { getLeadersCollection, getMediaAssetsCollection } = await import("@/backend/db");
    const leadersCol = await getLeadersCollection();
    const mediaCol = await getMediaAssetsCollection();
    const rows = await leadersCol.find({}).sort({ sortOrder: 1, createdAt: 1 }).toArray();
    const photoIds = rows.map((r) => r.photoId).filter((id): id is string => Boolean(id));
    const photos =
      photoIds.length > 0 ? await mediaCol.find({ _id: { $in: photoIds } }).toArray() : [];
    const photoMap = new Map(photos.map((p) => [p._id, p]));

    return jsonOk({
      leaders: rows.map((leader) => {
        const photo = leader.photoId ? photoMap.get(leader.photoId) : null;
        return {
          ...leader,
          id: leader._id,
          photoUrl: photo ? `/api/media/${photo._id}` : null,
          photoAlt: photo?.altText ?? "",
        };
      }),
    });
  } catch {
    return jsonOk({ leaders: [] });
  }
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

  const { getLeadersCollection, getMediaAssetsCollection } = await import("@/backend/db");
  const leadersCol = await getLeadersCollection();
  const mediaCol = await getMediaAssetsCollection();

  const existing = await leadersCol.countDocuments();
  if (existing >= MAX_LEADERS) {
    return jsonError(`You can have at most ${MAX_LEADERS} leadership entries.`, 409);
  }

  const data = parsed.data;

  // Verify the referenced photo exists rather than trusting the id.
  if (data.photoId) {
    const photo = await mediaCol.findOne({ _id: data.photoId });
    if (!photo) return jsonError("That photo could not be found. Upload it again.", 400);
  }

  const nowDate = new Date();
  const leaderId = newId();
  const leaderDoc = {
    _id: leaderId,
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
  };

  await leadersCol.insertOne(leaderDoc);

  await audit({
    action: "leader.created",
    userId: gate.user.id,
    actorInfo: gate.user.email,
    entity: "Leader",
    entityId: leaderId,
    meta: { name: leaderDoc.name },
  });

  revalidatePath("/");
  return jsonOk({ leader: { ...leaderDoc, id: leaderId } }, 201);
}

