import { db } from "@/lib/db";

/** Parse CSV / form category slugs: "amateur, milf" or "amateur|milf". */
export function parseCategorySlugs(raw: string | undefined | null): string[] {
  if (!raw?.trim()) return [];
  return [
    ...new Set(
      raw
        .split(/[,|]/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    ),
  ];
}

export async function resolveCategoryIds(
  ids: unknown
): Promise<number[] | { error: string }> {
  if (ids === undefined || ids === null) return [];
  if (!Array.isArray(ids)) return { error: "categoryIds must be an array" };
  const unique = [
    ...new Set(
      ids
        .map((n) => Number(n))
        .filter((n) => Number.isInteger(n) && n > 0)
    ),
  ];
  if (unique.length === 0) return [];
  const found = await db.category.findMany({
    where: { id: { in: unique } },
    select: { id: true },
  });
  if (found.length !== unique.length)
    return { error: "One or more categories not found" };
  return unique;
}

export async function resolveCategoryIdsFromSlugs(
  slugs: string[]
): Promise<number[] | { error: string }> {
  if (slugs.length === 0) return [];
  const found = await db.category.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true },
  });
  const map = new Map(found.map((c) => [c.slug, c.id]));
  const missing = slugs.filter((s) => !map.has(s));
  
  if (missing.length) {
    for (const s of missing) {
      const name = s.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
      const c = await db.category.create({
        data: { name, slug: s, icon: "🎬", enabled: true, order: 0 }
      });
      map.set(s, c.id);
    }
  }
  return slugs.map((s) => map.get(s)!);
}

/** Sync many-to-many links and set primary categoryId to the first id. */
export async function syncVideoCategories(
  videoId: number,
  categoryIds: number[]
) {
  await db.videoCategory.deleteMany({ where: { videoId } });
  if (categoryIds.length > 0) {
    await db.videoCategory.createMany({
      data: categoryIds.map((categoryId) => ({ videoId, categoryId })),
    });
  }
  await db.video.update({
    where: { id: videoId },
    data: { categoryId: categoryIds[0] ?? null },
  });
}

/** One-time: copy legacy categoryId into VideoCategory for existing rows. */
export async function backfillVideoCategories() {
  const videos = await db.video.findMany({
    where: { categoryId: { not: null } },
    select: { id: true, categoryId: true },
  });
  for (const v of videos) {
    if (v.categoryId == null) continue;
    await db.videoCategory.upsert({
      where: {
        videoId_categoryId: { videoId: v.id, categoryId: v.categoryId },
      },
      update: {},
      create: { videoId: v.id, categoryId: v.categoryId },
    });
  }
}
