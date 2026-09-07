import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/**
 * Public discovery surfaces stay crawlable. Anything that is admin-only,
 * account-specific, or an internal API stays out of the index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/api/", "/notifications", "/saved", "/create"]
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/")
  };
}
