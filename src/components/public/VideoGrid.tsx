export default function VideoGrid({ children }: { children: React.ReactNode }) {
  // 1 column on small phones = bigger thumbs; denser from sm up
  return (
    <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {children}
    </div>
  );
}
