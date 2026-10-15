import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/api/", "/styleguide", "/reset-password", "/set-password"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
