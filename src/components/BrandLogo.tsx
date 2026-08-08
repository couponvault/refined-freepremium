import Image from "next/image";
import Link from "next/link";
import { SITE_NAME } from "@/lib/seo";

export const LOGO_SRC = "/logo.png";

type Size = "sm" | "md" | "lg" | "xl";

const SIZE_PX: Record<Size, number> = {
  sm: 36,
  md: 44,
  lg: 72,
  xl: 128,
};

interface BrandLogoProps {
  size?: Size;
  href?: string | null;
  /** Show wordmark next to mark (logo already includes text — off by default). */
  withWordmark?: boolean;
  className?: string;
  priority?: boolean;
}

/** Circular FreePremium brand mark for nav, footer, age gate, admin. */
export default function BrandLogo({
  size = "md",
  href = "/",
  withWordmark = false,
  className = "",
  priority = false,
}: BrandLogoProps) {
  const px = SIZE_PX[size];
  const mark = (
    <Image
      src={LOGO_SRC}
      alt={`${SITE_NAME} – Adult Streaming`}
      width={px}
      height={px}
      priority={priority}
      className="rounded-full object-cover shadow-md shadow-black/40 ring-1 ring-white/10"
      sizes={`${px}px`}
    />
  );

  const inner = (
    <span
      className={`inline-flex items-center gap-2.5 ${className}`.trim()}
    >
      {mark}
      {withWordmark ? (
        <span className="font-display text-lg font-extrabold tracking-tight sm:text-xl">
          <span className="text-gradient">{SITE_NAME}</span>
        </span>
      ) : null}
    </span>
  );

  if (!href) return inner;

  return (
    <Link
      href={href}
      className="shrink-0 transition-opacity hover:opacity-90"
      aria-label={`${SITE_NAME} home`}
    >
      {inner}
    </Link>
  );
}
