"use client";

import VideoCard, { type VideoCardData } from "./VideoCard";
import VideoGrid from "./VideoGrid";

function prefetch(slug: string) {
  const href = `/video/${slug}`;
  if (document.querySelector(`link[rel="prefetch"][href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = href;
  document.head.appendChild(link);
}

export default function RelatedVideos({ videos }: { videos: VideoCardData[] }) {
  if (videos.length === 0) return null;
  return (
    <section className="mt-14">
      <h2 className="mb-5 flex items-center gap-2.5 text-xl font-bold tracking-tight">
        <span className="h-5 w-1 rounded-full bg-gradient-to-b from-accent to-gold" />
        Related videos
      </h2>
      <VideoGrid>
        {videos.map((v) => (
          <div key={v.slug} onMouseEnter={() => prefetch(v.slug)}>
            <VideoCard video={v} />
          </div>
        ))}
      </VideoGrid>
    </section>
  );
}
