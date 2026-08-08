import Link from "next/link";
import { db } from "@/lib/db";
import { parseTags, tagSlug } from "@/lib/utils";
import { publicVideoWhere } from "@/lib/videos";

export async function getPopularTags(limit = 24) {
  const videos = await db.video.findMany({
    where: publicVideoWhere(),
    select: { tags: true },
    take: 800,
    orderBy: { views: "desc" },
  });
  const counts = new Map<string, { name: string; count: number }>();
  for (const v of videos) {
    for (const t of parseTags(v.tags)) {
      const s = tagSlug(t);
      if (!s) continue;
      const cur = counts.get(s);
      if (cur) cur.count += 1;
      else counts.set(s, { name: t, count: 1 });
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)
    .map(([slug, v]) => ({ slug, name: v.name, count: v.count }));
}

export default async function PopularTags({
  limit = 18,
  title = "Popular tags",
}: {
  limit?: number;
  title?: string;
}) {
  const tags = await getPopularTags(limit);
  if (tags.length === 0) return null;
  return (
    <section className="my-12">
      <div className="mb-5 flex items-end justify-between gap-3">
        <h2 className="font-display flex items-center gap-2.5 text-xl font-extrabold tracking-tight">
          <span className="h-5 w-1 rounded-full bg-gradient-to-b from-accent to-gold" />
          {title}
        </h2>
        <Link
          href="/tags"
          className="text-xs font-medium text-muted hover:text-accent"
        >
          Browse all →
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <Link
            key={t.slug}
            href={`/tag/${t.slug}`}
            className="rounded-lg border border-border/80 bg-surface/70 px-3.5 py-1.5 text-sm text-muted transition-colors hover:border-accent/40 hover:text-accent"
          >
            #{t.name}
            <span className="ml-1.5 text-[10px] opacity-60">{t.count}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
