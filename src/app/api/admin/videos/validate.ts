import { db } from "@/lib/db";
import {
  isAllowedEmbedUrl,
  isAllowedMediaUrl,
  parseViewsInput,
  slugify,
  toEmbedUrl,
} from "@/lib/utils";
import { QUALITY_OPTIONS } from "@/lib/videos";
import type { VideoInput } from "@/types";

export interface ValidatedVideo {
  title: string;
  slug: string;
  embedUrl: string;
  thumbnail: string;
  description: string;
  tags: string;
  seoTitle: string;
  seoDescription: string;
  featured: boolean;
  trending: boolean;
  published: boolean;
  exclusive: boolean;
  duration: number;
  quality: string;
  views: number;
  scheduledAt: Date | null;
  categoryId: number | null;
}

export function validateVideoDataSync(
  body: VideoInput
): { data: Omit<ValidatedVideo, "slug"> } | { error: string } {
  const title = (body.title ?? "").trim();
  if (!title) return { error: "Title is required" };
  const embedUrl = toEmbedUrl((body.embedUrl ?? "").trim());
  if (!embedUrl || !isAllowedEmbedUrl(embedUrl))
    return {
      error:
        "Embed URL rejected — use https and an allowed video host (or set EMBED_ALLOW_ANY=1 / EMBED_ALLOWED_HOSTS)",
    };
  const thumbnail = (body.thumbnail ?? "").trim();
  if (!thumbnail || !isAllowedMediaUrl(thumbnail))
    return {
      error:
        "Thumbnail must be a valid https URL in production (http allowed in local dev)",
    };

  const seoTitle = (body.seoTitle ?? "").trim() || title;
  const seoDescription = (body.seoDescription ?? "").trim();
  if (!seoDescription)
    return { error: "SEO Description is required (min 20 chars recommended)" };
  if (seoDescription.length < 20)
    return { error: "SEO Description must be at least 20 characters" };

  let categoryId: number | null = null;
  if (body.categoryId !== null && body.categoryId !== undefined) {
    categoryId = Number(body.categoryId);
    if (!Number.isInteger(categoryId))
      return { error: "categoryId must be an integer" };
  }

  const duration = Math.max(0, Math.floor(Number(body.duration) || 0));
  const views = parseViewsInput(body.views as string | number | undefined);
  const quality = (body.quality ?? "720p").trim();
  if (!(QUALITY_OPTIONS as readonly string[]).includes(quality))
    return { error: `quality must be one of: ${QUALITY_OPTIONS.join(", ")}` };

  let scheduledAt: Date | null = null;
  if (body.scheduledAt) {
    const d = new Date(body.scheduledAt);
    if (Number.isNaN(d.getTime())) return { error: "Invalid scheduledAt" };
    scheduledAt = d;
  }

  return {
    data: {
      title,
      embedUrl,
      thumbnail,
      description: (body.description ?? "").trim(),
      tags: (body.tags ?? "").trim(),
      seoTitle,
      seoDescription,
      featured: !!body.featured,
      trending: !!body.trending,
      published: body.published !== false,
      exclusive: !!body.exclusive,
      duration,
      quality,
      views,
      scheduledAt,
      categoryId,
    },
  };
}

/** Validates input and resolves a unique slug. `excludeId` skips self on updates. */
export async function validateVideo(
  body: VideoInput,
  excludeId?: number
): Promise<{ data: ValidatedVideo } | { error: string }> {
  const syncResult = validateVideoDataSync(body);
  if ("error" in syncResult) return { error: syncResult.error };
  const { data } = syncResult;
  const { embedUrl, title } = data;

  // Duplicate embed detection
  const dup = await db.video.findFirst({
    where: {
      embedUrl,
      deletedAt: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true, title: true },
  });
  if (dup)
    return {
      error: `Duplicate embed URL — already used by "${dup.title}" (id ${dup.id})`,
    };

  const base = slugify((body.slug ?? "").trim() || title) || "video";
  let slug = base;
  for (let i = 2; ; i++) {
    const existing = await db.video.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) break;
    slug = `${base}-${i}`;
  }

  return {
    data: {
      ...data,
      slug,
    },
  };
}
