import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { enforceFeaturedLimit } from "@/lib/featured";

export async function POST(req: NextRequest) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as {
    ids?: unknown;
    action?: string;
  };
  const ids = Array.isArray(body.ids)
    ? body.ids.map(Number).filter(Number.isInteger)
    : [];
  if (ids.length === 0)
    return NextResponse.json({ error: "ids is required" }, { status: 400 });
  const where = { id: { in: ids } };
  switch (body.action) {
    case "delete":
      await db.video.updateMany({ where, data: { deletedAt: new Date() } });
      break;
    case "restore":
      await db.video.updateMany({ where, data: { deletedAt: null } });
      break;
    case "purge":
      await db.video.deleteMany({ where });
      break;
    case "publish":
      await db.video.updateMany({ where, data: { published: true } });
      break;
    case "unpublish":
      await db.video.updateMany({ where, data: { published: false } });
      break;
    case "exclusive":
      await db.video.updateMany({ where, data: { exclusive: true } });
      break;
    case "unexclusive":
      await db.video.updateMany({ where, data: { exclusive: false } });
      break;
    case "feature":
      await db.video.updateMany({ where, data: { featured: true } });
      await enforceFeaturedLimit();
      break;
    case "unfeature":
      await db.video.updateMany({ where, data: { featured: false } });
      break;
    case "trend":
      await db.video.updateMany({ where, data: { trending: true } });
      break;
    case "untrend":
      await db.video.updateMany({ where, data: { trending: false } });
      break;
    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
