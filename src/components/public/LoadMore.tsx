"use client";

import { useCallback, useState } from "react";
import VideoCard, { type VideoCardData } from "./VideoCard";
import VideoGrid from "./VideoGrid";
import SkeletonCard from "./SkeletonCard";

export interface LoadMoreFilters {
  initialPage: number;
  q?: string;
  category?: string;
  tag?: string;
  sort?: string;
  quality?: string;
  exclusive?: boolean;
  minDuration?: number;
  maxDuration?: number;
}

export default function LoadMore({
  initialPage,
  q,
  category,
  tag,
  sort,
  quality,
  exclusive,
  minDuration,
  maxDuration,
}: LoadMoreFilters) {
  const [items, setItems] = useState<VideoCardData[]>([]);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const loadNext = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page + 1) });
      if (q) params.set("q", q);
      if (category) params.set("category", category);
      if (tag) params.set("tag", tag);
      if (sort) params.set("sort", sort);
      if (quality) params.set("quality", quality);
      if (exclusive) params.set("exclusive", "1");
      if (minDuration != null) params.set("minDuration", String(minDuration));
      if (maxDuration != null) params.set("maxDuration", String(maxDuration));
      const res = await fetch(`/api/videos?${params}`);
      const data: {
        items: VideoCardData[];
        page: number;
        totalPages: number;
      } = await res.json();
      setItems((prev) => [...prev, ...data.items]);
      setPage(data.page);
      if (data.page >= data.totalPages || data.items.length === 0)
        setDone(true);
    } catch {
      setDone(true);
    } finally {
      setLoading(false);
    }
  }, [page, q, category, tag, sort, quality, exclusive, minDuration, maxDuration]);

  return (
    <>
      {items.length > 0 && (
        <div className="mt-4">
          <VideoGrid>
            {items.map((v) => (
              <VideoCard key={v.slug} video={v} />
            ))}
          </VideoGrid>
        </div>
      )}
      {loading && (
        <div className="mt-4">
          <VideoGrid>
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </VideoGrid>
        </div>
      )}
      {done ? (
        <p className="mt-8 text-center text-sm text-muted">
          You&apos;re all caught up
        </p>
      ) : (
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => void loadNext()}
            disabled={loading}
            className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-transform hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? "Loading..." : "See More Videos"}
          </button>
        </div>
      )}
    </>
  );
}
