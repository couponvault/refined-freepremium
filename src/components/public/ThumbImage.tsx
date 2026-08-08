"use client";

import { useState } from "react";

const FALLBACK =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#1a1a22"/><stop offset="1" stop-color="#2a2438"/>
      </linearGradient></defs>
      <rect width="640" height="360" fill="url(#g)"/>
      <text x="320" y="185" text-anchor="middle" fill="#8b8499" font-family="system-ui,sans-serif" font-size="18">Preview unavailable</text>
    </svg>`
  );

export default function ThumbImage({
  src,
  alt,
  className = "",
  loading = "lazy",
}: {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}) {
  const [failed, setFailed] = useState(false);
  return (
    <img
      src={failed || !src ? FALLBACK : src}
      alt={alt}
      loading={loading}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
