import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/security";

const REASONS = new Set(["broken", "copyright", "illegal", "spam", "other"]);

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (!rateLimit(`report:${ip}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many reports" }, { status: 429 });
  }

  let body: {
    videoId?: number;
    reason?: string;
    details?: string;
    email?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const videoId = Number(body.videoId);
  const reason = (body.reason ?? "").trim().toLowerCase();
  const details = (body.details ?? "").trim().slice(0, 2000);
  const email = (body.email ?? "").trim().slice(0, 200);

  if (!Number.isInteger(videoId) || videoId < 1) {
    return NextResponse.json({ error: "Invalid videoId" }, { status: 400 });
  }
  if (!REASONS.has(reason)) {
    return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const video = await db.video.findUnique({ where: { id: videoId } });
  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  await db.report.create({
    data: { videoId, reason, details, email },
  });

  return NextResponse.json({ ok: true });
}
