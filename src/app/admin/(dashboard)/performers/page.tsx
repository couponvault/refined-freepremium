"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Toggle from "@/components/admin/Toggle";
import { fuzzyRank } from "@/lib/fuzzy";
import { isSafeUrl } from "@/lib/utils";

interface Performer {
  id: number;
  name: string;
  slug: string;
  imageUrl: string;
  description: string;
  enabled: boolean;
  _count: { videos: number };
}

const inputCls =
  "rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/50";

export default function PerformersPage() {
  const [items, setItems] = useState<Performer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [newImage, setNewImage] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [search, setSearch] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Map<number, HTMLLIElement>>(new Map());

  async function load() {
    const res = await fetch("/api/admin/performers", { cache: "no-store" });
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!searchWrapRef.current?.contains(e.target as Node)) {
        setSuggestOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const suggestions = useMemo(() => {
    const q = search.trim();
    if (q.length < 3) return [];
    return fuzzyRank(items, q, (p) => `${p.name} ${p.slug}`, {
      limit: 8,
      minScore: 40,
    });
  }, [items, search]);

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return items;
    if (q.length < 3) {
      const lower = q.toLowerCase();
      return items.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.slug.toLowerCase().includes(lower)
      );
    }
    return fuzzyRank(items, q, (p) => `${p.name} ${p.slug}`, {
      limit: 200,
      minScore: 35,
    });
  }, [items, search]);

  function openEdit(p: Performer, scroll = false) {
    setEditId(p.id);
    setEditName(p.name);
    setEditImage(p.imageUrl);
    setEditDesc(p.description);
    setSuggestOpen(false);
    setSearch(p.name);
    if (scroll) {
      requestAnimationFrame(() => {
        rowRefs.current.get(p.id)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
    }
  }

  async function patch(id: number, data: Record<string, unknown>) {
    setError("");
    const res = await fetch(`/api/admin/performers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Update failed");
    }
    load();
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/performers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        imageUrl: newImage,
        description: newDesc,
      }),
    });
    if (res.ok) {
      setNewName("");
      setNewImage("");
      setNewDesc("");
      load();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Create failed");
    }
  }

  async function remove(p: Performer) {
    if (
      !confirm(
        `Delete "${p.name}"? Their ${p._count.videos} video link(s) will be removed; videos stay.`
      )
    )
      return;
    await fetch(`/api/admin/performers/${p.id}`, { method: "DELETE" });
    load();
  }

  function saveEdit(id: number) {
    patch(id, {
      name: editName,
      imageUrl: editImage,
      description: editDesc,
    });
    setEditId(null);
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
        Performers
      </h1>
      <p className="mb-8 text-sm text-muted">
        Add performers with photos, then assign them on Add Video / CSV Maker.
        Public pages:{" "}
        <Link href="/performers" className="text-accent hover:underline">
          /performers
        </Link>
      </p>

      <form
        onSubmit={add}
        className="glass card-shadow mb-6 space-y-3 rounded-2xl border border-border p-5"
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-40 flex-1">
            <label className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">
              Name
            </label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className={`${inputCls} w-full`}
              required
            />
          </div>
          <div className="min-w-56 flex-[2]">
            <label className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">
              Image URL
            </label>
            <input
              value={newImage}
              onChange={(e) => setNewImage(e.target.value)}
              className={`${inputCls} w-full`}
              placeholder="https://..."
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">
            Bio / description (optional)
          </label>
          <input
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className={`${inputCls} w-full`}
          />
        </div>
        {isSafeUrl(newImage) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={newImage}
            alt=""
            className="h-20 w-20 rounded-full border border-border object-cover"
          />
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          className="glow rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover"
        >
          Add performer
        </button>
      </form>

      <div ref={searchWrapRef} className="relative mb-4">
        <label className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">
          Find performer to edit
        </label>
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSuggestOpen(true);
          }}
          onFocus={() => setSuggestOpen(true)}
          placeholder="Type 3+ letters — suggestions appear…"
          className={`${inputCls} w-full`}
          autoComplete="off"
        />
        {suggestOpen && search.trim().length >= 3 && (
          <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 max-h-72 overflow-y-auto rounded-xl border border-border bg-surface p-1 shadow-2xl">
            {suggestions.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted">No close matches</p>
            ) : (
              suggestions.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => openEdit(p, true)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-hover"
                >
                  {p.imageUrl && isSafeUrl(p.imageUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt=""
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">
                      {p.name.slice(0, 1)}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{p.name}</span>
                    <span className="block text-[11px] text-muted">
                      {p._count.videos} video
                      {p._count.videos === 1 ? "" : "s"} · click to edit
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        )}
        <p className="mt-1.5 text-[11px] text-muted">
          {search.trim()
            ? `Showing ${filtered.length} of ${items.length}`
            : `${items.length} performers — search filters the list below`}
        </p>
      </div>

      {loading ? (
        <div className="skeleton h-24 rounded-xl" />
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted">
          {items.length === 0
            ? "No performers yet."
            : "No performers match that search."}
        </p>
      ) : (
        <ul className="card-shadow divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {filtered.map((p) => (
            <li
              key={p.id}
              ref={(el) => {
                if (el) rowRefs.current.set(p.id, el);
                else rowRefs.current.delete(p.id);
              }}
              className={`px-4 py-4 ${editId === p.id ? "bg-accent/5" : ""}`}
            >
              {editId === p.id ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-3">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className={`${inputCls} min-w-40 flex-1`}
                    />
                    <input
                      value={editImage}
                      onChange={(e) => setEditImage(e.target.value)}
                      className={`${inputCls} min-w-56 flex-[2]`}
                      placeholder="Image URL"
                    />
                  </div>
                  <input
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className={`${inputCls} w-full`}
                    placeholder="Description"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => saveEdit(p.id)}
                      className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditId(null)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-4">
                  {p.imageUrl && isSafeUrl(p.imageUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt=""
                      className="h-14 w-14 rounded-full border border-border object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-lg font-bold text-accent">
                      {p.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">{p.name}</p>
                    <p className="text-xs text-muted">
                      /performer/{p.slug} · {p._count.videos} video
                      {p._count.videos === 1 ? "" : "s"}
                    </p>
                  </div>
                  <Toggle
                    checked={p.enabled}
                    onChange={(v) => patch(p.id, { enabled: v })}
                    label={p.enabled ? "On" : "Off"}
                  />
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(p)}
                    className="text-xs font-medium text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
