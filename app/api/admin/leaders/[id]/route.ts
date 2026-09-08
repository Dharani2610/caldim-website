import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, leaders, mediaAssets, one } from "@/backend/db";
import { initialsFrom } from "@/backend/content/defaults";
import { audit } from "@/backend/security/audit";
import { guard, jsonError, jsonOk } from "@/backend/security/guard";
import { RULES } from "@/backend/security/rateLimit";
import { fieldErrors, leaderSchema } from "@/backend/security/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

/** Ids are timestamp + 24 hex chars; refuse anything not shaped like one. */
function validId(id: string): boolean {
  return /^[a-z0-9]{28,48}$/i.test(id);
}

export async function PUT(request: Request, { params }: Params) {
  const gate = await guard(request, { rateLimit: RULES.adminWrite });
  if (!gate.ok) return gate.response;

  if (!validId(params.id)) return jsonError("Not found.", 404);

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

  const existing = await leadersCol.findOne({ _id: params.id });
  if (!existing) return jsonError("Not found.", 404);

  const data = parsed.data;

  if (data.photoId && data.photoId !== existing.photoId) {
    const photo = await mediaCol.findOne({ _id: data.photoId });
    if (!photo) return jsonError("That photo could not be found. Upload it again.", 400);
  }

  const nowDate = new Date();
  await leadersCol.updateOne(
    { _id: params.id },
    {
      $set: {
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
        sortOrder: data.sortOrder,
        updatedAt: nowDate,
      },
    }
  );

  const updated = await leadersCol.findOne({ _id: params.id });
  if (!updated) return jsonError("Not found.", 404);

  await audit({
    action: "leader.updated",
    userId: gate.user.id,
    actorInfo: gate.user.email,
    entity: "Leader",
    entityId: params.id,
    meta: { name: updated.name },
  });

  revalidatePath("/");
  return jsonOk({ leader: { ...updated, id: updated._id } });
}

export async function DELETE(request: Request, { params }: Params) {
  const gate = await guard(request, { rateLimit: RULES.adminWrite });
  if (!gate.ok) return gate.response;

  if (!validId(params.id)) return jsonError("Not found.", 404);

  const { getLeadersCollection } = await import("@/backend/db");
  const leadersCol = await getLeadersCollection();

  const existing = await leadersCol.findOne({ _id: params.id });
  if (!existing) return jsonError("Not found.", 404);

  await leadersCol.deleteOne({ _id: params.id });

  await audit({
    action: "leader.deleted",
    userId: gate.user.id,
    actorInfo: gate.user.email,
    entity: "Leader",
    entityId: params.id,
    meta: { name: existing.name },
  });

  revalidatePath("/");
  return jsonOk({ deleted: params.id });
}

