import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { isAllowedMediaUrl, slugify } from "@/lib/utils";
import type { PerformerInput } from "@/types";

function bustPerformerCache(slug?: string) {
  revalidatePath("/", "layout");
  revalidatePath("/performers");
  if (slug) revalidatePath(`/performer/${slug}`);
  revalidatePath("/admin/videos/csv-maker");
  revalidatePath("/admin/videos/new");
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isInteger(id))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const existing = await db.performer.findUnique({ where: { id } });
  if (!existing)
    return NextResponse.json({ error: "Performer not found" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as Partial<PerformerInput>;
  const data: Prisma.PerformerUpdateInput = {};
  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name)
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    data.name = name;
    const base = slugify((body.slug ?? "").trim() || name) || "performer";
    let slug = base;
    for (let i = 2; ; i++) {
      const other = await db.performer.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!other || other.id === id) break;
      slug = `${base}-${i}`;
    }
    data.slug = slug;
  }
  if (body.imageUrl !== undefined) {
    const imageUrl = body.imageUrl.trim();
    if (imageUrl && !isAllowedMediaUrl(imageUrl)) {
      return NextResponse.json(
        { error: "Performer image must be a valid http(s) URL" },
        { status: 400 }
      );
    }
    data.imageUrl = imageUrl;
  }
  if (body.description !== undefined)
    data.description = body.description.trim();
  if (body.enabled !== undefined) data.enabled = !!body.enabled;

  const performer = await db.performer.update({
    where: { id },
    data,
    include: { _count: { select: { videos: true } } },
  });
  bustPerformerCache(performer.slug);
  if (existing.slug !== performer.slug) bustPerformerCache(existing.slug);
  return NextResponse.json(performer);
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
  const existing = await db.performer.findUnique({ where: { id } });
  await db.performer.delete({ where: { id } }).catch(() => null);
  if (existing) bustPerformerCache(existing.slug);
  else bustPerformerCache();
  return NextResponse.json({ ok: true });
}
