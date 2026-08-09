import { db } from "@/lib/db";
import { publicVideoWhere } from "@/lib/videos";
import { SITE_URL } from "@/lib/seo";

/** Fire-and-forget search engine sitemap pings after content changes. */
export async function pingSitemap(): Promise<void> {
  const base = SITE_URL.replace(/\/$/, "");
  const sitemaps = [`${base}/sitemap.xml`, `${base}/sitemap-videos.xml`];
  const targets = sitemaps.flatMap((sitemap) => [
    `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemap)}`,
    `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemap)}`,
  ]);
  await Promise.allSettled(
    targets.map((url) =>
      fetch(url, { method: "GET", signal: AbortSignal.timeout(8000) }).catch(
        () => null
      )
    )
  );
}

export async function categoryCoverMap(
  categoryIds: number[]
): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  if (categoryIds.length === 0) return map;
  
  // Fetch the top 2000 most viewed videos that have a thumbnail
  // This is a single fast query that will cover almost all categories
  const videos = await db.video.findMany({
    where: {
      thumbnail: { not: "" },
      published: true,
      deletedAt: null,
      OR: [
        { categoryId: { in: categoryIds } },
        { videoCategories: { some: { categoryId: { in: categoryIds } } } },
      ],
    },
    orderBy: [{ views: "desc" }, { createdAt: "desc" }],
    take: 2000,
    select: {
      thumbnail: true,
      categoryId: true,
      videoCategories: { select: { categoryId: true } },
    },
  });

  // Map the first matching video's thumbnail to each category
  for (const v of videos) {
    if (v.categoryId && categoryIds.includes(v.categoryId) && !map.has(v.categoryId)) {
      map.set(v.categoryId, v.thumbnail);
    }
    for (const vc of v.videoCategories) {
      if (categoryIds.includes(vc.categoryId) && !map.has(vc.categoryId)) {
        map.set(vc.categoryId, v.thumbnail);
      }
    }
    if (map.size === categoryIds.length) break;
  }

  return map;
}
