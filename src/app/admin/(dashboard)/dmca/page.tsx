"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";

interface DmcaRow {
  id: number;
  name: string;
  email: string;
  url: string;
  company: string;
  details: string;
  status: string;
  createdAt: string;
}

const ghostBtn =
  "rounded-lg border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-surface-hover";

export default function DmcaPage() {
  const [items, setItems] = useState<DmcaRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/dmca");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id: number, status: string) {
    await fetch("/api/admin/dmca", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  async function processClaim(id: number) {
    if (!confirm("Process claim? Matching video will be unpublished and marked DMCA."))
      return;
    await fetch("/api/admin/dmca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, process: true }),
    });
    load();
  }

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-foreground">DMCA</h1>
      <div className="card-shadow overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs tracking-wide text-muted uppercase">
              <th className="p-3.5 font-medium">Claimant</th>
              <th className="p-3.5 font-medium">URL</th>
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
              <tr><td colSpan={5} className="p-8 text-center text-muted">No DMCA requests.</td></tr>
            )}
            {!loading && items.map((d) => (
              <tr key={d.id} className="border-b border-border last:border-b-0 hover:bg-surface-hover">
                <td className="p-3.5">
                  <p className="font-medium text-foreground">{d.name}</p>
                  <p className="text-xs text-muted">{d.email}</p>
                  {d.company && <p className="text-xs text-muted">{d.company}</p>}
                </td>
                <td className="p-3.5">
                  <a href={d.url} target="_blank" rel="noreferrer" className="break-all text-accent hover:text-accent-hover">
                    {d.url}
                  </a>
                  {d.details && <p className="mt-1 text-xs text-muted">{d.details}</p>}
                </td>
                <td className="p-3.5">
                  <span className="rounded-full bg-surface-hover px-2.5 py-0.5 text-xs">{d.status}</span>
                </td>
                <td className="p-3.5 whitespace-nowrap text-muted">{formatDate(d.createdAt)}</td>
                <td className="p-3.5 whitespace-nowrap">
                  <div className="flex flex-wrap gap-2">
                    {d.status === "open" && (
                      <>
                        <button
                          onClick={() => processClaim(d.id)}
                          className="glow rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover"
                        >
                          Process claim
                        </button>
                        <button onClick={() => setStatus(d.id, "dismissed")} className={ghostBtn}>
                          Dismiss
                        </button>
                      </>
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
