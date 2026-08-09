import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { performerSeo } from "@/lib/adult-seo";
import {
  buildMetadata,
  breadcrumbJsonLd,
  itemListJsonLd,
  jsonLdScript,
  personJsonLd,
} from "@/lib/seo";
import { isSafeUrl } from "@/lib/utils";
import { publicVideoWhere } from "@/lib/videos";
import VideoCard from "@/components/public/VideoCard";
import VideoGrid from "@/components/public/VideoGrid";

export const revalidate = 60;

const PAGE_SIZE = 24;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const performer = await db.performer.findFirst({
    where: { slug, enabled: true },
  });
  if (!performer) return {};
  const seo = performerSeo(performer.name, performer.description);
  const title = page > 1 ? `${seo.title} – Page ${page}` : seo.title;
  return buildMetadata({
    title,
    description: seo.description,
    keywords: seo.keywords,
    path:
      page > 1
        ? `/performer/${performer.slug}?page=${page}`
        : `/performer/${performer.slug}`,
    image: performer.imageUrl || undefined,
  });
}

export default async function PerformerPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const performer = await db.performer.findFirst({
    where: { slug, enabled: true },
  });
  if (!performer) notFound();

  const where = publicVideoWhere({
    performers: { some: { performerId: performer.id } },
  });

  const [total, videos] = await Promise.all([
    db.video.count({ where }),
    db.video.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  if (total === 0 && page > 1) notFound();

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE) || 1);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Pornstars", path: "/performers" },
    { name: performer.name, path: `/performer/${performer.slug}` },
  ];

  const pageLink =
    "rounded-full border border-border bg-surface px-4 py-2 text-sm transition-colors hover:bg-surface-hover hover:border-accent/40";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 animate-rise">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(breadcrumbJsonLd(crumbs)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(personJsonLd(performer)),
        }}
      />
      {videos.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdScript(
              itemListJsonLd(
                `${performer.name} Videos`,
                `/performer/${performer.slug}`,
                videos.map((v) => ({
                  name: v.title,
                  path: `/video/${v.slug}`,
                  image: v.thumbnail,
                }))
              )
            ),
          }}
        />
      )}

      <nav className="mb-6 flex flex-wrap items-center gap-1 text-xs text-muted">
        <Link href="/" className="hover:text-accent">
          Home
        </Link>
        <span>/</span>
        <Link href="/performers" className="hover:text-accent">
          Pornstars
        </Link>
        <span>/</span>
        <span className="text-foreground">{performer.name}</span>
      </nav>

      <header className="mb-10 flex flex-wrap items-center gap-5">
        {performer.imageUrl && isSafeUrl(performer.imageUrl) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={performer.imageUrl}
            alt={performer.name}
            className="h-28 w-28 rounded-full border border-border object-cover sm:h-32 sm:w-32"
          />
        ) : (
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-accent/15 text-3xl font-bold text-accent sm:h-32 sm:w-32">
            {performer.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            {performer.name} Porn Videos
          </h1>
          <p className="mt-1 text-sm text-muted">
            {total} free HD video{total === 1 ? "" : "s"}
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            {performer.description?.trim() ||
              `Watch free ${performer.name} porn videos and XXX scenes in HD on FreePremium.`}
          </p>
        </div>
      </header>

      {videos.length === 0 ? (
        <p className="text-sm text-muted">No videos for this performer yet.</p>
      ) : (
        <VideoGrid>
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </VideoGrid>
      )}

      {totalPages > 1 && (
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={
                page === 2
                  ? `/performer/${performer.slug}`
                  : `/performer/${performer.slug}?page=${page - 1}`
              }
              className={pageLink}
            >
              ← Prev
            </Link>
          )}
          <span className="px-2 text-sm text-muted">
            Page {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/performer/${performer.slug}?page=${page + 1}`}
              className={pageLink}
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
