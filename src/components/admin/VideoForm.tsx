"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  durationFromParts,
  durationToParts,
  isSafeUrl,
  parseViewsInput,
  slugify,
  toEmbedUrl,
} from "@/lib/utils";
import { QUALITY_OPTIONS } from "@/lib/videos";
import type { VideoInput } from "@/types";
import MultiSearchSelect from "./MultiSearchSelect";
import Toggle from "./Toggle";

export interface CategoryOption {
  id: number;
  name: string;
  icon: string;
  enabled: boolean;
}

export interface PerformerOption {
  id: number;
  name: string;
  slug: string;
  imageUrl: string;
  enabled: boolean;
}

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/50";
const labelCls =
  "mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase";
const sectionCls = "glass card-shadow space-y-5 rounded-2xl border border-border p-6";

function toLocalInput(v?: string | null): string {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function VideoForm({
  categories,
  performers = [],
  initial,
  videoId,
}: {
  categories: CategoryOption[];
  performers?: PerformerOption[];
  initial?: VideoInput;
  videoId?: number;
}) {
  const router = useRouter();
  const [form, setForm] = useState<VideoInput>({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    embedUrl: initial?.embedUrl ?? "",
    thumbnail: initial?.thumbnail ?? "",
    description: initial?.description ?? "",
    tags: initial?.tags ?? "",
    seoTitle: initial?.seoTitle ?? "",
    seoDescription: initial?.seoDescription ?? "",
    featured: initial?.featured ?? false,
    trending: initial?.trending ?? false,
    published: initial?.published ?? true,
    exclusive: initial?.exclusive ?? false,
    duration: initial?.duration ?? 0,
    quality: initial?.quality ?? "720p",
    views: initial?.views ?? 0,
    scheduledAt: initial?.scheduledAt ?? null,
    categoryId: initial?.categoryId ?? null,
    categoryIds:
      initial?.categoryIds ??
      (initial?.categoryId != null ? [initial.categoryId] : []),
    performerIds: initial?.performerIds ?? [],
  });
  const initialParts = durationToParts(Number(initial?.duration) || 0);
  const [minutes, setMinutes] = useState(String(initialParts.minutes));
  const [seconds, setSeconds] = useState(String(initialParts.seconds));
  const [viewsInput, setViewsInput] = useState(String(initial?.views ?? 0));
  const [slugEdited, setSlugEdited] = useState(!!videoId);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  function set<K extends keyof VideoInput>(key: K, value: VideoInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleCategory(id: number) {
    setForm((f) => {
      const cur = f.categoryIds ?? [];
      const next = cur.includes(id)
        ? cur.filter((x) => x !== id)
        : [...cur, id];
      return {
        ...f,
        categoryIds: next,
        categoryId: next[0] ?? null,
      };
    });
  }

  const sortedCategories = [...categories].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const payload = {
      ...form,
      duration: durationFromParts(Number(minutes), Number(seconds)),
      views: parseViewsInput(viewsInput),
      scheduledAt: form.scheduledAt || null,
    };
    const res = await fetch(
      videoId ? `/api/admin/videos/${videoId}` : "/api/admin/videos",
      {
        method: videoId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    setSaving(false);
    if (res.ok) {
      router.push("/admin/videos");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Save failed");
    }
  }

  return (
    <form onSubmit={save} className="max-w-3xl space-y-6">
      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className={sectionCls}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Title *</label>
            <input
              value={form.title}
              onChange={(e) => {
                set("title", e.target.value);
                if (!slugEdited) set("slug", slugify(e.target.value));
              }}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Slug</label>
            <input
              value={form.slug}
              onChange={(e) => {
                setSlugEdited(true);
                set("slug", e.target.value);
              }}
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Embed URL *</label>
          <textarea
            value={form.embedUrl}
            onChange={(e) => {
              const raw = e.target.value;
              // Auto-extract src when full iframe / embed HTML is pasted
              if (/<iframe/i.test(raw) || /src\s*=/i.test(raw)) {
                set("embedUrl", toEmbedUrl(raw));
              } else {
                set("embedUrl", raw);
              }
            }}
            onBlur={() => {
              if (form.embedUrl?.trim()) {
                set("embedUrl", toEmbedUrl(form.embedUrl));
              }
            }}
            onPaste={(e) => {
              const text = e.clipboardData.getData("text");
              if (text && (/<iframe/i.test(text) || (text.includes("<") && /src\s*=/i.test(text)))) {
                e.preventDefault();
                set("embedUrl", toEmbedUrl(text));
              }
            }}
            placeholder='Paste https://… or full <iframe src="…"></iframe> code'
            rows={3}
            className={`${inputCls} font-mono text-xs`}
          />
          <p className="mt-1 text-[11px] text-muted">
            Paste a full embed/iframe code — the player <code className="text-foreground">src</code> URL is extracted automatically.
          </p>
        </div>

        <div>
          <label className={labelCls}>Thumbnail URL *</label>
          <input
            value={form.thumbnail}
            onChange={(e) => set("thumbnail", e.target.value)}
            placeholder="https://..."
            className={inputCls}
          />
          {isSafeUrl(form.thumbnail) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.thumbnail}
              alt="Thumbnail preview"
              className="card-shadow mt-3 h-28 w-48 rounded-xl border border-border bg-surface-hover object-cover"
            />
          )}
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={4}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>
            Categories (select one or more · A–Z)
          </label>
          {sortedCategories.length === 0 ? (
            <p className="text-xs text-muted">No categories yet.</p>
          ) : (
            <div className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-background/50 p-2">
              <div className="flex flex-wrap gap-2">
                {sortedCategories.map((c) => {
                  const on = (form.categoryIds ?? []).includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCategory(c.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        on
                          ? "border-accent bg-accent/15 text-foreground"
                          : "border-border bg-background text-muted hover:border-accent/40"
                      }`}
                    >
                      <span>{c.icon}</span>
                      {c.name}
                      {!c.enabled ? " (off)" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <p className="mt-1 text-[11px] text-muted">
            First selected is the primary category on cards.
          </p>
        </div>

        <div>
          <label className={labelCls}>Tags (comma separated)</label>
          <input
            value={form.tags}
            onChange={(e) => set("tags", e.target.value)}
            placeholder="action, thriller"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Performers</label>
          {performers.length === 0 ? (
            <p className="text-xs text-muted">
              No performers yet. Add them under Admin → Performers.
            </p>
          ) : (
            <MultiSearchSelect
              options={[...performers]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((p) => ({
                  id: p.id,
                  label: p.name,
                  imageUrl: p.imageUrl,
                  hint: p.enabled ? undefined : "off",
                }))}
              value={form.performerIds ?? []}
              onChange={(next) =>
                set(
                  "performerIds",
                  next.map((id) => Number(id)).filter(Number.isInteger)
                )
              }
              placeholder="Search performers by name…"
              emptyText="No performers match that name"
            />
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={labelCls}>Duration</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className={inputCls}
                aria-label="Minutes"
              />
              <span className="shrink-0 text-xs text-muted">min</span>
              <input
                type="number"
                min={0}
                max={59}
                value={seconds}
                onChange={(e) => setSeconds(e.target.value)}
                className={inputCls}
                aria-label="Seconds"
              />
              <span className="shrink-0 text-xs text-muted">sec</span>
            </div>
          </div>
          <div>
            <label className={labelCls}>Quality</label>
            <select
              value={form.quality ?? "720p"}
              onChange={(e) => set("quality", e.target.value)}
              className={inputCls}
            >
              {QUALITY_OPTIONS.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Views count</label>
            <input
              value={viewsInput}
              onChange={(e) => setViewsInput(e.target.value)}
              className={inputCls}
              placeholder="1500, 12k, 1.5m"
            />
            <p className="mt-1 text-[11px] text-muted">Supports k and m suffixes</p>
          </div>
          <div>
            <label className={labelCls}>Scheduled At</label>
            <input
              type="datetime-local"
              value={toLocalInput(form.scheduledAt)}
              onChange={(e) =>
                set("scheduledAt", e.target.value ? e.target.value : null)
              }
              className={inputCls}
            />
          </div>
        </div>
        <p className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-2.5 text-xs leading-relaxed text-amber-200/90">
          View counts are site-managed (manual + on-site watches). They are{" "}
          <strong>not</strong> pulled from the embed host (YouTube, tubes, etc.).
          Use this number to highlight popular videos on FreePremium.
        </p>
      </div>

      <div className={sectionCls}>
        <p className="text-sm font-semibold text-foreground">SEO</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelCls}>SEO Title</label>
            <input
              value={form.seoTitle}
              onChange={(e) => set("seoTitle", e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>SEO Description *</label>
            <input
              value={form.seoDescription}
              onChange={(e) => set("seoDescription", e.target.value)}
              className={inputCls}
              required
              minLength={20}
            />
          </div>
        </div>
      </div>

      <div className={`${sectionCls} flex flex-wrap gap-8 space-y-0`}>
        <Toggle
          checked={!!form.featured}
          onChange={(v) => set("featured", v)}
          label="Featured (max 6 — oldest drops off)"
        />
        <Toggle checked={!!form.trending} onChange={(v) => set("trending", v)} label="Trending" />
        <Toggle checked={!!form.published} onChange={(v) => set("published", v)} label="Published" />
        <Toggle checked={!!form.exclusive} onChange={(v) => set("exclusive", v)} label="Exclusive" />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="glow rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setPreview(!preview)}
          className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
        >
          {preview ? "Hide preview" : "Preview"}
        </button>
      </div>

      {preview && (
        isSafeUrl(form.embedUrl ?? "") ? (
          <div className="card-shadow aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black">
            <iframe
              src={toEmbedUrl(form.embedUrl ?? "")}
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        ) : (
          <p className="text-sm text-muted">Enter a valid embed URL to preview.</p>
        )
      )}
    </form>
  );
}
