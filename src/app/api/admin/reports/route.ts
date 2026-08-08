import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const status = req.nextUrl.searchParams.get("status");
  const reports = await db.report.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      video: { select: { id: true, title: true, slug: true, published: true } },
    },
    take: 200,
  });
  return NextResponse.json(reports);
}

async function updateStatus(req: NextRequest) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as {
    id?: number;
    status?: string;
  };
  const id = Number(body.id);
  if (!Number.isInteger(id))
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  const status = (body.status ?? "").trim();
  if (!["open", "resolved", "dismissed"].includes(status))
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  const report = await db.report.update({
    where: { id },
    data: { status },
    include: {
      video: { select: { id: true, title: true, slug: true, published: true } },
    },
  });
  return NextResponse.json(report);
}

export async function PATCH(req: NextRequest) {
  return updateStatus(req);
}

export async function POST(req: NextRequest) {
  return updateStatus(req);
}
