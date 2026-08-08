"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import ThumbImage from "./ThumbImage";

const KEY = "fp_unlock";

/**
 * Gates exclusive content only when an unlock code is configured in Settings.
 * If no code is set (or video is not exclusive), playback is free.
 */
export default function ExclusiveUnlock({
  exclusive,
  thumbnail,
  title,
  children,
}: {
  exclusive: boolean;
  thumbnail: string;
  title: string;
  children: ReactNode;
}) {
  const [unlocked, setUnlocked] = useState(!exclusive);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!exclusive) {
      setUnlocked(true);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        if (localStorage.getItem(KEY) === "1") {
          if (!cancelled) setUnlocked(true);
          return;
        }
      } catch {
        /* ignore */
      }

      // No unlock code configured → play free (never soft-lock the site)
      try {
        const res = await fetch("/api/unlock", { method: "GET" });
        const data = (await res.json().catch(() => ({}))) as {
          configured?: boolean;
        };
        if (!data.configured) {
          if (!cancelled) setUnlocked(true);
          return;
        }
      } catch {
        if (!cancelled) setUnlocked(true);
        return;
      }

      if (!cancelled) setUnlocked(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [exclusive]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Invalid unlock code");
      }
      localStorage.setItem(KEY, "1");
      setUnlocked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unlock failed");
    } finally {
      setLoading(false);
    }
  }

  if (unlocked) return <div className="h-full w-full">{children}</div>;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-surface">
      <ThumbImage
        src={thumbnail}
        alt={title}
        className="absolute inset-0 h-full w-full object-cover blur-md scale-105"
      />
      <div className="absolute inset-0 bg-black/65" />
      <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-sm rounded-2xl border border-gold/30 bg-surface/95 p-6 text-center backdrop-blur"
        >
          <p className="text-xs font-bold tracking-wide text-gold">EXCLUSIVE</p>
          <h3 className="mt-2 text-lg font-semibold">Enter unlock code</h3>
          <p className="mt-1 text-xs text-muted">
            This video requires an unlock code to play.
          </p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mt-4 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-center text-sm outline-none focus:border-gold/50"
            placeholder="Unlock code"
            autoComplete="off"
          />
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Checking…" : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
}
