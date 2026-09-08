import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import AdminShell from "@/frontend/components/admin/AdminShell";
import LeadershipManager from "@/frontend/components/admin/LeadershipManager";
import { db, leaders, mediaAssets } from "@/backend/db";
import { requireAdmin } from "@/backend/security/requireAdmin";

export const metadata: Metadata = { title: "Leadership", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LeadershipPage() {
  const { user } = await requireAdmin();

  const rows = await db
    .select({ leader: leaders, photo: mediaAssets })
    .from(leaders)
    .leftJoin(mediaAssets, eq(leaders.photoId, mediaAssets.id))
    .orderBy(asc(leaders.sortOrder), asc(leaders.createdAt));

  const initial = rows.map(({ leader, photo }) => ({
    id: leader.id,
    name: leader.name,
    title: leader.title,
    credentials: leader.credentials,
    bio: leader.bio,
    location: leader.location,
    email: leader.email ?? "",
    linkedinUrl: leader.linkedinUrl ?? "",
    photoId: leader.photoId ?? "",
    photoUrl: photo ? `/api/media/${photo.id}` : null,
    published: leader.published,
    sortOrder: leader.sortOrder,
  }));

  return (
    <AdminShell
      user={user}
      title="Meet Our Leadership"
      description="These entries drive the leadership section on the homepage. Until you add at least one, the public page shows four clearly-marked placeholders."
    >
      <LeadershipManager initial={initial} />
    </AdminShell>);
}
