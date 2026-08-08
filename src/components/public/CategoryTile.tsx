import Link from "next/link";
import { isSafeUrl } from "@/lib/utils";
import ThumbImage from "./ThumbImage";

export default function CategoryTile({
  name,
  slug,
  icon,
  imageUrl,
}: {
  name: string;
  slug: string;
  icon: string;
  imageUrl?: string | null;
}) {
  const hasImage = !!imageUrl && isSafeUrl(imageUrl);
  return (
    <Link
      href={`/category/${slug}`}
      className="group relative flex aspect-[4/3] items-end overflow-hidden rounded-xl border border-border/80 bg-surface transition-all duration-300 hover:border-accent/45"
    >
      {hasImage ? (
        <ThumbImage
          src={imageUrl!}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <span className="absolute inset-0 bg-gradient-to-br from-accent/30 via-[#1a1016] to-surface" />
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      <span className="relative z-10 flex w-full items-center gap-2 p-3.5">
        {!hasImage && <span className="text-lg">{icon}</span>}
        <span className="font-display text-sm font-bold tracking-tight text-white drop-shadow">
          {name}
        </span>
      </span>
    </Link>
  );
}
