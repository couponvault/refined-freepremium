import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { tagSeo } from "@/lib/adult-seo";
import { buildMetadata, breadcrumbJsonLd, itemListJsonLd, jsonLdScript } from "@/lib/seo";
import { parseTags, tagSlug } from "@/lib/utils";
import { publicVideoWhere } from "@/lib/videos";
import VideoCard from "@/components/public/VideoCard";
import VideoGrid from "@/components/public/VideoGrid";

export const revalidate = 60;

const PAGE_SIZE = 24;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

function humanize(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const label = humanize(slug);
  const seo = tagSeo(label);
  const title = page > 1 ? `${seo.title} – Page ${page}` : seo.title;
  return buildMetadata({
    title,
    description: seo.description,
    keywords: seo.keywords,
    path: page > 1 ? `/tag/${slug}?page=${page}` : `/tag/${slug}`,
  });
}

export default async function TagPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const token = slug.replace(/-/g, " ").split(/\s+/)[0] || slug;

  const candidates = await db.video.findMany({
    where: publicVideoWhere({
      AND: [
        { tags: { not: "" } },
        {
          OR: [
            { tags: { contains: token } },
            { tags: { contains: slug.replace(/-/g, " ") } },
            { tags: { contains: slug } },
          ],
        },
      ],
    }),
    include: { category: true },
    orderBy: { createdAt: "desc" },
    take: 400,
  });

  const matched = candidates.filter((v) =>
    parseTags(v.tags).some((t) => tagSlug(t) === slug)
  );

  if (matched.length === 0 && page === 1) {
    // Still show empty state rather than 404 if slug is valid-looking
  }

  const total = matched.length;
  if (total === 0 && page > 1) notFound();

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE) || 1);
  const videos = matched.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const label =
    matched.length > 0
      ? parseTags(matched[0].tags).find((t) => tagSlug(t) === slug) ||
        humanize(slug)
      : humanize(slug);

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Tags", path: "/tags" },
    { name: `#${label}`, path: `/tag/${slug}` },
  ];

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
              `#${label} Videos`,
              `/tag/${slug}`,
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
        <Link href="/tags" className="hover:text-accent">
          Tags
        </Link>
        <span>/</span>
        <span className="text-foreground">#{label}</span>
      </nav>

      <header className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight">
          Free {label} Porn Videos
        </h1>
        <p className="mt-1 text-sm text-muted">
          #{label} · {total} free XXX video{total === 1 ? "" : "s"}
        </p>
      </header>

      {videos.length > 0 ? (
        <VideoGrid>
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </VideoGrid>
      ) : (
        <p className="py-16 text-center text-muted">No videos with this tag.</p>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3 text-sm">
          {page > 1 ? (
            <Link href={`/tag/${slug}?page=${page - 1}`} className={pageLink}>
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
            <Link href={`/tag/${slug}?page=${page + 1}`} className={pageLink}>
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
