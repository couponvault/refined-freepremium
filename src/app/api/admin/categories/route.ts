import { NextRequest, NextResponse } from "next/server";
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

export async function GET() {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { videos: true } } },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as CategoryInput;
  const name = (body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  const base = slugify((body.slug ?? "").trim() || name) || "category";
  let slug = base;
  for (let i = 2; ; i++) {
    if (!(await db.category.findUnique({ where: { slug }, select: { id: true } })))
      break;
    slug = `${base}-${i}`;
  }
  const imageUrl = (body.imageUrl ?? "").trim();
  if (imageUrl && !isAllowedMediaUrl(imageUrl)) {
    return NextResponse.json(
      { error: "Category image must be a valid http(s) URL" },
      { status: 400 }
    );
  }
  const category = await db.category.create({
    data: {
      name,
      slug,
      icon: (body.icon ?? "").trim() || "🎬",
      imageUrl,
      order: Number.isInteger(Number(body.order)) ? Number(body.order) : 0,
      enabled: body.enabled ?? true,
      description: (body.description ?? "").trim(),
    },
    include: { _count: { select: { videos: true } } },
  });
  bustPublicCategoryCache();
  revalidatePath("/categories");
  return NextResponse.json(category, { status: 201 });
}
