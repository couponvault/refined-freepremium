import { db } from "@/lib/db";

/** Max videos shown in the homepage Featured section. */
export const FEATURED_LIMIT = 6;

/**
 * Keep only the newest FEATURED_LIMIT featured videos.
 * Older ones are unfeatured (drop off the bottom of Featured).
 */
export async function enforceFeaturedLimit(): Promise<number> {
  const featured = await db.video.findMany({
    where: { featured: true, deletedAt: null },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    select: { id: true },
  });
  if (featured.length <= FEATURED_LIMIT) return 0;
  const dropIds = featured.slice(FEATURED_LIMIT).map((v) => v.id);
  await db.video.updateMany({
    where: { id: { in: dropIds } },
    data: { featured: false },
  });
  return dropIds.length;
}
