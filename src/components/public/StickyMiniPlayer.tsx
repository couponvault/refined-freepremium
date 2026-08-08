"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export default function StickyMiniPlayer({
  title,
  children,
}: {
  slug: string;
  title: string;
  thumbnail: string;
  children: ReactNode;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [mini, setMini] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(false);
  }, [title]);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (dismissed) return;
        setMini(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "-48px 0px 0px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [dismissed]);

  const showMini = mini && !dismissed;

  return (
    <div ref={boxRef} className="relative aspect-video">
      <div
        className={
          showMini
            ? "fixed bottom-[4.5rem] right-3 z-[55] aspect-video w-[min(46vw,300px)] overflow-hidden rounded-xl bg-surface shadow-2xl ring-1 ring-border transition-all duration-300 md:bottom-6 md:right-6 md:w-80"
            : "absolute inset-0 overflow-hidden rounded-2xl transition-all duration-300"
        }
      >
        <div className="relative h-full w-full">{children}</div>
        {showMini && (
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 bg-gradient-to-b from-black/70 to-transparent p-1.5">
            <p className="pointer-events-none min-w-0 flex-1 truncate px-1 text-[11px] font-medium text-white">
              {title}
            </p>
            <button
              type="button"
              aria-label="Close mini player"
              onClick={() => {
                setDismissed(true);
                setMini(false);
              }}
              className="pointer-events-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/60 text-xs text-white hover:bg-black/80"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
