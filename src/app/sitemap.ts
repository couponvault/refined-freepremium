import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/seo";
import { parseTags, tagSlug } from "@/lib/utils";
import { publicVideoWhere } from "@/lib/videos";

/** Full URL sitemap for Google Search Console — every public page + video + tag. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, performers, videos] = await Promise.all([
    db.category.findMany({
      where: { enabled: true },
      select: { slug: true },
    }),
    db.performer.findMany({
      where: { enabled: true },
      select: { slug: true },
    }),
    db.video.findMany({
      where: publicVideoWhere(),
      select: {
        slug: true,
        updatedAt: true,
        createdAt: true,
        featured: true,
        trending: true,
        tags: true,
      },
    }),
  ]);

  const tagMap = new Map<string, Date>();
  for (const v of videos) {
    for (const t of parseTags(v.tags)) {
      const s = tagSlug(t);
      if (!s) continue;
      const prev = tagMap.get(s);
      if (!prev || v.updatedAt > prev) tagMap.set(s, v.updatedAt);
    }
  }

  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/categories`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/performers`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/tags`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/dmca`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/policy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/2257`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/parental-controls`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.35,
    },
    {
      url: `${SITE_URL}/addiction-help`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.35,
    },
  ];

  return [
    ...staticPages,
    ...categories.map((c) => ({
      url: `${SITE_URL}/category/${c.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...performers.map((p) => ({
      url: `${SITE_URL}/performer/${p.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...[...tagMap.entries()].map(([slug, updatedAt]) => ({
      url: `${SITE_URL}/tag/${slug}`,
      lastModified: updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.55,
    })),
    ...videos.map((v) => ({
      url: `${SITE_URL}/video/${v.slug}`,
      lastModified: v.updatedAt,
      changeFrequency: "weekly" as const,
      priority: v.featured || v.trending ? 0.95 : 0.8,
    })),
  ];
}
