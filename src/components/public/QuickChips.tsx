"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const CHIPS = [
  { label: "New", params: { sort: "newest" } },
  { label: "Most viewed", params: { sort: "views" } },
  { label: "HD", params: { quality: "1080p" } },
  { label: "Long", params: { minDuration: "600" } },
  { label: "Exclusive", params: { exclusive: "1" } },
] as const;

export default function QuickChips() {
  const pathname = usePathname();
  const sp = useSearchParams();
  // Stay on the current page (home) — never jump to /search
  const base = pathname === "/" ? "/" : pathname;

  const sort = sp.get("sort");
  const quality = sp.get("quality");
  const exclusive = sp.get("exclusive");
  const minDuration = sp.get("minDuration");

  function active(params: Record<string, string>) {
    if (params.sort === "views") return sort === "views";
    if (params.quality === "1080p") return quality === "1080p";
    if (params.exclusive === "1") return exclusive === "1";
    if (params.minDuration === "600") return minDuration === "600";
    if (params.sort === "newest")
      return (!sort || sort === "newest") && !quality && !exclusive && !minDuration;
    return false;
  }

  function hrefFor(params: Record<string, string>) {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (k === "sort" && v === "newest") continue;
      next.set(k, v);
    }
    const q = next.toString();
    return q ? `${base}?${q}` : base;
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {CHIPS.map((c) => {
        const on = active(c.params);
        return (
          <Link
            key={c.label}
            href={hrefFor(c.params)}
            className={`shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-colors ${
              on
                ? "bg-accent text-white shadow-md shadow-accent/25"
                : "border border-border/80 bg-surface/70 text-muted hover:border-accent/40 hover:text-foreground"
            }`}
          >
            {c.label}
          </Link>
        );
      })}
    </div>
  );
}
