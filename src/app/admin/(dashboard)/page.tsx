import Link from "next/link";
import type { Route } from "next";
import { db } from "@/lib/db";
import { formatDate, formatViews } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const notDeleted = { deletedAt: null as null };

  const [
    totalVideos,
    published,
    totalCategories,
    viewsAgg,
    recent,
    zeroViewVideos,
    zeroViewCount,
    openReports,
    openDmca,
  ] = await Promise.all([
    db.video.count({ where: notDeleted }),
    db.video.count({ where: { ...notDeleted, published: true } }),
    db.category.count(),
    db.video.aggregate({ where: notDeleted, _sum: { views: true } }),
    db.video.findMany({
      where: notDeleted,
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.video.findMany({
      where: { ...notDeleted, published: true, views: 0 },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, title: true },
    }),
    db.video.count({ where: { ...notDeleted, published: true, views: 0 } }),
    db.report.count({ where: { status: "open" } }),
    db.dmcaRequest.count({ where: { status: "open" } }),
  ]);

  const stats = [
    { label: "Total videos", value: String(totalVideos), icon: "▶" },
    { label: "Published", value: String(published), icon: "✓" },
    { label: "Categories", value: String(totalCategories), icon: "❖" },
    { label: "Total views", value: formatViews(viewsAgg._sum.views ?? 0), icon: "✦" },
    { label: "Open reports", value: String(openReports), icon: "⚑" },
    { label: "Open DMCA", value: String(openDmca), icon: "⚖" },
    { label: "Zero-view published", value: String(zeroViewCount), icon: "0" },
    { label: "Storage", value: "N/A", icon: "▣" },
  ];

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-foreground">
        Dashboard
      </h1>
      <Link
        href={"/admin/settings" as Route}
        className="mb-8 flex items-center justify-between gap-3 rounded-xl border-2 border-accent/40 bg-accent/10 px-4 py-3 text-sm transition-colors hover:bg-accent/15"
      >
        <span>
          <span className="font-bold text-foreground">Ad preview mode</span>
          <span className="mt-0.5 block text-xs text-muted">
            Settings → top of page — turn on to see where ads appear on the site
          </span>
        </span>
        <span className="shrink-0 font-bold text-accent">Open →</span>
      </Link>
      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="card-shadow relative overflow-hidden rounded-2xl border border-border bg-surface p-5"
          >
            <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-sm text-accent">
              {s.icon}
            </div>
            <p className="text-4xl font-extrabold tracking-tight text-foreground">
              {s.value}
            </p>
            <p className="mt-1 text-xs font-medium tracking-wide text-muted uppercase">
              {s.label}
            </p>
          </div>
        ))}
      </div>
      <p className="mb-8 text-xs text-muted">Storage: N/A — embeds hosted externally</p>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Zero-view published ({zeroViewCount})
        </h2>
        <div className="card-shadow overflow-hidden rounded-2xl border border-border bg-surface">
          {zeroViewVideos.length === 0 && (
            <p className="p-6 text-sm text-muted">None.</p>
          )}
          {zeroViewVideos.map((v) => (
            <div key={v.id} className="flex items-center justify-between border-b border-border p-3 last:border-b-0">
              <span className="truncate text-sm text-foreground">{v.title}</span>
              <Link href={`/admin/videos/${v.id}` as Route} className="text-sm text-accent hover:text-accent-hover">
                Edit
              </Link>
            </div>
          ))}
        </div>
      </section>

      <h2 className="mb-4 text-lg font-semibold text-foreground">Recent videos</h2>
      <div className="card-shadow overflow-hidden rounded-2xl border border-border bg-surface">
        {recent.length === 0 && (
          <p className="p-6 text-sm text-muted">No videos yet.</p>
        )}
        {recent.map((v) => (
          <div
            key={v.id}
            className="flex items-center gap-4 border-b border-border p-4 transition-colors last:border-b-0 hover:bg-surface-hover"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={v.thumbnail}
              alt=""
              loading="lazy"
              className="h-12 w-20 shrink-0 rounded-lg border border-border bg-surface-hover object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">{v.title}</p>
              <p className="mt-0.5 text-xs text-muted">{formatDate(v.createdAt)}</p>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                v.published
                  ? "bg-green-500/10 text-green-400"
                  : "bg-surface-hover text-muted"
              }`}
            >
              {v.published ? "Published" : "Draft"}
            </span>
            <Link
              href={`/admin/videos/${v.id}` as Route}
              className="text-sm font-medium text-accent transition-colors hover:text-accent-hover"
            >
              Edit
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
