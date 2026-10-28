import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// Generate this metadata route at build time for cPanel static hosting.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" }, ...(siteUrl ? { sitemap: `${siteUrl}/sitemap.xml` } : {}) };
}
