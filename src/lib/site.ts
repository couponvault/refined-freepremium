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

/** First published video thumbnail in a category (for cover fallback). */
export async function categoryCoverMap(
  categoryIds: number[]
): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  if (categoryIds.length === 0) return map;
  const videos = await db.video.findMany({
    where: publicVideoWhere({
      thumbnail: { not: "" },
      OR: [
        { categoryId: { in: categoryIds } },
        {
          videoCategories: {
            some: { categoryId: { in: categoryIds } },
          },
        },
      ],
    }),
    orderBy: [{ views: "desc" }, { createdAt: "desc" }],
    select: {
      categoryId: true,
      thumbnail: true,
      videoCategories: { select: { categoryId: true } },
    },
  });
  for (const v of videos) {
    const ids = new Set<number>();
    if (v.categoryId != null) ids.add(v.categoryId);
    for (const link of v.videoCategories) ids.add(link.categoryId);
    for (const id of ids) {
      if (categoryIds.includes(id) && !map.has(id)) {
        map.set(id, v.thumbnail);
      }
    }
  }
  return map;
}
