import { db } from "@/lib/db";

/** Parse CSV / form performer slugs: "alice, bob" or "alice|bob". */
export function parsePerformerSlugs(raw: string | undefined | null): string[] {
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

export async function resolvePerformerIds(
  ids: unknown
): Promise<number[] | { error: string }> {
  if (ids === undefined || ids === null) return [];
  if (!Array.isArray(ids)) return { error: "performerIds must be an array" };
  const unique = [
    ...new Set(
      ids
        .map((n) => Number(n))
        .filter((n) => Number.isInteger(n) && n > 0)
    ),
  ];
  if (unique.length === 0) return [];
  const found = await db.performer.findMany({
    where: { id: { in: unique } },
    select: { id: true },
  });
  if (found.length !== unique.length)
    return { error: "One or more performers not found" };
  return unique;
}

export async function resolvePerformerIdsFromSlugs(
  slugs: string[]
): Promise<number[] | { error: string }> {
  if (slugs.length === 0) return [];
  const found = await db.performer.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true },
  });
  const map = new Map(found.map((p) => [p.slug, p.id]));
  const missing = slugs.filter((s) => !map.has(s));
  if (missing.length)
    return { error: `Unknown performerSlug(s): ${missing.join(", ")}` };
  return slugs.map((s) => map.get(s)!);
}

export async function syncVideoPerformers(
  videoId: number,
  performerIds: number[]
) {
  await db.videoPerformer.deleteMany({ where: { videoId } });
  if (performerIds.length === 0) return;
  await db.videoPerformer.createMany({
    data: performerIds.map((performerId) => ({ videoId, performerId })),
  });
}
