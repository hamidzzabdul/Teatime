import type { MetadataRoute } from "next";
import { siteUrl, comingSoon } from "@/lib/site";

// Generate this metadata route at build time for cPanel static hosting.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!siteUrl) return [];
  return (comingSoon ? ["/"] : ["/", "/menu", "/contact", "/rewards", "/rewards/terms", "/our-place", "/app"]).map((path) => ({ url: new URL(path, siteUrl).href }));
}

