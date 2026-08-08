"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { QUALITY_OPTIONS } from "@/lib/videos";

export default function VideoFilters({
  preserve = {},
}: {
  preserve?: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(preserve)) {
      if (v) next.set(k, v);
    }
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  }

  const sort = sp.get("sort") ?? "newest";
  const quality = sp.get("quality") ?? "";
  const exclusive = sp.get("exclusive") === "1";
  const minDuration = sp.get("minDuration") ?? "";
  const maxDuration = sp.get("maxDuration") ?? "";

  const select =
    "rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent/50";
  const input =
    "w-24 rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent/50";

  const chips: { key: string; value: string; label: string }[] = [
    { key: "sort", value: "", label: "New" },
    { key: "sort", value: "views", label: "Most viewed" },
    { key: "quality", value: "1080p", label: "HD" },
    { key: "minDuration", value: "600", label: "Long" },
    { key: "exclusive", value: "1", label: "Exclusive" },
  ];

  return (
    <div className="mb-6 space-y-3 rounded-2xl border border-border bg-surface/60 p-4">
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => {
          const current =
            c.key === "sort"
              ? (sort === "newest" ? "" : sort) === c.value
              : c.key === "quality"
                ? quality === c.value
                : c.key === "exclusive"
                  ? exclusive === (c.value === "1")
                  : minDuration === c.value;
          return (
            <button
              key={c.label}
              type="button"
              onClick={() => update(c.key, current && c.value ? "" : c.value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                current
                  ? "bg-accent text-white"
                  : "border border-border text-muted hover:border-accent/40 hover:text-foreground"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-end gap-3">
      <label className="text-xs text-muted">
        Sort
        <select
          className={`mt-1 block ${select}`}
          value={sort}
          onChange={(e) => update("sort", e.target.value === "newest" ? "" : e.target.value)}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="views">Most viewed</option>
          <option value="title">Title</option>
        </select>
      </label>
      <label className="text-xs text-muted">
        Quality
        <select
          className={`mt-1 block ${select}`}
          value={quality}
          onChange={(e) => update("quality", e.target.value)}
        >
          <option value="">Any</option>
          {QUALITY_OPTIONS.map((q) => (
            <option key={q} value={q}>
              {q}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 pb-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={exclusive}
          onChange={(e) => update("exclusive", e.target.checked ? "1" : "")}
          className="accent-[var(--accent)]"
        />
        Exclusive only
      </label>
      <label className="text-xs text-muted">
        Min sec
        <input
          type="number"
          min={0}
          className={`mt-1 block ${input}`}
          value={minDuration}
          onChange={(e) => update("minDuration", e.target.value)}
          placeholder="0"
        />
      </label>
      <label className="text-xs text-muted">
        Max sec
        <input
          type="number"
          min={0}
          className={`mt-1 block ${input}`}
          value={maxDuration}
          onChange={(e) => update("maxDuration", e.target.value)}
          placeholder="∞"
        />
      </label>
      </div>
    </div>
  );
}
