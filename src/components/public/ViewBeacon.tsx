"use client";

import { useEffect, useRef } from "react";

/** Counts a view once per browser session/day via API cookie cooldown. */
export default function ViewBeacon({ slug }: { slug: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void fetch(`/api/videos/${encodeURIComponent(slug)}/view`, {
      method: "POST",
      credentials: "same-origin",
    }).catch(() => {});
  }, [slug]);
  return null;
}
