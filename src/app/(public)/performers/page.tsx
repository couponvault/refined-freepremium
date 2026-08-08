import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { isSafeUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Pornstars – Free HD Porn Videos by Star",
  description:
    "Browse popular pornstars and watch free HD porn videos featuring each star. Stream XXX sex videos online on FreePremium — no sign-up.",
  path: "/performers",
  keywords: [
    "pornstars",
    "pornstar videos",
    "free pornstar porn",
    "xxx stars",
    "adult performers",
    "free porn",
  ],
});

export default async function PerformersIndexPage() {
  const performers = await db.performer.findMany({
    where: { enabled: true },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { videos: true } },
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 animate-rise">
      <h1 className="font-display mb-2 text-3xl font-extrabold tracking-tight">
        Pornstars
      </h1>
      <p className="mb-8 text-sm text-muted">
        Tap a pornstar to stream every free HD video featuring them.
      </p>

      {performers.length === 0 ? (
        <p className="text-sm text-muted">No pornstars listed yet.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {performers.map((p) => (
            <li key={p.id}>
              <Link
                href={`/performer/${p.slug}`}
                className="group flex flex-col items-center rounded-2xl border border-border bg-surface/60 p-4 text-center transition-colors hover:border-accent/40 hover:bg-surface-hover"
              >
                {p.imageUrl && isSafeUrl(p.imageUrl) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="mb-3 h-24 w-24 rounded-full border border-border object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-accent/15 text-2xl font-bold text-accent">
                    {p.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <span className="line-clamp-2 text-sm font-semibold text-foreground">
                  {p.name}
                </span>
                <span className="mt-1 text-xs text-muted">
                  {p._count.videos === 1
                    ? "1 video"
                    : `${p._count.videos} videos`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
