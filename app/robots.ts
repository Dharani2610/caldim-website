import type { MetadataRoute } from "next";
import { env } from "@/backend/env";

/**
 * The admin area and every API route are excluded explicitly. Robots rules are
 * not a security control — the real gate is server-side auth — but keeping the
 * admin path out of search results removes it as a target of opportunity.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/api/"],
    },
    sitemap: `${env.siteUrl}/sitemap.xml`,
    host: env.siteUrl,
  };
}
