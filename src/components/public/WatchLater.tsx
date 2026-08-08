"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ThumbImage from "./ThumbImage";

export interface WatchLaterItem {
  slug: string;
  title: string;
  thumbnail: string;
  ts: number;
}

const KEY = "fp_watch_later";

export function getWatchLater(): WatchLaterItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as WatchLaterItem[]) : [];
  } catch {
    return [];
  }
}

export function isWatchLater(slug: string): boolean {
  return getWatchLater().some((x) => x.slug === slug);
}

export function toggleWatchLater(item: Omit<WatchLaterItem, "ts">): boolean {
  const list = getWatchLater();
  const exists = list.some((x) => x.slug === item.slug);
  const next = exists
    ? list.filter((x) => x.slug !== item.slug)
    : [{ ...item, ts: Date.now() }, ...list].slice(0, 48);
  localStorage.setItem(KEY, JSON.stringify(next));
  return !exists;
}

export function WatchLaterButton({
  slug,
  title,
  thumbnail,
}: {
  slug: string;
  title: string;
  thumbnail: string;
}) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isWatchLater(slug));
  }, [slug]);

  return (
    <button
      type="button"
      onClick={() => {
        const on = toggleWatchLater({ slug, title, thumbnail });
        setSaved(on);
      }}
      className={`rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
        saved
          ? "border-accent/50 bg-accent/15 text-accent"
          : "border-border bg-surface text-muted hover:border-accent/40 hover:text-foreground"
      }`}
    >
      {saved ? "✓ Watch later" : "+ Watch later"}
    </button>
  );
}

export default function WatchLaterRow() {
  const [items, setItems] = useState<WatchLaterItem[]>([]);

  useEffect(() => {
    setItems(getWatchLater());
    const onFocus = () => setItems(getWatchLater());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="my-10">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="font-display flex items-center gap-2.5 text-xl font-extrabold tracking-tight">
          <span className="h-5 w-1 rounded-full bg-gradient-to-b from-accent to-gold" />
          Watch later
        </h2>
        <Link
          href="/watch-later"
          className="text-xs font-medium text-accent hover:text-accent-hover"
        >
          View all
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {items.slice(0, 12).map((v) => (
          <Link
            key={v.slug}
            href={`/video/${v.slug}`}
            className="w-44 shrink-0 overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-accent/40 sm:w-52"
          >
            <ThumbImage
              src={v.thumbnail}
              alt={v.title}
              className="aspect-video w-full object-cover"
            />
            <p className="line-clamp-2 p-2.5 text-xs font-medium">{v.title}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
