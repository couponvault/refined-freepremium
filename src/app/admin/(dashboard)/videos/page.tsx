"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import type { Category } from "@prisma/client";
import type { Paginated, VideoWithCategory } from "@/types";
import { formatDate, formatViews } from "@/lib/utils";

const inputCls =
  "rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/50";
const ghostBtn =
  "rounded-lg border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-surface-hover disabled:opacity-40";

type BulkAction =
  | "delete"
  | "publish"
  | "unpublish"
  | "restore"
  | "purge"
  | "exclusive"
  | "unexclusive"
  | "feature"
  | "unfeature"
  | "trend"
  | "untrend";

export default function VideosPage() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"" | "trash" | "scheduled">("");
  const [data, setData] = useState<Paginated<VideoWithCategory> | null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showImport, setShowImport] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setCategories(d));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams({ sort, page: String(page) });
    if (debouncedQ) sp.set("q", debouncedQ);
    if (categoryId) sp.set("categoryId", categoryId);
    if (status) sp.set("status", status);
    if (filter === "trash") sp.set("trash", "1");
    if (filter === "scheduled") sp.set("scheduled", "1");
    const res = await fetch(`/api/admin/videos?${sp}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
    setSelected(new Set());
  }, [debouncedQ, categoryId, status, sort, page, filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: number) {
    if (!confirm(filter === "trash" ? "Permanently delete?" : "Move to trash?"))
      return;
    if (filter === "trash") {
      await fetch("/api/admin/videos/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id], action: "purge" }),
      });
    } else {
      await fetch(`/api/admin/videos/${id}`, { method: "DELETE" });
    }
    load();
  }

  async function restoreOne(id: number) {
    await fetch("/api/admin/videos/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id], action: "restore" }),
    });
    load();
  }

  async function bulk(action: BulkAction) {
    if (
      (action === "delete" || action === "purge") &&
      !confirm(`${action === "purge" ? "Permanently delete" : "Trash"} ${selected.size} videos?`)
    )
      return;
    await fetch("/api/admin/videos/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selected], action }),
    });
    load();
  }

  async function runImport() {
    setImporting(true);
    setImportMsg("");
    const res = await fetch("/api/admin/videos/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: csvText }),
    });
    const d = await res.json().catch(() => ({}));
    setImporting(false);
    if (res.ok) {
      setImportMsg(
        `Created ${d.created ?? 0}, skipped ${d.skipped ?? 0}. Errors: ${(d.errors ?? []).length}`
      );
      if (d.created > 0) load();
    } else {
      setImportMsg(d.error ?? "Import failed");
    }
  }

  function toggleAll() {
    if (!data) return;
    setSelected(
      selected.size === data.items.length
        ? new Set()
        : new Set(data.items.map((v) => v.id))
    );
  }

  function toggle(id: number) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  const trashMode = filter === "trash";

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Videos</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowImport(!showImport)}
            className={ghostBtn}
          >
            Import CSV
          </button>
          <Link
            href="/admin/videos/new"
            className="glow rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            + Add video
          </Link>
        </div>
      </div>

      {showImport && (
        <div className="glass card-shadow mb-5 space-y-3 rounded-2xl border border-border p-5">
          <p className="text-sm text-muted">
            Headers: title,embedUrl,thumbnail,description,tags,seoTitle,seoDescription,categorySlugs,performerSlugs,duration,quality,views,featured,trending,published,exclusive.
            Duration can be seconds or mm:ss. Views can use k/m (e.g. 12k, 1.5m).
            Tip: build rows in{" "}
            <Link href={"/admin/videos/csv-maker" as Route} className="text-accent hover:underline">
              CSV Maker
            </Link>
            .
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label className="glow cursor-pointer rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover">
              Upload CSV file
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  const text = await file.text();
                  setCsvText(text);
                  setImportMsg(`Loaded ${file.name}`);
                }}
              />
            </label>
            <span className="text-xs text-muted">or paste below</span>
          </div>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={6}
            className={`${inputCls} w-full font-mono text-xs`}
            placeholder="Paste CSV..."
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={importing || !csvText.trim()}
              onClick={runImport}
              className="glow rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {importing ? "Importing..." : "Import"}
            </button>
            {importMsg && <span className="text-sm text-muted">{importMsg}</span>}
          </div>
        </div>
      )}

      <div className="mb-5 flex flex-wrap gap-2.5">
        <input
          placeholder="Search videos..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className={`${inputCls} w-full sm:w-64`}
        />
        <select
          value={categoryId}
          onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
          className={inputCls}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className={inputCls}
        >
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="featured">Featured</option>
          <option value="trending">Trending</option>
        </select>
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value as "" | "trash" | "scheduled");
            setPage(1);
          }}
          className={inputCls}
        >
          <option value="">Active</option>
          <option value="scheduled">Scheduled</option>
          <option value="trash">Trash</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className={inputCls}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="title">Title A–Z</option>
          <option value="views">Most views</option>
        </select>
      </div>

      {selected.size > 0 && (
        <div className="glass card-shadow mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-border px-4 py-3">
          <span className="text-sm font-medium text-foreground">
            {selected.size} selected
          </span>
          {trashMode ? (
            <>
              <button onClick={() => bulk("restore")} className={ghostBtn}>Restore</button>
              <button
                onClick={() => bulk("purge")}
                className="rounded-lg bg-red-500/10 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500 hover:text-white"
              >
                Purge
              </button>
            </>
          ) : (
            <>
              <button onClick={() => bulk("publish")} className={ghostBtn}>Publish</button>
              <button onClick={() => bulk("unpublish")} className={ghostBtn}>Unpublish</button>
              <button onClick={() => bulk("feature")} className={ghostBtn}>Feature</button>
              <button onClick={() => bulk("unfeature")} className={ghostBtn}>Unfeature</button>
              <button onClick={() => bulk("trend")} className={ghostBtn}>Trending</button>
              <button onClick={() => bulk("untrend")} className={ghostBtn}>Untrend</button>
              <button onClick={() => bulk("exclusive")} className={ghostBtn}>Exclusive</button>
              <button onClick={() => bulk("unexclusive")} className={ghostBtn}>Unexclusive</button>
              <button
                onClick={() => bulk("delete")}
                className="rounded-lg bg-red-500/10 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500 hover:text-white"
              >
                Trash
              </button>
            </>
          )}
        </div>
      )}

      <div className="card-shadow overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs tracking-wide text-muted uppercase">
              <th className="p-3.5">
                <input
                  type="checkbox"
                  className="accent-accent"
                  checked={!!data && data.items.length > 0 && selected.size === data.items.length}
                  onChange={toggleAll}
                />
              </th>
              <th className="p-3.5 font-medium">Video</th>
              <th className="p-3.5 font-medium">Category</th>
              <th className="p-3.5 font-medium">Status</th>
              <th className="p-3.5 font-medium">Date</th>
              <th className="p-3.5 font-medium">Views</th>
              <th className="p-3.5" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="p-3.5">
                <div className="space-y-2">
                  {[0, 1, 2].map((i) => <div key={i} className="skeleton h-10 rounded-lg" />)}
                </div>
              </td></tr>
            )}
            {!loading && data?.items.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-muted">No videos found.</td></tr>
            )}
            {!loading && data?.items.map((v) => {
              const scheduled =
                v.scheduledAt && new Date(v.scheduledAt) > new Date();
              return (
                <tr key={v.id} className="border-b border-border transition-colors last:border-b-0 hover:bg-surface-hover">
                  <td className="p-3.5">
                    <input type="checkbox" className="accent-accent" checked={selected.has(v.id)} onChange={() => toggle(v.id)} />
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={v.thumbnail} alt="" loading="lazy" className="h-10 w-16 shrink-0 rounded-md border border-border bg-surface-hover object-cover" />
                      <span className="max-w-xs truncate font-medium text-foreground">{v.title}</span>
                    </div>
                  </td>
                  <td className="p-3.5 text-muted">
                    {v.category ? `${v.category.icon} ${v.category.name}` : "—"}
                  </td>
                  <td className="p-3.5">
                    <div className="flex flex-wrap gap-1">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${v.published ? "bg-green-500/10 text-green-400" : "bg-surface-hover text-muted"}`}>
                        {v.published ? "Published" : "Draft"}
                      </span>
                      {v.featured && <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-gold">Featured</span>}
                      {v.trending && <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">Trending</span>}
                      {v.exclusive && <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-medium text-purple-300">Exclusive</span>}
                      {scheduled && <span className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-xs font-medium text-sky-300">Scheduled</span>}
                      {v.dmcaClaimed && <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">DMCA</span>}
                    </div>
                  </td>
                  <td className="p-3.5 whitespace-nowrap text-muted">{formatDate(v.createdAt)}</td>
                  <td className="p-3.5 text-muted">{formatViews(v.views)}</td>
                  <td className="p-3.5 whitespace-nowrap">
                    {trashMode ? (
                      <>
                        <button onClick={() => restoreOne(v.id)} className="mr-4 font-medium text-accent hover:text-accent-hover">Restore</button>
                        <button onClick={() => remove(v.id)} className="font-medium text-red-400 hover:text-red-300">Purge</button>
                      </>
                    ) : (
                      <>
                        <Link href={`/admin/videos/${v.id}` as Route} className="mr-4 font-medium text-accent hover:text-accent-hover">Edit</Link>
                        <button onClick={() => remove(v.id)} className="font-medium text-red-400 hover:text-red-300">Trash</button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between text-sm text-muted">
          <span>{data.total} videos</span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className={ghostBtn}>
              Prev
            </button>
            <span className="px-1">Page {data.page} / {data.totalPages}</span>
            <button disabled={page >= data.totalPages} onClick={() => setPage(page + 1)} className={ghostBtn}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
