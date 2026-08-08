import type { Metadata } from "next";
import { db } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { categoryCoverMap } from "@/lib/site";
import { isSafeUrl } from "@/lib/utils";
import CategoryTile from "@/components/public/CategoryTile";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Free Porn Categories – HD XXX Videos",
  description:
    "Browse free porn categories and stream HD XXX sex videos by niche. Amateur, MILF, lesbian, anal and more — updated daily on FreePremium.",
  path: "/categories",
  keywords: [
    "porn categories",
    "free porn categories",
    "xxx categories",
    "adult video categories",
    "free porn",
    "HD porn",
  ],
});

export default async function CategoriesPage() {
  const categories = await db.category.findMany({
    where: { enabled: true },
    orderBy: { name: "asc" },
  });
  const covers = await categoryCoverMap(categories.map((c) => c.id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold tracking-tight">
        Free porn categories
      </h1>
      <p className="mb-8 text-sm text-muted">
        Pick a niche to stream free HD XXX videos — no sign-up.
      </p>
      {categories.length === 0 ? (
        <p className="text-sm text-muted">No categories yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-4">
          {categories.map((c) => (
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
      )}
    </div>
  );
}
