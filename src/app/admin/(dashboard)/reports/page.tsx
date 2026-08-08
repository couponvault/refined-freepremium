"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { formatDate } from "@/lib/utils";

interface ReportRow {
  id: number;
  reason: string;
  details: string;
  email: string;
  status: string;
  createdAt: string;
  video: { id: number; title: string; slug: string; published: boolean };
}

const ghostBtn =
  "rounded-lg border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-surface-hover";

export default function ReportsPage() {
  const [items, setItems] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/reports");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id: number, status: string) {
    await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  async function unpublish(videoId: number) {
    await fetch("/api/admin/videos/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [videoId], action: "unpublish" }),
    });
    load();
  }

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-foreground">Reports</h1>
      <div className="card-shadow overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs tracking-wide text-muted uppercase">
              <th className="p-3.5 font-medium">Video</th>
              <th className="p-3.5 font-medium">Reason</th>
              <th className="p-3.5 font-medium">Status</th>
              <th className="p-3.5 font-medium">Date</th>
              <th className="p-3.5" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="p-4"><div className="skeleton h-10 rounded-lg" /></td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-muted">No reports.</td></tr>
            )}
            {!loading && items.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-b-0 hover:bg-surface-hover">
                <td className="p-3.5">
                  <Link
                    href={`/admin/videos/${r.video.id}` as Route}
                    className="font-medium text-accent hover:text-accent-hover"
                  >
                    {r.video.title}
                  </Link>
                </td>
                <td className="p-3.5 text-muted">
                  <p>{r.reason}</p>
                  {r.details && <p className="mt-1 text-xs opacity-70">{r.details}</p>}
                </td>
                <td className="p-3.5">
                  <span className="rounded-full bg-surface-hover px-2.5 py-0.5 text-xs">{r.status}</span>
                </td>
                <td className="p-3.5 whitespace-nowrap text-muted">{formatDate(r.createdAt)}</td>
                <td className="p-3.5 whitespace-nowrap">
                  <div className="flex flex-wrap gap-2">
                    {r.status === "open" && (
                      <>
                        <button onClick={() => setStatus(r.id, "resolved")} className={ghostBtn}>
                          Resolve
                        </button>
                        <button onClick={() => setStatus(r.id, "dismissed")} className={ghostBtn}>
                          Dismiss
                        </button>
                      </>
                    )}
                    {r.video.published && (
                      <button
                        onClick={() => unpublish(r.video.id)}
                        className="rounded-lg bg-red-500/10 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500 hover:text-white"
                      >
                        Unpublish video
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
