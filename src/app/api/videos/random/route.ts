import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publicVideoWhere } from "@/lib/videos";

/** Returns a random published video slug for “Surprise me”. */
export async function GET() {
  const total = await db.video.count({ where: publicVideoWhere() });
  if (total === 0) {
    return NextResponse.json({ error: "No videos" }, { status: 404 });
  }
  const skip = Math.floor(Math.random() * total);
  const [video] = await db.video.findMany({
    where: publicVideoWhere(),
    skip,
    take: 1,
    select: { slug: true, title: true },
  });
  if (!video) {
    return NextResponse.json({ error: "No videos" }, { status: 404 });
  }
  return NextResponse.json(video);
}
