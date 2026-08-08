import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { isAllowedMediaUrl, slugify } from "@/lib/utils";
import type { CategoryInput } from "@/types";

function bustPublicCategoryCache() {
  revalidatePath("/", "layout");
  revalidatePath("/");
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
  const existing = await db.category.findUnique({ where: { id } });
  if (!existing)
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as Partial<CategoryInput>;
  const data: Prisma.CategoryUpdateInput = {};
  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name)
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    data.name = name;
    // Keep slug in sync when renamed (unless explicitly provided).
    const base = slugify((body.slug ?? "").trim() || name) || "category";
    let slug = base;
    for (let i = 2; ; i++) {
      const other = await db.category.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!other || other.id === id) break;
      slug = `${base}-${i}`;
    }
    data.slug = slug;
  }
  if (body.icon !== undefined) data.icon = body.icon.trim() || "🎬";
  if (body.imageUrl !== undefined) {
    const imageUrl = body.imageUrl.trim();
    if (imageUrl && !isAllowedMediaUrl(imageUrl)) {
      return NextResponse.json(
        { error: "Category image must be a valid http(s) URL" },
        { status: 400 }
      );
    }
    data.imageUrl = imageUrl;
  }
  if (body.order !== undefined) {
    const order = Number(body.order);
    if (!Number.isInteger(order))
      return NextResponse.json({ error: "Order must be an integer" }, { status: 400 });
    data.order = order;
  }
  if (body.enabled !== undefined) data.enabled = !!body.enabled;
  if (body.description !== undefined) data.description = body.description.trim();
  const category = await db.category.update({
    where: { id },
    data,
    include: { _count: { select: { videos: true } } },
  });
  bustPublicCategoryCache();
  revalidatePath("/categories");
  return NextResponse.json(category);
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
  await db.category.delete({ where: { id } }).catch(() => null);
  bustPublicCategoryCache();
  revalidatePath("/categories");
  return NextResponse.json({ ok: true });
}
