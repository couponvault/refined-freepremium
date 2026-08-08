"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RandomVideoButton({
  className = "",
  label = "Random video",
}: {
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function go() {
    setLoading(true);
    try {
      const res = await fetch("/api/videos/random", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { slug?: string };
      if (data.slug) router.push(`/video/${data.slug}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={go}
      disabled={loading}
      className={className}
    >
      {loading ? "Picking…" : label}
    </button>
  );
}
