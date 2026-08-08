import type { Category, Performer, Video } from "@prisma/client";
import { db } from "@/lib/db";
import { fuzzyRank, fuzzyScore } from "@/lib/fuzzy";
import { parseTags, tagSlug } from "@/lib/utils";
import {
  buildVideoOrderBy,
  buildVideoWhere,
  type PublicSort,
} from "@/app/api/videos/query";

type VideoRow = Video & {
  category: Category | null;
  performers: { performer: Pick<Performer, "name" | "slug" | "enabled"> }[];
};

function videoHaystack(v: VideoRow): string {
  const stars = v.performers.map((p) => p.performer.name).join(" ");
  return [
    v.title,
    v.seoTitle,
    v.description,
    v.seoDescription,
    v.tags,
    v.category?.name ?? "",
    stars,
  ].join(" ");
}

function applySecondarySort(a: VideoRow, b: VideoRow, sort: PublicSort) {
  switch (sort) {
    case "oldest":
      return a.createdAt.getTime() - b.createdAt.getTime();
    case "views":
      return b.views - a.views;
    case "title":
      return a.title.localeCompare(b.title);
    default:
      return b.createdAt.getTime() - a.createdAt.getTime();
  }
}

/** Typo-tolerant public video search with in-memory relevance ranking. */
export async function searchPublicVideos(opts: {
  q: string;
  page?: number;
  pageSize?: number;
  sort?: PublicSort;
  quality?: string;
  exclusive?: boolean;
  minDuration?: number;
  maxDuration?: number;
}): Promise<{ items: VideoRow[]; total: number }> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, opts.pageSize ?? 12));
  const sort = opts.sort ?? "newest";
  const q = opts.q.trim();

  const baseWhere = buildVideoWhere(undefined, undefined, {
    quality: opts.quality,
    exclusive: opts.exclusive,
    minDuration: opts.minDuration,
    maxDuration: opts.maxDuration,
  });

  if (!q) {
    const [items, total] = await Promise.all([
      db.video.findMany({
        where: baseWhere,
        include: {
          category: true,
          performers: {
            include: { performer: true },
            where: { performer: { enabled: true } },
          },
        },
        orderBy: buildVideoOrderBy(sort),
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.video.count({ where: baseWhere }),
    ]);
    return { items, total };
  }

  const candidates = await db.video.findMany({
    where: baseWhere,
    include: {
      category: true,
      performers: {
        include: { performer: true },
        where: { performer: { enabled: true } },
      },
    },
    take: 2500,
  });

  const scored = candidates
    .map((v) => {
      const titleScore = fuzzyScore(q, v.title) * 1.35;
      const fullScore = fuzzyScore(q, videoHaystack(v));
      return { v, score: Math.max(titleScore, fullScore) };
    })
    .filter((x) => x.score >= 40)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return applySecondarySort(a.v, b.v, sort);
    });

  const total = scored.length;
  const items = scored
    .slice((page - 1) * pageSize, page * pageSize)
    .map((x) => x.v);
  return { items, total };
}

export async function suggestPublic(q: string) {
  const query = q.trim();
  if (query.length < 2) {
    return { videos: [], categories: [], tags: [], performers: [] };
  }

  const [videosRaw, categoriesRaw, performersRaw, tagSource] =
    await Promise.all([
      db.video.findMany({
        where: buildVideoWhere(),
        select: {
          slug: true,
          title: true,
          thumbnail: true,
          views: true,
          tags: true,
          description: true,
        },
        take: 800,
        orderBy: { views: "desc" },
      }),
      db.category.findMany({
        where: { enabled: true },
        select: { name: true, slug: true, icon: true },
      }),
      db.performer.findMany({
        where: { enabled: true },
        select: { name: true, slug: true, imageUrl: true },
        take: 600,
      }),
      db.video.findMany({
        where: buildVideoWhere(),
        select: { tags: true },
        take: 500,
        orderBy: { views: "desc" },
      }),
    ]);

  const videos = fuzzyRank(
    videosRaw,
    query,
    (v) => `${v.title} ${v.tags} ${v.description}`,
    { limit: 6, minScore: 45 }
  ).map((v) => ({
    slug: v.slug,
    title: v.title,
    thumbnail: v.thumbnail,
    views: v.views,
  }));

  const categories = fuzzyRank(categoriesRaw, query, (c) => `${c.name} ${c.slug}`, {
    limit: 4,
    minScore: 50,
  });

  const performers = fuzzyRank(performersRaw, query, (p) => p.name, {
    limit: 5,
    minScore: 50,
  });

  const tagMap = new Map<string, { name: string; count: number }>();
  for (const v of tagSource) {
    for (const t of parseTags(v.tags)) {
      const s = tagSlug(t);
      if (!s) continue;
      const cur = tagMap.get(s);
      if (cur) cur.count += 1;
      else tagMap.set(s, { name: t, count: 1 });
    }
  }
  const tagItems = [...tagMap.entries()].map(([slug, v]) => ({
    slug,
    name: v.name,
    count: v.count,
  }));
  const tags = fuzzyRank(tagItems, query, (t) => t.name, {
    limit: 6,
    minScore: 45,
  });

  return { videos, categories, tags, performers };
}
