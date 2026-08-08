import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import type { VideoInput } from "@/types";
import {
  resolveCategoryIds,
  syncVideoCategories,
} from "@/lib/categories";
import { enforceFeaturedLimit } from "@/lib/featured";
import {
  resolvePerformerIds,
  syncVideoPerformers,
} from "@/lib/performers";
import { validateVideo } from "../validate";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isInteger(id))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const existing = await db.video.findUnique({ where: { id } });
  if (!existing)
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as VideoInput;
  const result = await validateVideo(body, id);
  if ("error" in result)
    return NextResponse.json({ error: result.error }, { status: 400 });
  const performerIds = await resolvePerformerIds(body.performerIds);
  if ("error" in performerIds)
    return NextResponse.json({ error: performerIds.error }, { status: 400 });
  let categoryIds: number[] = [];
  if (body.categoryIds !== undefined) {
    const resolved = await resolveCategoryIds(body.categoryIds);
    if ("error" in resolved)
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    categoryIds = resolved;
  } else if (result.data.categoryId != null) {
    categoryIds = [result.data.categoryId];
  }
  await db.video.update({
    where: { id },
    data: { ...result.data, categoryId: categoryIds[0] ?? null },
  });
  await syncVideoCategories(id, categoryIds);
  await syncVideoPerformers(id, performerIds);
  if (result.data.featured) await enforceFeaturedLimit();
  const video = await db.video.findUnique({
    where: { id },
    include: {
      category: true,
      videoCategories: { include: { category: true } },
      performers: { include: { performer: true } },
    },
  });
  return NextResponse.json(video);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isInteger(id))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  await db.video
    .update({ where: { id }, data: { deletedAt: new Date() } })
    .catch(() => null);
  return NextResponse.json({ ok: true });
}
