import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Paginated, VideoWithCategory } from "@/types";
import { searchPublicVideos } from "@/lib/search";
import {
  buildVideoOrderBy,
  buildVideoWhere,
  type PublicSort,
} from "./query";

const SORTS = new Set<PublicSort>(["newest", "oldest", "views", "title"]);

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") ?? "").trim();
  const category = sp.get("category") ?? undefined;
  const tag = sp.get("tag") ?? undefined;
  const quality = sp.get("quality") ?? undefined;
  const exclusive = sp.get("exclusive") === "1";
  const minRaw = sp.get("minDuration");
  const maxRaw = sp.get("maxDuration");
  const minDuration =
    minRaw != null && minRaw !== "" ? parseInt(minRaw, 10) : undefined;
  const maxDuration =
    maxRaw != null && maxRaw !== "" ? parseInt(maxRaw, 10) : undefined;
  const sortParam = sp.get("sort") ?? "newest";
  const sort = SORTS.has(sortParam as PublicSort)
    ? (sortParam as PublicSort)
    : "newest";
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    48,
    Math.max(1, parseInt(sp.get("pageSize") ?? "12", 10) || 12)
  );

  // Text queries use fuzzy / typo-tolerant ranking
  if (q && !category && !tag) {
    const { items, total } = await searchPublicVideos({
      q,
      page,
      pageSize,
      sort,
      quality: quality || undefined,
      exclusive: exclusive || undefined,
      minDuration: Number.isFinite(minDuration) ? minDuration : undefined,
      maxDuration: Number.isFinite(maxDuration) ? maxDuration : undefined,
    });
    const result: Paginated<VideoWithCategory> = {
      items: items.map(({ performers: _p, ...rest }) => rest),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 0,
    };
    return NextResponse.json(result);
  }

  const where = buildVideoWhere(q || undefined, category, {
    tag,
    quality,
    exclusive: exclusive || undefined,
    minDuration: Number.isFinite(minDuration) ? minDuration : undefined,
    maxDuration: Number.isFinite(maxDuration) ? maxDuration : undefined,
  });
  const orderBy = buildVideoOrderBy(sort);

  const [items, total] = await Promise.all([
    db.video.findMany({
      where,
      include: { category: true },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.video.count({ where }),
  ]);

  const result: Paginated<VideoWithCategory> = {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
  return NextResponse.json(result);
}
