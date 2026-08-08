import SkeletonCard from "@/components/public/SkeletonCard";
import VideoGrid from "@/components/public/VideoGrid";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 my-10">
      <div className="skeleton mb-6 h-8 w-48 rounded-lg" />
      <VideoGrid>
        {Array.from({ length: 10 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </VideoGrid>
    </div>
  );
}
