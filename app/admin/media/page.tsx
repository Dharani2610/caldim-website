import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import AdminShell from "@/frontend/components/admin/AdminShell";
import MediaLibrary from "@/frontend/components/admin/MediaLibrary";
import { db, mediaAssets } from "@/backend/db";
import { env } from "@/backend/env";
import { requireAdmin } from "@/backend/security/requireAdmin";
import { deliveryUrl, videoPosterUrl } from "@/backend/media/cloudinary";

export const metadata: Metadata = { title: "Media", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const { user } = await requireAdmin();

  const assets = await db
    .select({
      id: mediaAssets.id,
      publicId: mediaAssets.publicId,
      resourceType: mediaAssets.resourceType,
      originalName: mediaAssets.originalName,
      mimeType: mediaAssets.mimeType,
      byteSize: mediaAssets.byteSize,
      width: mediaAssets.width,
      height: mediaAssets.height,
      duration: mediaAssets.duration,
      altText: mediaAssets.altText,
      title: mediaAssets.title,
      createdAt: mediaAssets.createdAt,
    })
    .from(mediaAssets)
    .orderBy(desc(mediaAssets.createdAt))
    .limit(300);

  return (
    <AdminShell
      user={user}
      title="Media"
      description="Photos are re-encoded to WebP on arrival, which strips EXIF metadata (including the GPS coordinates phones embed) and removes anything hidden alongside the image data. Video is uploaded straight to Cloudinary against a short-lived signature and then verified server-side. Everything is delivered from Cloudinary's CDN, sized and format-negotiated per browser."
    >
      <MediaLibrary
        maxVideoMb={Math.floor(env.maxVideoUploadBytes / 1024 / 1024)}
        assets={assets
          // A `raw` row is an RFQ attachment, not site media — those belong in
          // Enquiries, where they arrived.
          .filter((asset) => asset.resourceType !== "raw")
          .map((asset) => ({
            ...asset,
            createdAt: asset.createdAt.toISOString(),
            url: deliveryUrl(asset.publicId, asset.resourceType),
            thumbnailUrl:
              asset.resourceType === "video"
                ? videoPosterUrl(asset.publicId, 480)
                : deliveryUrl(asset.publicId, asset.resourceType, { width: 480, height: 360 }),
          }))}
      />
    </AdminShell>
  );
}
