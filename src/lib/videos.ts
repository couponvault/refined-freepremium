import type { Prisma } from "@prisma/client";

/** Publicly visible videos: published, not trashed, not DMCA-hidden, schedule due. */
export function publicVideoWhere(
  extra: Prisma.VideoWhereInput = {}
): Prisma.VideoWhereInput {
  return {
    published: true,
    deletedAt: null,
    dmcaClaimed: false,
    OR: [{ scheduledAt: null }, { scheduledAt: { lte: new Date() } }],
    ...extra,
  };
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export const QUALITY_OPTIONS = ["360p", "480p", "720p", "1080p", "4K"] as const;
