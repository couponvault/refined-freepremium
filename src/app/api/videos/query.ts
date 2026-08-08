import type { Prisma } from "@prisma/client";
import { publicVideoWhere } from "@/lib/videos";

export type PublicSort = "newest" | "oldest" | "views" | "title";

export interface PublicVideoFilters {
  q?: string;
  categorySlug?: string;
  tag?: string;
  quality?: string;
  exclusive?: boolean;
  minDuration?: number;
  maxDuration?: number;
  sort?: PublicSort;
}

/** Shared public where clause (published, not trashed/DMCA, schedule due). */
export function buildVideoWhere(
  q?: string,
  categorySlug?: string,
  extras: Omit<PublicVideoFilters, "q" | "categorySlug" | "sort"> = {}
): Prisma.VideoWhereInput {
  const and: Prisma.VideoWhereInput[] = [];

  if (categorySlug) {
    and.push({
      OR: [
        { category: { slug: categorySlug, enabled: true } },
        {
          videoCategories: {
            some: { category: { slug: categorySlug, enabled: true } },
          },
        },
      ],
    });
  }
  if (q) {
    and.push({
      OR: [
        { title: { contains: q } },
        { description: { contains: q } },
        { tags: { contains: q } },
        { seoTitle: { contains: q } },
        { seoDescription: { contains: q } },
      ],
    });
  }
  if (extras.tag) and.push({ tags: { contains: extras.tag } });
  if (extras.quality) and.push({ quality: extras.quality });
  if (extras.exclusive) and.push({ exclusive: true });
  if (extras.minDuration != null)
    and.push({ duration: { gte: extras.minDuration } });
  if (extras.maxDuration != null)
    and.push({ duration: { lte: extras.maxDuration } });

  return publicVideoWhere(and.length ? { AND: and } : {});
}

export function buildVideoOrderBy(
  sort: PublicSort = "newest"
): Prisma.VideoOrderByWithRelationInput {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" };
    case "views":
      return { views: "desc" };
    case "title":
      return { title: "asc" };
    default:
      return { createdAt: "desc" };
  }
}
