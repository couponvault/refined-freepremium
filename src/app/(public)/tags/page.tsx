import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { getPopularTags } from "@/components/public/PopularTags";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Popular Porn Tags – Free XXX Videos",
  description:
    "Explore popular porn tags and jump into free XXX sex videos by topic. Stream HD adult clips online on FreePremium.",
  path: "/tags",
  keywords: [
    "porn tags",
    "xxx tags",
    "free porn tags",
    "adult video tags",
    "free porn",
  ],
});

export default async function TagsPage() {
  const tags = await getPopularTags(80);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold tracking-tight">
        Popular porn tags
      </h1>
      <p className="mb-8 text-sm text-muted">
        Jump into free XXX topics people watch most.
      </p>
      {tags.length === 0 ? (
        <p className="text-sm text-muted">No tags yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2.5">
          {tags.map((t) => (
            <Link
              key={t.slug}
              href={`/tag/${t.slug}`}
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-accent/40 hover:text-accent"
            >
              #{t.name}
              <span className="ml-2 text-[11px] opacity-60">{t.count}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
