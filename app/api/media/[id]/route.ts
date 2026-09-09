import { NextResponse } from "next/server";
import { deliveryUrl } from "@/backend/media/cloudinary";

export const runtime = "nodejs";

/**
 * Resolves a media id to its Cloudinary delivery URL.
 *
 * The bytes used to be read off local disk and streamed back through here.
 * They now live on Cloudinary's CDN, so proxying them would mean paying for
 * the transfer twice and losing edge caching for no benefit — this handler
 * redirects instead.
 *
 * It is kept rather than deleted because `/api/media/{id}` is a stable,
 * opaque identifier: it appears in saved content, in older records, and in
 * anything an editor has already pasted somewhere. Redirecting keeps every one
 * of those links working while the storage underneath changes.
 *
 * The id is still looked up in the database — no URL is ever built from user
 * input — and only image and video rows resolve, so a raw RFQ attachment
 * cannot be fetched through the public path.
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  if (!/^[a-z0-9]{28,48}$/i.test(params.id)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { getMediaAssetsCollection } = await import("@/backend/db");
  const mediaCol = await getMediaAssetsCollection();
  const asset = await mediaCol.findOne({ _id: params.id });

  // `raw` is deliberately excluded: those are RFQ attachments, which are
  // reachable from the admin area only.
  if (!asset || (asset.resourceType !== "image" && asset.resourceType !== "video")) {
    return new NextResponse("Not found", { status: 404 });
  }


  const url = new URL(request.url);
  const width = Number(url.searchParams.get("w"));
  const target = deliveryUrl(asset.publicId, asset.resourceType, {
    width: Number.isFinite(width) && width > 0 && width <= 4000 ? width : undefined,
  });

  if (!target) return new NextResponse("Not found", { status: 404 });

  return NextResponse.redirect(target, {
    status: 307,
    headers: {
      // The row is immutable once written — re-uploading mints a new id — so
      // the redirect itself is safe to cache for a good while.
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
