export default function HorizontalRail({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {children}
    </div>
  );
}
