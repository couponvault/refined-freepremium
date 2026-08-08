import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { parseTags } from "@/lib/utils";

export async function GET() {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notDeleted = { deletedAt: null as null };

  const [
    totalVideos,
    published,
    totalCategories,
    viewsAgg,
    recent,
    topVideos,
    zeroViewVideos,
    openReports,
    openDmca,
    tagVideos,
  ] = await Promise.all([
    db.video.count({ where: notDeleted }),
    db.video.count({ where: { ...notDeleted, published: true } }),
    db.category.count(),
    db.video.aggregate({ where: notDeleted, _sum: { views: true } }),
    db.video.findMany({
      where: notDeleted,
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { category: true },
    }),
    db.video.findMany({
      where: notDeleted,
      orderBy: { views: "desc" },
      take: 10,
      select: { id: true, title: true, slug: true, views: true, thumbnail: true },
    }),
    db.video.findMany({
      where: { ...notDeleted, published: true, views: 0 },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, title: true, slug: true, createdAt: true },
    }),
    db.report.count({ where: { status: "open" } }),
    db.dmcaRequest.count({ where: { status: "open" } }),
    db.video.findMany({
      where: notDeleted,
      select: { tags: true },
    }),
  ]);

  const tagCounts = new Map<string, number>();
  for (const v of tagVideos) {
    for (const t of parseTags(v.tags)) {
      const key = t.toLowerCase();
      tagCounts.set(key, (tagCounts.get(key) ?? 0) + 1);
    }
  }
  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  const zeroViewCount = await db.video.count({
    where: { ...notDeleted, published: true, views: 0 },
  });

  return NextResponse.json({
    totalVideos,
    published,
    totalCategories,
    totalViews: viewsAgg._sum.views ?? 0,
    recent,
    topVideos,
    topTags,
    zeroViewCount,
    zeroViewVideos,
    openReports,
    openDmca,
    storageNote: "N/A — embeds hosted externally",
  });
}
