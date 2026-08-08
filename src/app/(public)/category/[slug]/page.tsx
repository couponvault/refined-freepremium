import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { categorySeo } from "@/lib/adult-seo";
import { buildMetadata, breadcrumbJsonLd, itemListJsonLd, jsonLdScript } from "@/lib/seo";
import {
  buildVideoOrderBy,
  buildVideoWhere,
  type PublicSort,
} from "@/app/api/videos/query";
import VideoCard from "@/components/public/VideoCard";
import VideoGrid from "@/components/public/VideoGrid";
import VideoFilters from "@/components/public/VideoFilters";

export const revalidate = 60;

const PAGE_SIZE = 24;
const SORTS = new Set<PublicSort>(["newest", "oldest", "views", "title"]);

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    page?: string;
    sort?: string;
    quality?: string;
    exclusive?: string;
  }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const category = await db.category.findFirst({
    where: { slug, enabled: true },
  });
  if (!category) return {};
  const seo = categorySeo(category.name, category.description);
  const title = page > 1 ? `${seo.title} – Page ${page}` : seo.title;
  return buildMetadata({
    title,
    description: seo.description,
    keywords: seo.keywords,
    path:
      page > 1
        ? `/category/${category.slug}?page=${page}`
        : `/category/${category.slug}`,
  });
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const sort = SORTS.has(sp.sort as PublicSort)
    ? (sp.sort as PublicSort)
    : "newest";
  const quality = sp.quality || undefined;
  const exclusive = sp.exclusive === "1";

  const category = await db.category.findFirst({
    where: { slug, enabled: true },
  });
  if (!category) notFound();

  const where = buildVideoWhere(undefined, category.slug, {
    quality,
    exclusive: exclusive || undefined,
  });
  const [videos, total] = await Promise.all([
    db.video.findMany({
      where,
      include: { category: true },
      orderBy: buildVideoOrderBy(sort),
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.video.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Categories", path: "/categories" },
    { name: category.name, path: `/category/${category.slug}` },
  ];

  const filterQs = new URLSearchParams();
  if (sort !== "newest") filterQs.set("sort", sort);
  if (quality) filterQs.set("quality", quality);
  if (exclusive) filterQs.set("exclusive", "1");
  const filterSuffix = filterQs.toString() ? `&${filterQs.toString()}` : "";

  const pageLink =
    "rounded-full border border-border bg-surface px-4 py-2 text-sm transition-colors hover:bg-surface-hover hover:border-accent/40";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(breadcrumbJsonLd(crumbs)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            itemListJsonLd(
              `${category.name} Videos`,
              `/category/${category.slug}`,
              videos.map((v) => ({
                name: v.title,
                path: `/video/${v.slug}`,
                image: v.thumbnail,
              }))
            )
          ),
        }}
      />

      <nav className="mb-4 flex items-center gap-1 text-xs text-muted">
        <Link href="/" className="hover:text-accent">
          Home
        </Link>
        <span>/</span>
        <Link href="/categories" className="hover:text-accent">
          Categories
        </Link>
        <span>/</span>
        <span className="text-foreground">{category.name}</span>
      </nav>

      <header className="mb-5 flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-3xl">
          {category.icon}
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Free {category.name} Porn Videos
          </h1>
          <p className="text-sm text-muted">
            {total} HD video{total === 1 ? "" : "s"} · free XXX streaming
          </p>
        </div>
      </header>

      <p className="mb-5 max-w-2xl text-sm leading-relaxed text-muted">
        {category.description?.trim() ||
          `Watch free ${category.name.toLowerCase()} porn videos in HD. Stream ${category.name.toLowerCase()} XXX sex videos online on FreePremium — no sign-up.`}
      </p>

      <Suspense fallback={null}>
        <VideoFilters />
      </Suspense>

      {videos.length > 0 ? (
        <VideoGrid>
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </VideoGrid>
      ) : (
        <p className="py-16 text-center text-muted">No videos here yet.</p>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3 text-sm">
          {page > 1 ? (
            <Link
              href={`/category/${slug}?page=${page - 1}${filterSuffix}`}
              className={pageLink}
            >
              ← Previous
            </Link>
          ) : (
            <span className={`${pageLink} opacity-40 pointer-events-none`}>
              ← Previous
            </span>
          )}
          <span className="text-muted">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={`/category/${slug}?page=${page + 1}${filterSuffix}`}
              className={pageLink}
            >
              Next →
            </Link>
          ) : (
            <span className={`${pageLink} opacity-40 pointer-events-none`}>
              Next →
            </span>
          )}
        </div>
      )}
    </div>
  );
}
