"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { QUALITY_OPTIONS, formatDuration } from "@/lib/videos";
import MultiSearchSelect from "@/components/admin/MultiSearchSelect";
import {
  durationFromParts,
  formatViews,
  isAllowedEmbedUrl,
  isAllowedMediaUrl,
  isSafeUrl,
  parseClockToParts,
  parseViewsInput,
  slugify,
  toEmbedUrl,
} from "@/lib/utils";

interface Cat {
  id: number;
  name: string;
  slug: string;
  icon: string;
  enabled: boolean;
}

interface PerformerOpt {
  id: number;
  name: string;
  slug: string;
  imageUrl: string;
  enabled: boolean;
}

interface CsvRow {
  id: string;
  title: string;
  embedUrl: string;
  thumbnail: string;
  description: string;
  tags: string;
  seoTitle: string;
  seoDescription: string;
  categorySlugs: string;
  performerSlugs: string;
  duration: string;
  quality: string;
  views: string;
  featured: boolean;
  trending: boolean;
  published: boolean;
  exclusive: boolean;
}

const HEADERS = [
  "title",
  "embedUrl",
  "thumbnail",
  "description",
  "tags",
  "seoTitle",
  "seoDescription",
  "categorySlugs",
  "performerSlugs",
  "duration",
  "quality",
  "views",
  "featured",
  "trending",
  "published",
  "exclusive",
] as const;

const emptyForm = () => ({
  title: "",
  embedUrl: "",
  thumbnail: "",
  description: "",
  tags: "",
  seoTitle: "",
  seoDescription: "",
  categorySlugs: [] as string[],
  performerSlugs: [] as string[],
  minutes: "0",
  seconds: "0",
  quality: "720p",
  views: "0",
  featured: false,
  trending: false,
  published: true,
  exclusive: false,
});

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/50";
const labelCls =
  "mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase";

function csvEscape(v: string): string {
  if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function buildCsv(rows: CsvRow[]): string {
  const lines = [HEADERS.join(",")];
  for (const r of rows) {
    const seoTitle = r.seoTitle.trim() || r.title.trim();
    let seoDescription = r.seoDescription.trim();
    if (seoDescription.length < 20) {
      const base =
        r.description.trim() ||
        `Watch ${r.title.trim()} online free on FreePremium.`;
      seoDescription = base.length >= 20 ? base : `${base} Adult video streaming.`.slice(0, 160);
      if (seoDescription.length < 20) seoDescription = seoDescription.padEnd(20, ".");
    }
    const values = [
      r.title.trim(),
      r.embedUrl.trim(),
      r.thumbnail.trim(),
      r.description.trim(),
      r.tags.trim(),
      seoTitle,
      seoDescription,
      r.categorySlugs.trim(),
      r.performerSlugs.trim(),
      String(Math.max(0, Number(r.duration) || 0)),
      r.quality || "720p",
      String(Math.max(0, Number(r.views) || 0)),
      r.featured ? "true" : "false",
      r.trending ? "true" : "false",
      r.published ? "true" : "false",
      r.exclusive ? "true" : "false",
    ];
    lines.push(values.map(csvEscape).join(","));
  }
  return lines.join("\n");
}

export default function CsvMakerPage() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [performers, setPerformers] = useState<PerformerOpt[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [sourceLink, setSourceLink] = useState("");
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    function loadMeta() {
      fetch("/api/admin/categories", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d)) setCats(d);
        })
        .catch(() => {});
      fetch("/api/admin/performers", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d)) setPerformers(d);
        })
        .catch(() => {});
    }
    loadMeta();
    const onFocus = () => loadMeta();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") loadMeta();
    });
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  function toggleCategorySlug(slug: string) {
    setForm((f) => {
      const cur = f.categorySlugs;
      return {
        ...f,
        categorySlugs: cur.includes(slug)
          ? cur.filter((s) => s !== slug)
          : [...cur, slug],
      };
    });
  }

  const sortedCats = [...cats].sort((a, b) => a.name.localeCompare(b.name));

  const embedSet = useMemo(
    () => new Set(rows.map((r) => r.embedUrl.trim().toLowerCase())),
    [rows]
  );

  function set<K extends keyof ReturnType<typeof emptyForm>>(
    key: K,
    value: ReturnType<typeof emptyForm>[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function extractFromLink() {
    setError("");
    setMsg("");
    const url = sourceLink.trim();
    if (!url) {
      setError("Paste a Pornhub video link first.");
      return;
    }
    setExtracting(true);
    try {
      const res = await fetch("/api/admin/extract-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        title?: string;
        imageUrl?: string;
        embedUrl?: string;
        tagsText?: string;
        categorySlugs?: string[];
        performerSlugs?: string[];
        createdCategories?: string[];
        createdPerformers?: string[];
        views?: string;
        length?: string;
      };
      if (!res.ok) {
        setError(data.error || "Extract failed");
        return;
      }

      // Reload pickers so newly created cats/stars appear, then fill the form
      const [catsRes, perfRes] = await Promise.all([
        fetch("/api/admin/categories", { cache: "no-store" }),
        fetch("/api/admin/performers", { cache: "no-store" }),
      ]);
      const nextCats = catsRes.ok ? await catsRes.json() : null;
      const nextPerfs = perfRes.ok ? await perfRes.json() : null;
      if (Array.isArray(nextCats)) setCats(nextCats);
      if (Array.isArray(nextPerfs)) setPerformers(nextPerfs);

      const clock = parseClockToParts(data.length || "");
      const catSlugs = [...new Set(data.categorySlugs || [])];
      const perfSlugs = [...new Set(data.performerSlugs || [])];
      const tags = (data.tagsText || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .join(", ");

      const title = (data.title || "").trim();
      setForm((f) => ({
        ...f,
        title: title || f.title,
        embedUrl: toEmbedUrl(data.embedUrl || "") || f.embedUrl,
        thumbnail: (data.imageUrl || "").trim() || f.thumbnail,
        tags: tags || f.tags,
        seoTitle: title || f.seoTitle,
        seoDescription:
          title.length >= 20
            ? `Watch ${title} free on FreePremium.`.slice(0, 160)
            : f.seoDescription,
        categorySlugs: catSlugs.length ? catSlugs : f.categorySlugs,
        performerSlugs: perfSlugs.length ? perfSlugs : f.performerSlugs,
        minutes: clock.minutes,
        seconds: clock.seconds,
        views: (data.views || "").replace(/\s*views?/i, "").trim() || f.views,
      }));

      const notes: string[] = ["Filled from link (local Chrome)."];
      if (data.createdPerformers?.length) {
        notes.push(
          `New pornstars: ${data.createdPerformers.join(", ")}.`
        );
      }
      if (data.createdCategories?.length) {
        notes.push(
          `New categories: ${data.createdCategories.join(", ")}.`
        );
      }
      setMsg(notes.join(" "));
    } catch {
      setError(
        "Extract failed. Use `npm run dev` on this PC with Chrome or Edge installed."
      );
    } finally {
      setExtracting(false);
    }
  }

  function addRow(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    const title = form.title.trim();
    const embedUrl = toEmbedUrl(form.embedUrl);
    const thumbnail = form.thumbnail.trim();
    if (!title) return setError("Title is required");
    if (!embedUrl || !isAllowedEmbedUrl(embedUrl))
      return setError("Embed URL must be https on an allowed host");
    if (!thumbnail || !isAllowedMediaUrl(thumbnail))
      return setError("Valid thumbnail URL is required");
    if (embedSet.has(embedUrl.toLowerCase()))
      return setError("This embed URL is already in your list");

    const duration = durationFromParts(Number(form.minutes), Number(form.seconds));
    const views = parseViewsInput(form.views);

    setRows((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${slugify(title) || "row"}`,
        title,
        embedUrl,
        thumbnail,
        description: form.description,
        tags: form.tags,
        seoTitle: form.seoTitle.trim() || title,
        seoDescription: form.seoDescription,
        categorySlugs: form.categorySlugs.join(","),
        performerSlugs: form.performerSlugs.join(","),
        duration: String(duration),
        quality: form.quality,
        views: String(views),
        featured: form.featured,
        trending: form.trending,
        published: form.published,
        exclusive: form.exclusive,
      },
    ]);
    setForm((f) => ({
      ...emptyForm(),
      categorySlugs: f.categorySlugs,
      performerSlugs: f.performerSlugs,
      quality: f.quality,
      published: f.published,
    }));
    setMsg("Added to list");
    setTimeout(() => setMsg(""), 1500);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function downloadCsv() {
    if (rows.length === 0) return setError("Add at least one video first");
    setError("");
    const csv = buildCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `freepremium-videos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg(`CSV ready — ${rows.length} video(s). Import it on Videos → Import CSV.`);
  }

  function copyCsv() {
    if (rows.length === 0) return setError("Add at least one video first");
    setError("");
    void navigator.clipboard.writeText(buildCsv(rows)).then(() => {
      setMsg("CSV copied to clipboard");
      setTimeout(() => setMsg(""), 2000);
    });
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            CSV Maker
          </h1>
          <p className="mt-1 text-sm text-muted">
            Add videos one by one, then download a CSV and import it on the{" "}
            <Link href="/admin/videos" className="text-accent hover:underline">
              Videos
            </Link>{" "}
            page.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copyCsv}
            disabled={rows.length === 0}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover disabled:opacity-50"
          >
            Copy CSV
          </button>
          <button
            type="button"
            onClick={downloadCsv}
            disabled={rows.length === 0}
            className="glow rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            Create CSV ({rows.length})
          </button>
        </div>
      </div>

      <p className="mb-5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-2.5 text-xs leading-relaxed text-amber-200/90">
        Views you enter here are for FreePremium popularity display. They are{" "}
        <strong>not</strong> live counts from the embed host. Import still skips
        duplicate embed URLs already in the database.
      </p>

      <div className="glass card-shadow mb-6 space-y-3 rounded-2xl border border-accent/30 bg-accent/5 p-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Auto-fill from video link
          </h2>
          <p className="mt-1 text-xs text-muted">
            Same engine as your Desktop Link Meta tool: paste a Pornhub link →
            Extract fills title, thumb, embed, tags, views, length. Missing
            categories and pornstars are created automatically. Local only —
            needs Chrome/Edge + <code className="text-foreground">npm run dev</code>.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label className={labelCls}>Video link</label>
            <input
              value={sourceLink}
              onChange={(e) => setSourceLink(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  extractFromLink();
                }
              }}
              className={inputCls}
              placeholder="https://www.pornhub.org/view_video.php?viewkey=..."
            />
          </div>
          <button
            type="button"
            onClick={extractFromLink}
            disabled={extracting}
            className="glow shrink-0 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
          >
            {extracting ? "Extracting…" : "Extract"}
          </button>
        </div>
      </div>

      <form
        onSubmit={addRow}
        className="glass card-shadow mb-6 space-y-4 rounded-2xl border border-border p-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls}>Title *</label>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className={inputCls}
              placeholder="Video title"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Embed URL *</label>
            <textarea
              value={form.embedUrl}
              onChange={(e) => {
                const raw = e.target.value;
                if (/<iframe/i.test(raw) || /src\s*=/i.test(raw)) {
                  set("embedUrl", toEmbedUrl(raw));
                } else {
                  set("embedUrl", raw);
                }
              }}
              onBlur={() => {
                if (form.embedUrl.trim()) {
                  set("embedUrl", toEmbedUrl(form.embedUrl));
                }
              }}
              onPaste={(e) => {
                const text = e.clipboardData.getData("text");
                if (
                  text &&
                  (/<iframe/i.test(text) ||
                    (text.includes("<") && /src\s*=/i.test(text)))
                ) {
                  e.preventDefault();
                  set("embedUrl", toEmbedUrl(text));
                }
              }}
              className={`${inputCls} font-mono text-xs`}
              rows={3}
              placeholder='Paste https://… or full <iframe src="…"></iframe> code'
            />
            <p className="mt-1 text-[11px] text-muted">
              Full iframe/embed HTML is OK — we auto-extract the player URL.
            </p>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Thumbnail URL *</label>
            <input
              value={form.thumbnail}
              onChange={(e) => set("thumbnail", e.target.value)}
              className={inputCls}
              placeholder="https://..."
            />
            {isSafeUrl(form.thumbnail) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.thumbnail}
                alt=""
                className="mt-2 h-20 w-36 rounded-lg border border-border object-cover"
              />
            )}
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>
              Categories (select one or more · A–Z)
            </label>
            {sortedCats.length === 0 ? (
              <p className="text-xs text-muted">
                None yet — add them in{" "}
                <Link href="/admin/categories" className="text-accent hover:underline">
                  Categories
                </Link>
                .
              </p>
            ) : (
              <div className="mt-1 max-h-44 overflow-y-auto rounded-lg border border-border bg-background/50 p-2">
                <div className="flex flex-wrap gap-2">
                  {sortedCats
                    .filter((c) => c.enabled)
                    .map((c) => {
                      const on = form.categorySlugs.includes(c.slug);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleCategorySlug(c.slug)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                            on
                              ? "border-accent bg-accent/15 text-foreground"
                              : "border-border bg-background text-muted hover:border-accent/40"
                          }`}
                        >
                          <span>{c.icon}</span>
                          {c.name}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
          <div className="sm:col-span-2">
            {performers.length === 0 ? (
              <>
                <label className={labelCls}>Performers</label>
                <p className="text-xs text-muted">
                  None yet — add them in{" "}
                  <Link
                    href="/admin/performers"
                    className="text-accent hover:underline"
                  >
                    Performers
                  </Link>
                  .
                </p>
              </>
            ) : (
              <MultiSearchSelect
                label="Performers (search & select multiple)"
                options={[...performers]
                  .filter((p) => p.enabled)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((p) => ({
                    id: p.slug,
                    label: p.name,
                    imageUrl: p.imageUrl,
                  }))}
                value={form.performerSlugs}
                onChange={(next) =>
                  set(
                    "performerSlugs",
                    next.map(String)
                  )
                }
                placeholder="Search performers by name…"
                emptyText="No performers match that name"
              />
            )}
          </div>
          <div>
            <label className={labelCls}>Views</label>
            <input
              value={form.views}
              onChange={(e) => set("views", e.target.value)}
              className={inputCls}
              placeholder="e.g. 1500, 12k, 1.5m"
            />
            <p className="mt-1 text-[11px] text-muted">
              Use k / m (12k = 12,000 · 1.5m = 1,500,000)
            </p>
          </div>
          <div>
            <label className={labelCls}>Duration</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={form.minutes}
                onChange={(e) => set("minutes", e.target.value)}
                className={inputCls}
                placeholder="0"
                aria-label="Minutes"
              />
              <span className="shrink-0 text-sm font-medium text-muted">min</span>
              <input
                type="number"
                min={0}
                max={59}
                value={form.seconds}
                onChange={(e) => set("seconds", e.target.value)}
                className={inputCls}
                placeholder="0"
                aria-label="Seconds"
              />
              <span className="shrink-0 text-sm font-medium text-muted">sec</span>
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Quality</label>
            <select
              value={form.quality}
              onChange={(e) => set("quality", e.target.value)}
              className={inputCls}
            >
              {QUALITY_OPTIONS.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Tags (comma separated)</label>
            <input
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              className={inputCls}
              placeholder="tag1, tag2"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>SEO Title (optional)</label>
            <input
              value={form.seoTitle}
              onChange={(e) => set("seoTitle", e.target.value)}
              className={inputCls}
              placeholder="Defaults to title"
            />
          </div>
          <div>
            <label className={labelCls}>SEO Description (optional)</label>
            <input
              value={form.seoDescription}
              onChange={(e) => set("seoDescription", e.target.value)}
              className={inputCls}
              placeholder="Auto-filled if empty"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-foreground">
          {(
            [
              ["featured", "Featured"],
              ["trending", "Trending"],
              ["published", "Published"],
              ["exclusive", "Exclusive"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-muted">
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(e) => set(key, e.target.checked)}
                className="accent-[var(--accent)]"
              />
              {label}
            </label>
          ))}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {msg && <p className="text-sm text-green-400">{msg}</p>}

        <button
          type="submit"
          className="glow rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover"
        >
          Add to list
        </button>
      </form>

      <div className="card-shadow overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            Queued videos ({rows.length})
          </h2>
          {rows.length > 0 && (
            <button
              type="button"
              onClick={() => setRows([])}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Clear all
            </button>
          )}
        </div>
        {rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted">
            No videos yet. Fill the form and click Add to list.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r, i) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-surface-hover"
              >
                <span className="w-6 text-xs text-muted">{i + 1}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={r.thumbnail}
                  alt=""
                  className="h-12 w-20 rounded-md object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {r.title}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {r.categorySlugs || "uncategorized"}
                    {r.performerSlugs ? ` · ${r.performerSlugs}` : ""} ·{" "}
                    {formatViews(Number(r.views) || 0)} views
                    {Number(r.duration) > 0
                      ? ` · ${formatDuration(Number(r.duration))}`
                      : ""}{" "}
                    · {r.quality}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(r.id)}
                  className="text-xs font-medium text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
