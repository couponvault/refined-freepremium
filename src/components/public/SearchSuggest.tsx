"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import ThumbImage from "./ThumbImage";

interface SuggestPayload {
  videos: { slug: string; title: string; thumbnail: string; views: number }[];
  categories: { name: string; slug: string; icon: string }[];
  tags: { slug: string; name: string; count: number }[];
  performers?: { name: string; slug: string; imageUrl: string }[];
}

export default function SearchSuggest({
  className = "",
  inputClassName = "",
  onNavigate,
}: {
  className?: string;
  inputClassName?: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SuggestPayload | null>(null);

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/videos/suggest?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((d: SuggestPayload) => setData(d))
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const hasResults =
    !!data &&
    (data.videos.length > 0 ||
      data.categories.length > 0 ||
      data.tags.length > 0 ||
      (data.performers?.length ?? 0) > 0);

  function goSearch(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    setOpen(false);
    onNavigate?.();
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  function pick(href: string) {
    setOpen(false);
    onNavigate?.();
    router.push(href);
  }

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <form onSubmit={goSearch}>
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search videos…"
          role="combobox"
          aria-expanded={open && (hasResults || loading)}
          aria-controls={listId}
          aria-autocomplete="list"
          className={
            inputClassName ||
            "w-full rounded-lg border border-border bg-surface/80 px-4 py-1.5 text-sm placeholder:text-muted transition-all focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50"
          }
        />
      </form>

      {open && q.trim().length >= 2 && (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-[70] max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-surface p-2 shadow-2xl"
        >
          {loading && !data && (
            <p className="px-3 py-2 text-xs text-muted">Searching…</p>
          )}
          {!loading && data && !hasResults && (
            <p className="px-3 py-2 text-xs text-muted">No matches</p>
          )}

          {data?.categories.map((c) => (
            <button
              key={`c-${c.slug}`}
              type="button"
              role="option"
              onClick={() => pick(`/category/${c.slug}`)}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-surface-hover"
            >
              <span>{c.icon}</span>
              <span className="font-medium">{c.name}</span>
              <span className="ml-auto text-[10px] uppercase text-muted">
                Category
              </span>
            </button>
          ))}

          {data?.performers?.map((p) => (
            <button
              key={`p-${p.slug}`}
              type="button"
              role="option"
              onClick={() => pick(`/performer/${p.slug}`)}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-surface-hover"
            >
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.imageUrl}
                  alt=""
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
                  {p.name.slice(0, 1)}
                </span>
              )}
              <span className="font-medium">{p.name}</span>
              <span className="ml-auto text-[10px] uppercase text-muted">
                Pornstar
              </span>
            </button>
          ))}

          {data?.tags.map((t) => (
            <button
              key={`t-${t.slug}`}
              type="button"
              role="option"
              onClick={() => pick(`/tag/${t.slug}`)}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-surface-hover"
            >
              <span className="text-accent">#</span>
              <span className="font-medium">{t.name}</span>
              <span className="ml-auto text-[10px] text-muted">{t.count}</span>
            </button>
          ))}

          {data?.videos.map((v) => (
            <button
              key={v.slug}
              type="button"
              role="option"
              onClick={() => pick(`/video/${v.slug}`)}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-surface-hover"
            >
              <ThumbImage
                src={v.thumbnail}
                alt=""
                className="h-10 w-16 shrink-0 rounded-lg object-cover"
              />
              <span className="line-clamp-2 text-sm font-medium">{v.title}</span>
            </button>
          ))}

          <button
            type="button"
            onClick={() => {
              const query = q.trim();
              if (!query) return;
              pick(`/search?q=${encodeURIComponent(query)}`);
            }}
            className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted hover:text-accent"
          >
            Search all for “{q.trim()}”
          </button>
        </div>
      )}
    </div>
  );
}
