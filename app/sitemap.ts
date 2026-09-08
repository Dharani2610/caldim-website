import type { MetadataRoute } from "next";
import { env } from "@/backend/env";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: env.siteUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
