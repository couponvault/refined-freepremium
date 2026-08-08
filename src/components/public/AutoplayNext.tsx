"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ThumbImage from "./ThumbImage";

const KEY = "fp_autoplay";

export interface NextVideo {
  slug: string;
  title: string;
  thumbnail: string;
}

export default function AutoplayNext({
  next,
  durationSec,
  playing,
}: {
  next: NextVideo | null;
  durationSec: number;
  playing: boolean;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(true);
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (v === "0") setEnabled(false);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!playing || !next || !enabled) {
      setLeft(null);
      return;
    }
    const watchFor = Math.max((durationSec > 0 ? durationSec : 180) - 8, 25);
    const start = window.setTimeout(() => setLeft(8), watchFor * 1000);
    return () => window.clearTimeout(start);
  }, [playing, next, enabled, durationSec]);

  useEffect(() => {
    if (left == null || left < 0) return;
    if (left === 0 && next) {
      router.push(`/video/${next.slug}`);
      return;
    }
    const t = window.setTimeout(() => setLeft((s) => (s == null ? null : s - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [left, next, router]);

  useEffect(() => {
    if (!next) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
        return;
      if (e.key === "n" || e.key === "N") router.push(`/video/${next.slug}`);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, router]);

  function toggle() {
    const nextEnabled = !enabled;
    setEnabled(nextEnabled);
    setLeft(null);
    try {
      localStorage.setItem(KEY, nextEnabled ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  if (!next) return null;

  return (
    <>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <button
          type="button"
          onClick={toggle}
          className="rounded-full border border-border px-3 py-1.5 transition-colors hover:border-accent/40 hover:text-foreground"
        >
          Autoplay next:{" "}
          <span className={enabled ? "text-accent" : ""}>
            {enabled ? "On" : "Off"}
          </span>
        </button>
        <Link
          href={`/video/${next.slug}`}
          className="rounded-full border border-border px-3 py-1.5 transition-colors hover:border-accent/40 hover:text-foreground"
          title="Keyboard: N"
        >
          Next →
        </Link>
      </div>

      {left != null && enabled && (
        <div className="fixed inset-x-0 bottom-24 z-[56] flex justify-center px-4 md:bottom-8">
          <div className="glass flex w-full max-w-md items-center gap-3 rounded-2xl border border-border p-3 shadow-2xl">
            <ThumbImage
              src={next.thumbnail}
              alt=""
              className="h-14 w-24 shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-accent">
                Up next in {left}s
              </p>
              <p className="line-clamp-2 text-sm font-medium">{next.title}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-1">
              <button
                type="button"
                onClick={() => router.push(`/video/${next.slug}`)}
                className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover"
              >
                Play
              </button>
              <button
                type="button"
                onClick={() => setLeft(null)}
                className="rounded-full border border-border px-3 py-1 text-[10px] text-muted hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
