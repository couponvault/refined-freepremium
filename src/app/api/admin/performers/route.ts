import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { isAllowedMediaUrl, slugify } from "@/lib/utils";
import type { PerformerInput } from "@/types";

function bustPerformerCache() {
  revalidatePath("/", "layout");
  revalidatePath("/performers");
  revalidatePath("/admin/videos/csv-maker");
  revalidatePath("/admin/videos/new");
}

export async function GET() {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const performers = await db.performer.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { videos: true } } },
  });
  return NextResponse.json(performers);
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as PerformerInput;
  const name = (body.name ?? "").trim();
  if (!name)
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  const base = slugify((body.slug ?? "").trim() || name) || "performer";
  let slug = base;
  for (let i = 2; ; i++) {
    if (
      !(await db.performer.findUnique({ where: { slug }, select: { id: true } }))
    )
      break;
    slug = `${base}-${i}`;
  }
  const imageUrl = (body.imageUrl ?? "").trim();
  if (imageUrl && !isAllowedMediaUrl(imageUrl)) {
    return NextResponse.json(
      { error: "Performer image must be a valid http(s) URL" },
      { status: 400 }
    );
  }
  const performer = await db.performer.create({
    data: {
      name,
      slug,
      imageUrl,
      description: (body.description ?? "").trim(),
      enabled: body.enabled ?? true,
    },
    include: { _count: { select: { videos: true } } },
  });
  bustPerformerCache();
  return NextResponse.json(performer, { status: 201 });
}
