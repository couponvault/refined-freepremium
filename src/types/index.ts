import type { Category, Video } from "@prisma/client";

export type VideoWithCategory = Video & { category: Category | null };

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Shape accepted by POST/PUT /api/admin/videos */
export interface VideoInput {
  title: string;
  slug?: string;
  embedUrl: string;
  thumbnail: string;
  description?: string;
  tags?: string;
  seoTitle?: string;
  seoDescription?: string;
  featured?: boolean;
  trending?: boolean;
  published?: boolean;
  exclusive?: boolean;
  duration?: number;
  quality?: string;
  views?: number | string;
  scheduledAt?: string | null;
  /** Primary category (first of categoryIds). */
  categoryId?: number | null;
  /** Linked category IDs (many-to-many). */
  categoryIds?: number[];
  /** CSV: comma/pipe-separated category slugs. */
  categorySlugs?: string;
  /** @deprecated use categorySlugs — still accepted for one category */
  categorySlug?: string;
  /** Linked performer IDs (many-to-many). */
  performerIds?: number[];
  /** CSV import: comma/pipe-separated performer slugs. */
  performerSlugs?: string;
}

/** Shape accepted by POST/PUT /api/admin/categories */
export interface CategoryInput {
  name: string;
  slug?: string;
  icon?: string;
  imageUrl?: string;
  order?: number;
  enabled?: boolean;
  description?: string;
}

/** Shape accepted by POST/PUT /api/admin/performers */
export interface PerformerInput {
  name: string;
  slug?: string;
  imageUrl?: string;
  description?: string;
  enabled?: boolean;
}
