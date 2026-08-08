import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import type { Paginated, VideoInput, VideoWithCategory } from "@/types";
import {
  resolveCategoryIds,
  syncVideoCategories,
} from "@/lib/categories";
import { enforceFeaturedLimit } from "@/lib/featured";
import {
  resolvePerformerIds,
  syncVideoPerformers,
} from "@/lib/performers";
import { validateVideo } from "./validate";

export async function GET(req: NextRequest) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const categoryId = sp.get("categoryId");
  const status = sp.get("status");
  const sort = sp.get("sort") ?? "newest";
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize")) || 20));
  const trash = sp.get("trash") === "1";
  const scheduled = sp.get("scheduled") === "1";
  const dmca = sp.get("dmca") === "1";

  const where: Prisma.VideoWhereInput = {
    deletedAt: trash ? { not: null } : null,
  };
  if (scheduled) where.scheduledAt = { gt: new Date() };
  if (dmca) where.dmcaClaimed = true;
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { tags: { contains: q } },
      { seoTitle: { contains: q } },
    ];
  }
  if (categoryId) {
    const cid = Number(categoryId);
    where.OR = [
      { categoryId: cid },
      { videoCategories: { some: { categoryId: cid } } },
    ];
  }
  if (status === "published") where.published = true;
  else if (status === "draft") where.published = false;
  else if (status === "featured") where.featured = true;
  else if (status === "trending") where.trending = true;

  const orderBy: Prisma.VideoOrderByWithRelationInput =
    sort === "oldest"
      ? { createdAt: "asc" }
      : sort === "title"
        ? { title: "asc" }
        : sort === "views"
          ? { views: "desc" }
          : { createdAt: "desc" };

  const [total, items] = await Promise.all([
    db.video.count({ where }),
    db.video.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { category: true },
    }),
  ]);

  const result: Paginated<VideoWithCategory> = {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as VideoInput;
  const result = await validateVideo(body);
  if ("error" in result)
    return NextResponse.json({ error: result.error }, { status: 400 });
  const performerIds = await resolvePerformerIds(body.performerIds);
  if ("error" in performerIds)
    return NextResponse.json({ error: performerIds.error }, { status: 400 });
  let categoryIds: number[] = [];
  if (body.categoryIds?.length) {
    const resolved = await resolveCategoryIds(body.categoryIds);
    if ("error" in resolved)
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    categoryIds = resolved;
  } else if (result.data.categoryId != null) {
    categoryIds = [result.data.categoryId];
  }
  const video = await db.video.create({
    data: { ...result.data, categoryId: categoryIds[0] ?? null },
    include: {
      category: true,
      performers: { include: { performer: true } },
    },
  });
  await syncVideoCategories(video.id, categoryIds);
  await syncVideoPerformers(video.id, performerIds);
  if (result.data.featured) await enforceFeaturedLimit();
  const withRelations = await db.video.findUnique({
    where: { id: video.id },
    include: {
      category: true,
      videoCategories: { include: { category: true } },
      performers: { include: { performer: true } },
    },
  });
  if (video.published) {
    const { pingSitemap } = await import("@/lib/site");
    void pingSitemap();
  }
  return NextResponse.json(withRelations, { status: 201 });
}
