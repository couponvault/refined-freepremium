"use client";

import { useMemo, useState } from "react";
import { isAllowedEmbedUrl, toEmbedUrl } from "@/lib/utils";
import ThumbImage from "./ThumbImage";

export default function EmbedPlayer({
  embedUrl,
  thumbnail,
  title,
  onPlay,
  fill = false,
}: {
  embedUrl: string;
  thumbnail: string;
  title: string;
  onPlay?: () => void;
  fill?: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const src = useMemo(() => {
    const base = toEmbedUrl(embedUrl);
    if (!isAllowedEmbedUrl(base)) return "";
    try {
      const u = new URL(base);
      if (!u.searchParams.has("autoplay")) u.searchParams.set("autoplay", "1");
      if (!u.searchParams.has("rel")) u.searchParams.set("rel", "0");
      return u.toString();
    } catch {
      return base;
    }
  }, [embedUrl]);

  const shell = fill
    ? "absolute inset-0 h-full w-full overflow-hidden bg-surface"
    : "relative aspect-video overflow-hidden rounded-2xl bg-surface ring-1 ring-border card-shadow";

  if (!src) {
    return (
      <div className={`${shell} flex items-center justify-center text-muted`}>
        Invalid video source
      </div>
    );
  }

  return (
    <div className={shell}>
      {playing ? (
        <iframe
          src={src}
          title={title}
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
          loading="lazy"
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <button
          onClick={() => {
            setPlaying(true);
            onPlay?.();
          }}
          aria-label={`Play ${title}`}
          className="group absolute inset-0 h-full w-full"
        >
          <ThumbImage
            src={thumbnail}
            alt={title}
            loading="eager"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/20 transition-opacity group-hover:from-black/80" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-white shadow-xl shadow-accent/40 transition-transform group-hover:scale-110">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5.5v13l11-6.5-11-6.5Z" />
              </svg>
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
