import Link from "next/link";
import { formatDate, formatViews } from "@/lib/utils";
import { formatDuration } from "@/lib/videos";
import ThumbImage from "./ThumbImage";

export interface VideoCardData {
  slug: string;
  title: string;
  thumbnail: string;
  views: number;
  createdAt: Date | string;
  duration?: number;
  quality?: string;
  exclusive?: boolean;
  category: { name: string; slug: string; icon: string } | null;
}

export default function VideoCard({ video }: { video: VideoCardData }) {
  const duration = video.duration ?? 0;
  return (
    <Link
      href={`/video/${video.slug}`}
      className="group block overflow-hidden rounded-xl border border-border/80 bg-surface/80 transition-all duration-300 hover:border-accent/50 hover:bg-surface"
    >
      <div className="relative aspect-video overflow-hidden bg-black">
        <ThumbImage
          src={video.thumbnail}
          alt={video.title}
          className="aspect-video w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
        />
        <span className="thumb-heat pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
          {video.exclusive && (
            <span className="rounded-md bg-gold px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-black">
              EXCL
            </span>
          )}
          {video.quality && (
            <span className="rounded-md bg-black/75 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
              {video.quality}
            </span>
          )}
        </div>
        {duration > 0 && (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/85 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white">
            {formatDuration(duration)}
          </span>
        )}
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/40">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5.5v13l11-6.5-11-6.5Z" />
            </svg>
          </span>
        </span>
      </div>
      <div className="p-2.5 sm:p-3">
        <h3 className="font-display text-sm font-semibold leading-snug line-clamp-2 transition-colors group-hover:text-accent">
          {video.title}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
          {video.category && (
            <span className="rounded-md bg-surface-hover px-2 py-0.5">
              {video.category.icon} {video.category.name}
            </span>
          )}
          <span>{formatDate(video.createdAt)}</span>
          <span title="Site-managed views — not from the embed host">
            {formatViews(video.views)} views
          </span>
        </div>
      </div>
    </Link>
  );
}
