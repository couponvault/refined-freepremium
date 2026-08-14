import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { fuzzyRank } from "@/lib/fuzzy";
import { searchPublicVideos } from "@/lib/search";
import { buildMetadata } from "@/lib/seo";
import { isSafeUrl } from "@/lib/utils";
import type { PublicSort } from "@/app/api/videos/query";
import VideoCard from "@/components/public/VideoCard";
import VideoGrid from "@/components/public/VideoGrid";
import LoadMore from "@/components/public/LoadMore";
import VideoFilters from "@/components/public/VideoFilters";

export const revalidate = 60;

const PAGE_SIZE = 12;
const SORTS = new Set<PublicSort>(["newest", "oldest", "views", "title"]);

type Sp = {
  q?: string;
  sort?: string;
  quality?: string;
  exclusive?: string;
  minDuration?: string;
  maxDuration?: string;
};

type Props = { searchParams: Promise<Sp> };

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return buildMetadata({
    title: q ? `Search: ${q}` : "Search Free Porn Videos",
    description: q
      ? `Search results for “${q}” — free HD porn and XXX videos on FreePremium.`
      : "Search free HD porn videos, XXX sex videos, and pornstars on FreePremium.",
    path: "/search",
    index: false,
    follow: true,
  });
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const query = sp.q?.trim();
  const sort = SORTS.has(sp.sort as PublicSort)
    ? (sp.sort as PublicSort)
    : "newest";
  const quality = sp.quality || undefined;
  const exclusive = sp.exclusive === "1";
  const minDuration =
    sp.minDuration != null && sp.minDuration !== ""
      ? parseInt(sp.minDuration, 10)
      : undefined;
  const maxDuration =
    sp.maxDuration != null && sp.maxDuration !== ""
      ? parseInt(sp.maxDuration, 10)
      : undefined;

  if (!query) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Search</h1>
        <p className="mt-2 text-muted">
          Type something in the search bar above to find videos.
        </p>
      </div>
    );
  }

  const [{ items: videos, total }, performerPool] = await Promise.all([
    searchPublicVideos({
      q: query,
      page: 1,
      pageSize: PAGE_SIZE,
      sort,
      quality: quality || undefined,
      exclusive: exclusive || undefined,
      minDuration: Number.isFinite(minDuration) ? minDuration : undefined,
      maxDuration: Number.isFinite(maxDuration) ? maxDuration : undefined,
    }),
    db.performer.findMany({
      where: { enabled: true },
      select: { name: true, slug: true, imageUrl: true },
      take: 600,
    }),
  ]);

  const closePerformers = fuzzyRank(performerPool, query, (p) => p.name, {
    limit: 6,
    minScore: 55,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold">
        {total} result{total === 1 ? "" : "s"} for &ldquo;{query}&rdquo;
      </h1>
      <p className="mb-4 -mt-2 text-xs text-muted">
        Includes close matches for typos and similar spellings.
      </p>
      <Suspense fallback={null}>
        <VideoFilters preserve={{ q: query }} />
      </Suspense>

      {closePerformers.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Matching pornstars
          </h2>
          <ul className="flex flex-wrap gap-3">
            {closePerformers.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/performer/${p.slug}`}
                  className="flex items-center gap-2 rounded-full border border-border bg-surface px-2.5 py-1.5 text-sm transition-colors hover:border-accent/40 hover:text-accent"
                >
                  {p.imageUrl && isSafeUrl(p.imageUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt=""
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
                      {p.name.slice(0, 1)}
                    </span>
                  )}
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {videos.length > 0 ? (
        <>
          <VideoGrid>
            {videos.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </VideoGrid>
          {total > PAGE_SIZE && (
            <LoadMore
              initialPage={1}
              excludeSlugs={videos.map((v) => v.slug)}
              q={query}
              sort={sort}
              quality={quality}
              exclusive={exclusive}
              minDuration={
                Number.isFinite(minDuration) ? minDuration : undefined
              }
              maxDuration={
                Number.isFinite(maxDuration) ? maxDuration : undefined
              }
            />
          )}
        </>
      ) : (
        <p className="py-16 text-center text-muted">
          Nothing close enough. Try fewer letters or a different spelling.
        </p>
      )}
    </div>
  );
}
