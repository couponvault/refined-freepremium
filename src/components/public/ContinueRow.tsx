"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ThumbImage from "./ThumbImage";

interface ContinueItem {
  slug: string;
  title: string;
  thumbnail: string;
  ts: number;
}

const KEY = "fp_continue";

export function pushContinue(item: Omit<ContinueItem, "ts">) {
  try {
    const raw = localStorage.getItem(KEY);
    let list: ContinueItem[] = raw ? JSON.parse(raw) : [];
    list = [
      { ...item, ts: Date.now() },
      ...list.filter((x) => x.slug !== item.slug),
    ].slice(0, 12);
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

function readList(): ContinueItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ContinueItem[]) : [];
  } catch {
    return [];
  }
}

export default function ContinueRow() {
  const [items, setItems] = useState<ContinueItem[]>([]);

  useEffect(() => {
    setItems(readList());
    const refresh = () => setItems(readList());
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  function remove(slug: string) {
    const next = readList().filter((x) => x.slug !== slug);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setItems(next);
  }

  function clearAll() {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    setItems([]);
  }

  if (items.length === 0) return null;

  return (
    <section className="my-12">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="font-display flex items-center gap-2.5 text-xl font-extrabold tracking-tight">
          <span className="h-5 w-1 rounded-full bg-gradient-to-b from-accent to-gold" />
          Continue watching
        </h2>
        <button
          type="button"
          onClick={clearAll}
          className="text-xs text-muted underline-offset-2 hover:text-accent hover:underline"
        >
          Clear all
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {items.map((v) => (
          <div
            key={v.slug}
            className="group relative w-44 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-surface/80 transition-colors hover:border-accent/45"
          >
            <Link href={`/video/${v.slug}`}>
              <ThumbImage
                src={v.thumbnail}
                alt={v.title}
                className="aspect-video w-full object-cover"
              />
              <p className="line-clamp-2 p-2.5 text-xs font-medium">{v.title}</p>
            </Link>
            <button
              type="button"
              aria-label="Remove from continue watching"
              onClick={() => remove(v.slug)}
              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
