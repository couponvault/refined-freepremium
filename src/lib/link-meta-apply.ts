import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { LinkMetaResult } from "@/lib/link-meta";
import { isAllowedMediaUrl } from "@/lib/security";
import { slugify } from "@/lib/utils";

async function uniqueCategorySlug(base: string): Promise<string> {
  let slug = base || "category";
  for (let i = 2; ; i++) {
    if (
      !(await db.category.findUnique({ where: { slug }, select: { id: true } }))
    ) {
      return slug;
    }
    slug = `${base}-${i}`;
  }
}

async function uniquePerformerSlug(base: string): Promise<string> {
  let slug = base || "performer";
  for (let i = 2; ; i++) {
    if (
      !(await db.performer.findUnique({ where: { slug }, select: { id: true } }))
    ) {
      return slug;
    }
    slug = `${base}-${i}`;
  }
}

async function ensureCategory(name: string): Promise<{
  slug: string;
  created: boolean;
}> {
  const trimmed = name.trim();
  const all = await db.category.findMany({
    select: { id: true, name: true, slug: true },
  });
  const existing = all.find(
    (c) => c.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (existing) return { slug: existing.slug, created: false };

  const slug = await uniqueCategorySlug(slugify(trimmed) || "category");
  await db.category.create({
    data: {
      name: trimmed,
      slug,
      icon: "🎬",
      enabled: true,
      order: 0,
    },
  });
  return { slug, created: true };
}

async function ensurePerformer(
  name: string,
  imageUrl?: string
): Promise<{ slug: string; created: boolean }> {
  const trimmed = name.trim();
  const all = await db.performer.findMany({
    select: { id: true, name: true, slug: true, imageUrl: true },
  });
  const existing = all.find(
    (p) => p.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (existing) {
    const img = (imageUrl || "").trim();
    if (img && isAllowedMediaUrl(img) && !existing.imageUrl.trim()) {
      await db.performer.update({
        where: { id: existing.id },
        data: { imageUrl: img },
      });
    }
    return { slug: existing.slug, created: false };
  }

  const slug = await uniquePerformerSlug(slugify(trimmed) || "performer");
  const img = (imageUrl || "").trim();
  await db.performer.create({
    data: {
      name: trimmed,
      slug,
      imageUrl: img && isAllowedMediaUrl(img) ? img : "",
      enabled: true,
    },
  });
  return { slug, created: true };
}

export type AppliedLinkMeta = LinkMetaResult & {
  categorySlugs: string[];
  performerSlugs: string[];
  createdCategories: string[];
  createdPerformers: string[];
};

/** Create missing categories + performers, return slugs for the CSV Maker form. */
export async function applyLinkMetaToCatalog(
  data: LinkMetaResult
): Promise<AppliedLinkMeta> {
  const createdCategories: string[] = [];
  const categorySlugs: string[] = [];
  for (const name of data.categories || []) {
    if (!name.trim()) continue;
    const { slug, created } = await ensureCategory(name);
    if (!categorySlugs.includes(slug)) categorySlugs.push(slug);
    if (created) createdCategories.push(name.trim());
  }

  const createdPerformers: string[] = [];
  const performerSlugs: string[] = [];
  for (const star of data.pornstars || []) {
    if (!star.name?.trim()) continue;
    const { slug, created } = await ensurePerformer(star.name, star.imageUrl);
    if (!performerSlugs.includes(slug)) performerSlugs.push(slug);
    if (created) createdPerformers.push(star.name.trim());
  }

  if (createdCategories.length || createdPerformers.length) {
    revalidatePath("/", "layout");
    revalidatePath("/categories");
    revalidatePath("/performers");
    revalidatePath("/admin/videos/csv-maker");
    revalidatePath("/admin/performers");
    revalidatePath("/admin/categories");
  }

  return {
    ...data,
    categorySlugs,
    performerSlugs,
    createdCategories,
    createdPerformers,
  };
}
