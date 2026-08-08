import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const status = req.nextUrl.searchParams.get("status");
  const items = await db.dmcaRequest.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json(items);
}

async function update(req: NextRequest) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as {
    id?: number;
    status?: string;
    process?: boolean;
  };
  const id = Number(body.id);
  if (!Number.isInteger(id))
    return NextResponse.json({ error: "id is required" }, { status: 400 });

  const existing = await db.dmcaRequest.findUnique({ where: { id } });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.process) {
    const url = existing.url;
    let slug = "";
    try {
      const u = new URL(url, "https://example.com");
      const parts = u.pathname.split("/").filter(Boolean);
      const vi = parts.indexOf("video");
      slug = vi >= 0 && parts[vi + 1] ? parts[vi + 1] : parts[parts.length - 1] ?? "";
    } catch {
      slug = url.split("/").filter(Boolean).pop() ?? "";
    }
    slug = decodeURIComponent(slug.split("?")[0] ?? "");
    if (slug) {
      await db.video.updateMany({
        where: { OR: [{ slug }, { slug: { contains: slug } }] },
        data: { dmcaClaimed: true, published: false },
      });
    }
    const item = await db.dmcaRequest.update({
      where: { id },
      data: { status: "processed" },
    });
    return NextResponse.json(item);
  }

  const status = (body.status ?? "").trim();
  if (!["open", "processed", "dismissed", "resolved"].includes(status))
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  const item = await db.dmcaRequest.update({
    where: { id },
    data: { status },
  });
  return NextResponse.json(item);
}

export async function PATCH(req: NextRequest) {
  return update(req);
}

export async function POST(req: NextRequest) {
  return update(req);
}
