import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/dashboard/", "/startup/", "/api/", "/login", "/register", "/forgot-password", "/reset-password", "/search"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
