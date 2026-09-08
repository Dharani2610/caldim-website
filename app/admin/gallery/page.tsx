import type { Metadata } from "next";
import { asc, desc, eq, notLike } from "drizzle-orm";
import AdminShell from "@/frontend/components/admin/AdminShell";
import GalleryManager, { type GalleryAsset } from "@/frontend/components/admin/GalleryManager";
import { db, galleryItems, mediaAssets } from "@/backend/db";
import { requireAdmin } from "@/backend/security/requireAdmin";
import { deliveryUrl, videoPosterUrl } from "@/backend/media/cloudinary";

export const metadata: Metadata = { title: "Gallery", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function present(asset: {
  id: string;
  publicId: string;
  resourceType: "image" | "video" | "raw";
  originalName: string;
  title: string;
  duration: number | null;
}): GalleryAsset {
  const kind = asset.resourceType === "video" ? "video" : asset.resourceType === "raw" ? "raw" : "image";
  return {
    id: asset.id,
    resourceType: kind,
    originalName: asset.originalName,
    title: asset.title,
    duration: asset.duration,
    thumbnailUrl:
      kind === "video"
        ? videoPosterUrl(asset.publicId, 480)
        : kind === "raw"
          ? ""
          : deliveryUrl(asset.publicId, "image", { width: 480, height: 360 }),
  };
}

export default async function GalleryPage() {
  const { user } = await requireAdmin();

  const [rows, library] = await Promise.all([
    db
      .select({ item: galleryItems, media: mediaAssets })
      .from(galleryItems)
      .innerJoin(mediaAssets, eq(galleryItems.mediaId, mediaAssets.id))
      .orderBy(asc(galleryItems.collection), asc(galleryItems.sortOrder)),
    db
      .select({
        id: mediaAssets.id,
        publicId: mediaAssets.publicId,
        resourceType: mediaAssets.resourceType,
        originalName: mediaAssets.originalName,
        title: mediaAssets.title,
        duration: mediaAssets.duration,
      })
      .from(mediaAssets)
      // RFQ attachments start with `rfq-` — they are client submissions and
      // must never be offered as site media.
      .where(notLike(mediaAssets.publicId, "rfq-%"))
      .orderBy(desc(mediaAssets.createdAt))
      .limit(300),
  ]);

  return (
    <AdminShell
      user={user}
      title="Gallery"
      description="Place photos and videos into the slots the public site reads from. Adding and removing here changes what visitors see; the files themselves stay in your media library either way."
    >
      <GalleryManager
        assets={library.map(present)}
        items={rows.map(({ item, media }) => ({
          id: item.id,
          collection: item.collection,
          mediaId: item.mediaId,
          caption: item.caption,
          meta: item.meta,
          published: item.published,
          sortOrder: item.sortOrder,
          media: present(media),
        }))}
      />
    </AdminShell>
  );
}
