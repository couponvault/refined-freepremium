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
  
  for (const id of categoryIds) {
    const v = await db.video.findFirst({
      where: publicVideoWhere({
        thumbnail: { not: "" },
        OR: [
          { categoryId: id },
          { videoCategories: { some: { categoryId: id } } },
        ],
      }),
      orderBy: [{ views: "desc" }, { createdAt: "desc" }],
      select: { thumbnail: true },
    });
    if (v?.thumbnail) {
      map.set(id, v.thumbnail);
    }
  }
  return map;
}
