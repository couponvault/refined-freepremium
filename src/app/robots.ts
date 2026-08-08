import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const base = SITE_URL.replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/watch-later"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin", "/api/", "/watch-later"],
      },
      {
        userAgent: "Googlebot-Video",
        allow: "/",
        disallow: ["/admin", "/api/", "/watch-later"],
      },
    ],
    sitemap: [`${base}/sitemap.xml`, `${base}/sitemap-videos.xml`],
  };
}
