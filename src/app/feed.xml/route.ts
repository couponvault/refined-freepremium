import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import { publicVideoWhere } from "@/lib/videos";

export const dynamic = "force-dynamic";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  let videos: {
    slug: string;
    title: string;
    seoTitle: string | null;
    seoDescription: string | null;
    description: string | null;
    thumbnail: string;
    createdAt: Date;
  }[] = [];

  try {
    videos = await db.video.findMany({
      where: publicVideoWhere(),
      select: {
        slug: true,
        title: true,
        seoTitle: true,
        seoDescription: true,
        description: true,
        thumbnail: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  } catch {
    // fallback empty array if DB unavailable
  }

  const itemsXml = videos
    .map((v) => {
      const link = `${SITE_URL}/video/${v.slug}`;
      const title = esc(v.seoTitle || v.title);
      const description = esc(
        (v.seoDescription || v.description || v.title).slice(0, 500)
      );
      const pubDate = new Date(v.createdAt).toUTCString();

      return `    <item>
      <title>${title}</title>
      <link>${esc(link)}</link>
      <guid isPermaLink="true">${esc(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
      <media:thumbnail url="${esc(v.thumbnail)}" />
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${esc(SITE_NAME)} - Latest Free Adult Videos</title>
    <link>${esc(SITE_URL)}</link>
    <description>Latest HD adult videos, free porn clips, and exclusive XXX streams.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
    },
  });
}
