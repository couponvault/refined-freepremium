import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/seo";
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

/**
 * Google Video Sitemap — dedicated feed so Search Console can discover
 * every video URL with title, thumbnail, description, duration, embed.
 * @see https://developers.google.com/search/docs/crawling-indexing/sitemaps/video-sitemaps
 */
export async function GET() {
  const videos = await db.video.findMany({
    where: publicVideoWhere(),
    select: {
      slug: true,
      title: true,
      seoTitle: true,
      seoDescription: true,
      description: true,
      thumbnail: true,
      embedUrl: true,
      duration: true,
      createdAt: true,
      updatedAt: true,
      views: true,
      exclusive: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const urls = videos
    .map((v) => {
      const loc = `${SITE_URL}/video/${v.slug}`;
      const title = esc((v.seoTitle || v.title).slice(0, 100));
      const description = esc(
        (v.seoDescription || v.description || v.title).slice(0, 2048)
      );
      const thumb = esc(v.thumbnail);
      const player = esc(v.embedUrl);
      const duration =
        v.duration > 0 ? `\n      <video:duration>${Math.floor(v.duration)}</video:duration>` : "";
      const family = `\n      <video:family_friendly>no</video:family_friendly>`;
      const live = `\n      <video:live>no</video:live>`;
      const pub = `\n      <video:publication_date>${v.createdAt.toISOString()}</video:publication_date>`;
      const views =
        v.views > 0
          ? `\n      <video:view_count>${v.views}</video:view_count>`
          : "";
      const requires =
        v.exclusive
          ? `\n      <video:requires_subscription>yes</video:requires_subscription>`
          : `\n      <video:requires_subscription>no</video:requires_subscription>`;

      return `  <url>
    <loc>${esc(loc)}</loc>
    <lastmod>${v.updatedAt.toISOString()}</lastmod>
    <video:video>
      <video:thumbnail_loc>${thumb}</video:thumbnail_loc>
      <video:title>${title}</video:title>
      <video:description>${description}</video:description>
      <video:player_loc allow_embed="yes">${player}</video:player_loc>${duration}${pub}${views}${family}${requires}${live}
    </video:video>
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
