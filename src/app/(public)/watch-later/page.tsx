"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getWatchLater,
  type WatchLaterItem,
  toggleWatchLater,
} from "@/components/public/WatchLater";
import VideoGrid from "@/components/public/VideoGrid";

export default function WatchLaterClient() {
  const [items, setItems] = useState<WatchLaterItem[]>([]);

  useEffect(() => {
    setItems(getWatchLater());
  }, []);

  function remove(slug: string) {
    const item = items.find((x) => x.slug === slug);
    if (!item) return;
    toggleWatchLater(item);
    setItems(getWatchLater());
  }

  function clearAll() {
    localStorage.removeItem("fp_watch_later");
    setItems([]);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Watch later</h1>
          <p className="mt-1 text-sm text-muted">
            Saved on this device only — no account needed.
          </p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="rounded-full border border-border px-4 py-2 text-xs text-muted hover:text-red-400"
          >
            Clear all
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted">
          Nothing saved yet. Open a video and tap{" "}
          <span className="text-foreground">+ Watch later</span>.
        </p>
      ) : (
        <VideoGrid>
          {items.map((v) => (
            <div key={v.slug} className="relative">
              <Link
                href={`/video/${v.slug}`}
                className="group block overflow-hidden rounded-2xl border border-border bg-surface card-shadow"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={v.thumbnail}
                  alt={v.title}
                  className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
                />
                <p className="line-clamp-2 p-3 text-sm font-medium">{v.title}</p>
              </Link>
              <button
                type="button"
                onClick={() => remove(v.slug)}
                className="absolute top-2 right-2 rounded-full bg-black/70 px-2.5 py-1 text-[10px] text-white hover:bg-red-500/80"
              >
                Remove
              </button>
            </div>
          ))}
        </VideoGrid>
      )}
    </div>
  );
}
