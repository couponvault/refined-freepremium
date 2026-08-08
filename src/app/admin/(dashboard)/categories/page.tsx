"use client";

import { useEffect, useState } from "react";
import Toggle from "@/components/admin/Toggle";
import { isSafeUrl } from "@/lib/utils";

interface Cat {
  id: number;
  name: string;
  slug: string;
  icon: string;
  imageUrl: string;
  order: number;
  enabled: boolean;
  description: string;
  _count: { videos: number };
}

const inputCls =
  "rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/50";

export default function CategoriesPage() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("🎬");
  const [newImage, setNewImage] = useState("");
  const [newOrder, setNewOrder] = useState(0);
  const [newDesc, setNewDesc] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editDesc, setEditDesc] = useState("");

  async function load() {
    const res = await fetch("/api/admin/categories", { cache: "no-store" });
    if (res.ok) setCats(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function patch(id: number, data: Record<string, unknown>) {
    setError("");
    const res = await fetch(`/api/admin/categories/${id}`, {
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
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        icon: newIcon,
        imageUrl: newImage,
        order: newOrder,
        description: newDesc,
      }),
    });
    if (res.ok) {
      setNewName("");
      setNewIcon("🎬");
      setNewImage("");
      setNewOrder(0);
      setNewDesc("");
      load();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Create failed");
    }
  }

  async function remove(c: Cat) {
    if (
      !confirm(
        `Delete "${c.name}"? Its ${c._count.videos} videos will be kept without a category.`
      )
    )
      return;
    await fetch(`/api/admin/categories/${c.id}`, { method: "DELETE" });
    load();
  }

  function saveEdit(id: number) {
    patch(id, {
      name: editName,
      icon: editIcon,
      imageUrl: editImage,
      description: editDesc,
    });
    setEditId(null);
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-foreground">
        Categories
      </h1>

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
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">
              Icon
            </label>
            <input
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value)}
              className={`${inputCls} w-16 text-center`}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">
              Order
            </label>
            <input
              type="number"
              value={newOrder}
              onChange={(e) => setNewOrder(Number(e.target.value))}
              className={`${inputCls} w-20`}
            />
          </div>
          <button
            type="submit"
            className="glow rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Add category
          </button>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">
            Cover image URL
          </label>
          <input
            value={newImage}
            onChange={(e) => setNewImage(e.target.value)}
            placeholder="https://... (shown behind category name)"
            className={`${inputCls} w-full`}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">
            Description
          </label>
          <textarea
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            rows={2}
            className={`${inputCls} w-full`}
          />
        </div>
      </form>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      <div className="card-shadow overflow-hidden rounded-2xl border border-border bg-surface">
        {loading && (
          <div className="space-y-2 p-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-10 rounded-lg" />
            ))}
          </div>
        )}
        {!loading && cats.length === 0 && (
          <p className="p-8 text-center text-sm text-muted">No categories yet.</p>
        )}
        {!loading &&
          cats.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-border p-4 transition-colors last:border-b-0 hover:bg-surface-hover"
            >
              {editId === c.id ? (
                <div className="flex w-full flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      value={editIcon}
                      onChange={(e) => setEditIcon(e.target.value)}
                      className={`${inputCls} w-14 text-center`}
                    />
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className={`${inputCls} flex-1`}
                    />
                    <button
                      onClick={() => saveEdit(c.id)}
                      className="glow rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white hover:bg-accent-hover"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="rounded-lg border border-border px-3.5 py-2 text-sm text-muted hover:bg-surface-hover"
                    >
                      Cancel
                    </button>
                  </div>
                  <input
                    value={editImage}
                    onChange={(e) => setEditImage(e.target.value)}
                    placeholder="Cover image URL"
                    className={`${inputCls} w-full`}
                  />
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={2}
                    placeholder="Description"
                    className={`${inputCls} w-full`}
                  />
                </div>
              ) : (
                <>
                  {c.imageUrl && isSafeUrl(c.imageUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.imageUrl}
                      alt=""
                      className="h-12 w-16 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-hover text-lg">
                      {c.icon}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{c.name}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      /{c.slug} · {c._count.videos} videos
                    </p>
                    {c.description && (
                      <p className="mt-1 text-xs text-muted line-clamp-2">
                        {c.description}
                      </p>
                    )}
                  </div>
                  <input
                    type="number"
                    defaultValue={c.order}
                    onBlur={(e) => {
                      const v = Number(e.target.value);
                      if (v !== c.order) patch(c.id, { order: v });
                    }}
                    title="Order"
                    className={`${inputCls} w-18`}
                  />
                  <div className="flex shrink-0 items-center gap-5">
                    <Toggle
                      checked={c.enabled}
                      onChange={(v) => patch(c.id, { enabled: v })}
                    />
                    <button
                      onClick={() => {
                        setEditId(c.id);
                        setEditName(c.name);
                        setEditIcon(c.icon);
                        setEditImage(c.imageUrl ?? "");
                        setEditDesc(c.description ?? "");
                      }}
                      className="text-sm font-medium text-accent hover:text-accent-hover"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(c)}
                      className="text-sm font-medium text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
