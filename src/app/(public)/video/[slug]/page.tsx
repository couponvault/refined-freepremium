import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  videoKeywords,
  videoSeoDescription,
  videoSeoTitle,
} from "@/lib/adult-seo";
import {
  buildMetadata,
  breadcrumbJsonLd,
  videoJsonLd,
  jsonLdScript,
  SITE_URL,
} from "@/lib/seo";
import { formatDate, formatViews, parseTags, tagSlug } from "@/lib/utils";
import { publicVideoWhere } from "@/lib/videos";
import ShareButtons from "@/components/public/ShareButtons";
import ReportVideo from "@/components/public/ReportVideo";
import { WatchLaterButton } from "@/components/public/WatchLater";
import UpNext from "@/components/public/UpNext";
import AdSlot from "@/components/public/AdSlot";
import RelatedVideos from "@/components/public/RelatedVideos";
import VideoWatchClient from "@/components/public/VideoWatchClient";
import ViewsNotice from "@/components/public/ViewsNotice";
import { isAdsDemoMode, resolveAdHtml } from "@/lib/demo-ads";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

const getVideo = cache(async (slug: string) => {
  return await db.video.findFirst({
    where: publicVideoWhere({ slug }),
    include: {
      category: true,
      videoCategories: {
        include: { category: true },
        where: { category: { enabled: true } },
      },
      performers: {
        include: { performer: true },
        where: { performer: { enabled: true } },
      },
    },
  });
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const video = await getVideo(slug);
  if (!video) return {};
  const cats = (() => {
    const fromLinks = video.videoCategories
      .map((vc) => vc.category)
      .filter(Boolean);
    if (fromLinks.length) return fromLinks;
    return video.category ? [video.category] : [];
  })();
  const stars = video.performers.map((vp) => vp.performer.name);
  const tags = parseTags(video.tags);
  const primary = cats[0]?.name ?? null;
  return buildMetadata({
    title: videoSeoTitle(video.title, {
      seoTitle: video.seoTitle,
      categoryName: primary,
    }),
    description: videoSeoDescription(video.title, {
      seoDescription: video.seoDescription,
      description: video.description,
      categoryName: primary,
      performerNames: stars,
    }),
    keywords: videoKeywords({
      tags,
      categoryNames: cats.map((c) => c.name),
      performerNames: stars,
    }),
    path: `/video/${video.slug}`,
    image: video.thumbnail,
    type: "video.other",
  });
}

export default async function VideoPage({ params }: Props) {
  const { slug } = await params;
  const video = await getVideo(slug);
  if (!video) notFound();
  
  const videoPerformers = video.performers.map((vp) => vp.performer);
  const videoCats = (() => {
    const fromLinks = video.videoCategories
      .map((vc) => vc.category)
      .filter(Boolean);
    if (fromLinks.length) return fromLinks;
    return video.category ? [video.category] : [];
  })();
  const videoCatIds = new Set(videoCats.map((c) => c.id));

  const tags = parseTags(video.tags);
  const tagSet = new Set(tags.map((t) => tagSlug(t)));

  const [candidates, settings] = await Promise.all([
    db.video.findMany({
      where: publicVideoWhere({ id: { not: video.id } }),
      include: { category: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.setting.findMany({
      where: {
        key: { in: ["adsHeaderHtml", "adsSidebarHtml", "adsDemoMode"] },
      },
    })
  ]);

  const scored = candidates
    .map((v) => {
      const vt = parseTags(v.tags);
      const overlap = vt.filter((t) => tagSet.has(tagSlug(t))).length;
      const sameCat =
        v.categoryId != null && videoCatIds.has(v.categoryId) ? 1 : 0;
      return { v, score: overlap * 10 + sameCat };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.v);

  let related = scored.slice(0, 8);
  if (related.length < 8) {
    const have = new Set(related.map((r) => r.id));
    for (const c of candidates) {
      if (have.has(c.id)) continue;
      related.push(c);
      if (related.length >= 8) break;
    }
  }

  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const demoMode = isAdsDemoMode(settingsMap.adsDemoMode);
  const headerAd = resolveAdHtml("header", settingsMap.adsHeaderHtml, demoMode);
  const sidebarAd = resolveAdHtml(
    "sidebar",
    settingsMap.adsSidebarHtml,
    demoMode
  );

  const url = `${SITE_URL}/video/${video.slug}`;
  const primaryCat = videoCats[0] ?? video.category;
  const crumbs = [
    { name: "Home", path: "/" },
    ...(primaryCat
      ? [{ name: primaryCat.name, path: `/category/${primaryCat.slug}` }]
      : []),
    { name: video.title, path: `/video/${video.slug}` },
  ];

  const relatedCards = related.map((v) => ({
    slug: v.slug,
    title: v.title,
    thumbnail: v.thumbnail,
    views: v.views,
    createdAt: v.createdAt,
    duration: v.duration,
    quality: v.quality,
    exclusive: v.exclusive,
    category: v.category,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            videoJsonLd(video, {
              performers: videoPerformers,
              categoryNames: videoCats.map((c) => c.name),
            })
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(breadcrumbJsonLd(crumbs)),
        }}
      />

      <nav className="mb-4 flex flex-wrap items-center gap-1 text-xs text-muted">
        <Link href="/" className="hover:text-accent">
          Home
        </Link>
        {primaryCat && (
          <>
            <span>/</span>
            <Link
              href={`/category/${primaryCat.slug}`}
              className="hover:text-accent"
            >
              {primaryCat.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-foreground line-clamp-1">{video.title}</span>
      </nav>

      <AdSlot slot="header" html={headerAd} demoMode={demoMode} />

      <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-6">
        <div>
          <VideoWatchClient
            slug={video.slug}
            title={video.title}
            thumbnail={video.thumbnail}
            embedUrl={video.embedUrl}
            exclusive={video.exclusive}
            durationSec={video.duration}
            next={
              related[0]
                ? {
                    slug: related[0].slug,
                    title: related[0].title,
                    thumbnail: related[0].thumbnail,
                  }
                : null
            }
          />

          <div className="lg:hidden">
            <UpNext
              items={related.slice(0, 5).map((v) => ({
                slug: v.slug,
                title: v.title,
                thumbnail: v.thumbnail,
              }))}
            />
          </div>

          <h1 className="mt-6 text-2xl font-bold tracking-tight">{video.title}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted">
            {videoCats.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
              >
                {c.icon} {c.name}
              </Link>
            ))}
            {video.quality && (
              <span className="rounded-full bg-surface-hover px-2.5 py-0.5 text-xs">
                {video.quality}
              </span>
            )}
            {video.exclusive && (
              <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-bold text-gold">
                EXCL
              </span>
            )}
            <span>{formatDate(video.createdAt)}</span>
            <span
              className="flex items-center gap-1"
              title="Site-managed views — not from the embed host"
            >
              <span className="h-1 w-1 rounded-full bg-gold" />
              {formatViews(video.views)} views
            </span>
          </div>
          <ViewsNotice className="mt-2" />

          {videoPerformers.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
                Performers
              </p>
              <div className="flex flex-wrap gap-3">
                {videoPerformers.map((p) => (
                  <Link
                    key={p.id}
                    href={`/performer/${p.slug}`}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-2.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-accent/40 hover:bg-surface-hover"
                  >
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imageUrl}
                        alt=""
                        className="h-7 w-7 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
                        {p.name.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    {p.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {tags.map((t) => (
                <Link
                  key={t}
                  href={`/tag/${tagSlug(t)}`}
                  className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-accent hover:border-accent/40 hover:bg-surface-hover"
                >
                  #{t}
                </Link>
              ))}
            </div>
          )}

          {video.description && (
            <p className="mt-4 text-sm leading-relaxed text-muted whitespace-pre-line">
              {video.description}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <ShareButtons url={url} title={video.title} />
            <WatchLaterButton
              slug={video.slug}
              title={video.title}
              thumbnail={video.thumbnail}
            />
            <ReportVideo videoId={video.id} />
          </div>
        </div>

        <div className="mt-6 hidden lg:mt-0 lg:block">
          <AdSlot slot="sidebar" html={sidebarAd} demoMode={demoMode} />
          <div className="sticky top-20">
            <UpNext
              items={related.slice(0, 8).map((v) => ({
                slug: v.slug,
                title: v.title,
                thumbnail: v.thumbnail,
              }))}
            />
          </div>
        </div>
      </div>

      <RelatedVideos videos={relatedCards} />
    </div>
  );
}
