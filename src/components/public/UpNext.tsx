"use client";

import Link from "next/link";
import ThumbImage from "./ThumbImage";

export interface UpNextItem {
  slug: string;
  title: string;
  thumbnail: string;
}

export default function UpNext({ items }: { items: UpNextItem[] }) {
  if (items.length === 0) return null;
  return (
    <aside className="mt-4 rounded-xl border border-border/80 bg-surface/70 p-4">
      <h3 className="font-display mb-3 text-sm font-bold tracking-wide text-muted uppercase">
        Up next
      </h3>
      <ul className="space-y-2.5">
        {items.map((v, i) => (
          <li key={v.slug}>
            <Link
              href={`/video/${v.slug}`}
              className="flex gap-3 rounded-xl p-1.5 transition-colors hover:bg-surface-hover"
            >
              <span className="relative w-28 shrink-0 overflow-hidden rounded-lg">
                <ThumbImage
                  src={v.thumbnail}
                  alt=""
                  className="aspect-video w-full object-cover"
                />
                <span className="absolute left-1 top-1 rounded bg-black/70 px-1 text-[10px] text-white">
                  {i + 1}
                </span>
              </span>
              <span className="line-clamp-2 self-center text-sm font-medium">
                {v.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
