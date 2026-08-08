"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { fuzzyRank } from "@/lib/fuzzy";
import { isSafeUrl } from "@/lib/utils";

export type SearchOption = {
  id: string | number;
  label: string;
  imageUrl?: string;
  hint?: string;
};

export default function MultiSearchSelect({
  options,
  value,
  onChange,
  placeholder = "Type to search…",
  emptyText = "No matches",
  label,
}: {
  options: SearchOption[];
  value: Array<string | number>;
  onChange: (next: Array<string | number>) => void;
  placeholder?: string;
  emptyText?: string;
  label?: string;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => {
    const set = new Set(value.map(String));
    return options.filter((o) => set.has(String(o.id)));
  }, [options, value]);

  const filtered = useMemo(() => {
    const q = query.trim();
    const set = new Set(value.map(String));
    const available = options.filter((o) => !set.has(String(o.id)));
    if (!q) return available.slice(0, 40);
    // Suggestions kick in from 3 characters with typo tolerance
    if (q.length < 3) {
      const lower = q.toLowerCase();
      return available
        .filter((o) => o.label.toLowerCase().includes(lower))
        .slice(0, 40);
    }
    return fuzzyRank(available, q, (o) => o.label, {
      limit: 40,
      minScore: 40,
    });
  }, [options, query, value]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function add(id: string | number) {
    if (value.some((v) => String(v) === String(id))) return;
    onChange([...value, id]);
    setQuery("");
    setOpen(true);
  }

  function remove(id: string | number) {
    onChange(value.filter((v) => String(v) !== String(id)));
  }

  return (
    <div ref={rootRef} className="relative">
      {label ? (
        <p className="mb-1.5 text-xs font-medium tracking-wide text-muted uppercase">
          {label}
        </p>
      ) : null}

      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {selected.map((o) => (
            <span
              key={String(o.id)}
              className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/15 py-1 pr-1.5 pl-2 text-xs font-medium text-foreground"
            >
              {o.imageUrl && isSafeUrl(o.imageUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={o.imageUrl}
                  alt=""
                  className="h-5 w-5 rounded-full object-cover"
                />
              ) : null}
              {o.label}
              <button
                type="button"
                onClick={() => remove(o.id)}
                className="rounded-full px-1.5 text-muted hover:bg-background hover:text-foreground"
                aria-label={`Remove ${o.label}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/50"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        autoComplete="off"
      />

      {open && (
        <div
          id={listId}
          role="listbox"
          className="absolute z-40 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-border bg-surface py-1 shadow-2xl"
        >
          {filtered.length === 0 ? (
            <p className="px-3.5 py-2.5 text-sm text-muted">{emptyText}</p>
          ) : (
            filtered.map((o) => (
              <button
                key={String(o.id)}
                type="button"
                role="option"
                onClick={() => add(o.id)}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-hover"
              >
                {o.imageUrl && isSafeUrl(o.imageUrl) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={o.imageUrl}
                    alt=""
                    className="h-7 w-7 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
                    {o.label.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                {o.hint ? (
                  <span className="shrink-0 text-[10px] text-muted">{o.hint}</span>
                ) : null}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
