import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publicVideoWhere } from "@/lib/videos";
import { clientIp, rateLimit } from "@/lib/security";

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const ip = clientIp(req);
  if (!rateLimit(`view:${ip}`, 120, 60 * 60 * 1000)) {
    return NextResponse.json({ ok: true, counted: false });
  }

  const { slug } = await ctx.params;
  const video = await db.video.findFirst({
    where: publicVideoWhere({ slug }),
    select: { id: true },
  });
  if (!video) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const cookie = `fp_v_${video.id}`;
  if (req.cookies.get(cookie)?.value === "1") {
    return NextResponse.json({ ok: true, counted: false });
  }

  await db.video.update({
    where: { id: video.id },
    data: { views: { increment: 1 } },
  });

  const res = NextResponse.json({ ok: true, counted: true });
  res.cookies.set(cookie, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 18,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
