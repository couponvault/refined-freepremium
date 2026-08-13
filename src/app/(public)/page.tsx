import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/db";
import {
  DEFAULT_ADULT_KEYWORDS,
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SITE_TITLE,
  parseKeywordList,
} from "@/lib/adult-seo";
import { buildMetadata } from "@/lib/seo";
import { publicVideoWhere } from "@/lib/videos";
import {
  buildVideoOrderBy,
  buildVideoWhere,
  type PublicSort,
} from "@/app/api/videos/query";
import VideoCard from "@/components/public/VideoCard";
import VideoGrid from "@/components/public/VideoGrid";
import LoadMore from "@/components/public/LoadMore";
import ContinueRow from "@/components/public/ContinueRow";
import QuickChips from "@/components/public/QuickChips";
import CategoryTile from "@/components/public/CategoryTile";
import HorizontalRail from "@/components/public/HorizontalRail";
import AdSlot from "@/components/public/AdSlot";
import WatchLaterRow from "@/components/public/WatchLater";
import PopularTags from "@/components/public/PopularTags";
import { categoryCoverMap } from "@/lib/site";
import { isAdsDemoMode, resolveAdHtml } from "@/lib/demo-ads";
import { isSafeUrl } from "@/lib/utils";

export const revalidate = 30;

function isAdultSeoCopy(value?: string | null): boolean {
  if (!value?.trim()) return false;
  return /\b(porn|xxx|sex|adult|nsfw|hentai)\b/i.test(value);
}

export async function generateMetadata(): Promise<Metadata> {
  let map: Record<string, string> = {};
  try {
    const settings = await db.setting.findMany({
      where: { key: { in: ["seoTitle", "seoDescription", "seoKeywords"] } },
    });
    map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  } catch {
    // fall back to default adult SEO metadata if DB is unavailable during build
  }
  return buildMetadata({
    title: isAdultSeoCopy(map.seoTitle) ? map.seoTitle : DEFAULT_SITE_TITLE,
    description: isAdultSeoCopy(map.seoDescription)
      ? map.seoDescription
      : DEFAULT_SITE_DESCRIPTION,
    keywords: map.seoKeywords?.trim()
      ? parseKeywordList(map.seoKeywords)
      : DEFAULT_ADULT_KEYWORDS,
    path: "/",
  });
}

function SectionHeading({ title }: { title: string }) {
  return (
    <h2 className="font-display mb-5 flex items-center gap-2.5 text-xl font-extrabold tracking-tight">
      <span className="h-5 w-1 rounded-full bg-gradient-to-b from-accent to-gold" />
      {title}
    </h2>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const sort = (typeof sp.sort === "string" ? sp.sort : "newest") as PublicSort;
  const quality = typeof sp.quality === "string" ? sp.quality : undefined;
  const exclusive = sp.exclusive === "1";
  const minDuration =
    typeof sp.minDuration === "string" ? Number(sp.minDuration) : undefined;
  const filtering = !!(
    (sort && sort !== "newest") ||
    quality ||
    exclusive ||
    (minDuration != null && !Number.isNaN(minDuration))
  );

  const filterWhere = buildVideoWhere(undefined, undefined, {
    quality,
    exclusive: exclusive || undefined,
    minDuration:
      minDuration != null && !Number.isNaN(minDuration) ? minDuration : undefined,
  });

  let featured: any[] = [];
  let trending: any[] = [];
  let latest: any[] = [];
  let filtered: any[] = [];
  let categories: any[] = [];
  let adSettings: any[] = [];

  try {
    [featured, trending, latest, filtered, categories, adSettings] =
      await Promise.all([
        filtering
          ? Promise.resolve([])
          : db.video.findMany({
              where: publicVideoWhere({ featured: true }),
              include: { category: true },
              orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
              take: 6,
            }),
        filtering
          ? Promise.resolve([])
          : db.video.findMany({
              where: publicVideoWhere({ trending: true }),
              include: { category: true },
              orderBy: { createdAt: "desc" },
              take: 8,
            }),
        filtering
          ? Promise.resolve([])
          : db.video.findMany({
              where: publicVideoWhere(),
              include: { category: true },
              orderBy: { createdAt: "desc" },
              take: 18,
            }),
        filtering
          ? db.video.findMany({
              where: filterWhere,
              include: { category: true },
              orderBy: buildVideoOrderBy(sort),
              take: 12,
            })
          : Promise.resolve([]),
        db.category.findMany({
          where: { enabled: true },
          orderBy: { name: "asc" },
        }),
        db.setting.findMany({
          where: { key: { in: ["adsHomeHtml", "adsGridHtml", "adsDemoMode"] } },
        }),
      ]);
  } catch {
    // fall back to empty arrays during build if DB connection is unavailable
  }

  const adsMap = Object.fromEntries(adSettings.map((s) => [s.key, s.value]));
  const demoMode = isAdsDemoMode(adsMap.adsDemoMode);
  const homeAd = resolveAdHtml("home", adsMap.adsHomeHtml, demoMode);
  const gridAd = resolveAdHtml("grid", adsMap.adsGridHtml, demoMode);
  const previewCats = categories.slice(0, 6);
  const hasMoreCats = categories.length > 6;
  const covers = await categoryCoverMap(previewCats.map((c) => c.id));

  const filterTitle =
    sort === "views"
      ? "Most viewed"
      : quality === "1080p"
        ? "HD videos"
        : exclusive
          ? "Exclusive"
          : minDuration
            ? "Long videos"
            : "Videos";

  return (
    <div className="mx-auto max-w-7xl px-4 animate-rise">
      <AdSlot slot="home" html={homeAd} demoMode={demoMode} />

      <header className="mb-2 mt-2">
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
          Free HD Porn Videos
        </h1>
        <p className="mt-1 text-sm text-muted">
          Stream free XXX sex videos &amp; adult clips — no sign-up
        </p>
      </header>

      <div className="mb-8 mt-4">
        <Suspense fallback={null}>
          <QuickChips />
        </Suspense>
      </div>

      {!filtering && (
        <>
          <WatchLaterRow />
          <ContinueRow />
          <PopularTags />
        </>
      )}

      {filtering ? (
        <section className="my-10">
          <SectionHeading title={filterTitle} />
          {filtered.length === 0 ? (
            <p className="text-sm text-muted">No videos match this filter.</p>
          ) : (
            <>
              <VideoGrid>
                {filtered.map((v) => (
                  <VideoCard key={v.id} video={v} />
                ))}
              </VideoGrid>
              <LoadMore
                key={`${sort}-${quality}-${exclusive}-${minDuration}`}
                initialPage={1}
                sort={sort}
                quality={quality}
                exclusive={exclusive || undefined}
                minDuration={
                  minDuration != null && !Number.isNaN(minDuration)
                    ? minDuration
                    : undefined
                }
              />
            </>
          )}
        </section>
      ) : (
        <>
          {featured.length > 0 && (
            <section className="my-10">
              <SectionHeading title="Featured" />
              <VideoGrid>
                {featured.map((v) => (
                  <VideoCard key={v.id} video={v} />
                ))}
              </VideoGrid>
            </section>
          )}

          {trending.length > 0 && (
            <section className="my-10">
              <SectionHeading title="Trending now" />
              <HorizontalRail>
                {trending.map((v) => (
                  <div
                    key={v.id}
                    className="w-[42%] shrink-0 snap-start sm:w-56 md:w-60"
                  >
                    <VideoCard video={v} />
                  </div>
                ))}
              </HorizontalRail>
            </section>
          )}

          {latest.length > 0 && (
            <section className="my-10">
              <SectionHeading title="Latest uploads" />
              <VideoGrid>
                {latest.slice(0, 6).map((v) => (
                  <VideoCard key={v.id} video={v} />
                ))}
              </VideoGrid>
              <AdSlot slot="grid" html={gridAd} demoMode={demoMode} />
              {latest.length > 6 && (
                <div className="mt-10">
                  <SectionHeading title="More videos" />
                  <p className="mb-5 -mt-2 text-xs text-muted">
                    Older uploads move here when newer ones take the Latest
                    slots.
                  </p>
                  <VideoGrid>
                    {latest.slice(6).map((v) => (
                      <VideoCard key={v.id} video={v} />
                    ))}
                  </VideoGrid>
                </div>
              )}
              <LoadMore initialPage={1} />
            </section>
          )}
        </>
      )}

      {previewCats.length > 0 && (
        <section className="my-10 mb-16">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <SectionHeading title="Browse categories" />
            {hasMoreCats && (
              <Link
                href="/categories"
                className="mb-5 text-sm font-medium text-accent hover:text-accent-hover"
              >
                Browse more categories →
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 sm:gap-4">
            {previewCats.map((c) => (
              <CategoryTile
                key={c.id}
                name={c.name}
                slug={c.slug}
                icon={c.icon}
                imageUrl={
                  c.imageUrl && isSafeUrl(c.imageUrl)
                    ? c.imageUrl
                    : covers.get(c.id)
                }
              />
            ))}
          </div>
          {hasMoreCats && (
            <div className="mt-6 text-center">
              <Link
                href="/categories"
                className="inline-flex rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-accent/40 hover:text-accent"
              >
                Browse more categories
              </Link>
            </div>
          )}
        </section>
      )}

      <section className="my-12 border-t border-border pt-10">
        <h2 className="font-display text-lg font-bold tracking-tight">
          Free porn tube — XXX videos online
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
          FreePremium is a free adult tube for HD porn videos, XXX sex videos,
          and scenes with popular pornstars. Browse categories, tags, and
          performer pages — stream premium adult videos online with no
          sign-up. Content is 18+ only and updated daily for fast free porn
          streaming.
        </p>
        <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
          <Link href="/categories" className="hover:text-accent">
            Free porn categories
          </Link>
          <Link href="/performers" className="hover:text-accent">
            Pornstars
          </Link>
          <Link href="/tags" className="hover:text-accent">
            Popular XXX tags
          </Link>
        </p>
      </section>
    </div>
  );
}
