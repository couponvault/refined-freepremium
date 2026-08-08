export default function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl bg-surface border border-border card-shadow">
      <div className="skeleton aspect-video" />
      <div className="p-3.5 space-y-2">
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-2/3 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
      </div>
    </div>
  );
}
