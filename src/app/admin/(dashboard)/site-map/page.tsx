import Link from "next/link";
import { db } from "@/lib/db";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import { parseTags, tagSlug } from "@/lib/utils";
import { publicVideoWhere } from "@/lib/videos";

export const dynamic = "force-dynamic";

/** Admin-only HTML index of every public URL (not linked on the public site). */
export default async function AdminSiteMapPage() {
  const [categories, performers, videos] = await Promise.all([
    db.category.findMany({
      where: { enabled: true },
      orderBy: { name: "asc" },
      select: { name: true, slug: true, icon: true },
    }),
    db.performer.findMany({
      where: { enabled: true },
      orderBy: { name: "asc" },
      select: { name: true, slug: true },
    }),
    db.video.findMany({
      where: publicVideoWhere(),
      select: {
        title: true,
        slug: true,
        tags: true,
        category: { select: { name: true, slug: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const tagMap = new Map<string, string>();
  for (const v of videos) {
    for (const t of parseTags(v.tags)) {
      const s = tagSlug(t);
      if (s && !tagMap.has(s)) tagMap.set(s, t);
    }
  }
  const tags = [...tagMap.entries()].sort((a, b) => a[1].localeCompare(b[1]));

  const linkCls =
    "text-sm text-muted transition-colors hover:text-accent break-words";

  return (
    <div className="max-w-6xl">
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Sitemap
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Admin-only index of public {SITE_NAME} pages. Search engines still use
        the XML feeds (not this page).
      </p>

      <div className="mt-5 flex flex-wrap gap-3 text-sm">
        <a
          href={`${SITE_URL}/sitemap.xml`}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-accent hover:border-accent/40"
        >
          Open sitemap.xml ↗
        </a>
        <a
          href={`${SITE_URL}/sitemap-videos.xml`}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-accent hover:border-accent/40"
        >
          Open sitemap-videos.xml ↗
        </a>
        <Link
          href="/admin/settings"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-muted hover:text-foreground"
        >
          SEO settings
        </Link>
      </div>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Main pages</h2>
        <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {[
            ["/", "Home"],
            ["/categories", "Categories"],
            ["/performers", "Pornstars"],
            ["/tags", "Tags"],
            ["/search", "Search"],
            ["/terms", "Terms"],
            ["/privacy", "Privacy"],
            ["/dmca", "DMCA"],
            ["/policy", "Content Policy"],
          ].map(([href, label]) => (
            <li key={href}>
              <Link href={href} className={linkCls}>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">
          Categories ({categories.length})
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link href={`/category/${c.slug}`} className={linkCls}>
                {c.icon} {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">
          Performers ({performers.length})
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {performers.map((p) => (
            <li key={p.slug}>
              <Link href={`/performer/${p.slug}`} className={linkCls}>
                {p.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Tags ({tags.length})</h2>
        <ul className="flex flex-wrap gap-2">
          {tags.map(([slug, name]) => (
            <li key={slug}>
              <Link
                href={`/tag/${slug}`}
                className="rounded-lg border border-border px-3 py-1 text-xs text-muted hover:border-accent/40 hover:text-accent"
              >
                #{name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 mb-8">
        <h2 className="mb-3 text-lg font-semibold">
          Videos ({videos.length})
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => (
            <li key={v.slug}>
              <Link href={`/video/${v.slug}`} className={linkCls}>
                {v.title}
                {v.category ? (
                  <span className="text-[11px] opacity-60">
                    {" "}
                    · {v.category.name}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
