import type { Metadata } from "next";
import AdminShell from "@/frontend/components/admin/AdminShell";
import ContentEditor from "@/frontend/components/admin/ContentEditor";
import { getContentBlocks } from "@/backend/content/getSiteContent";
import { requireAdmin } from "@/backend/security/requireAdmin";

export const metadata: Metadata = { title: "Site content", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const { user } = await requireAdmin();
  const content = await getContentBlocks();

  return (
    <AdminShell
      user={user}
      title="Site content"
      description="Edit the copy on the public homepage. Saving publishes immediately — there is no separate deploy step. Reverting a section restores the text the site shipped with."
    >
      <ContentEditor initial={content} />
    </AdminShell>);
}
