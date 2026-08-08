import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { SITE_NAME } from "@/lib/seo";

const EXPLORE = [
  { href: "/", label: "Home" },
  { href: "/categories", label: "Browse categories" },
  { href: "/performers", label: "Pornstars" },
  { href: "/tags", label: "Browse tags" },
  { href: "/watch-later", label: "Watch later" },
  { href: "/search", label: "Search" },
];

const LEGAL = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/dmca", label: "DMCA" },
  { href: "/policy", label: "Content Policy" },
  { href: "/2257", label: "18 U.S.C. 2257" },
  { href: "/parental-controls", label: "Parental Controls" },
  { href: "/addiction-help", label: "Addiction Help" },
];

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-surface/80">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <BrandLogo size="lg" />
          <p className="mt-3 text-sm text-muted">
            Free HD porn videos &amp; XXX sex videos for adults 18+ only. Stream
            with no sign-up.
          </p>
          <span className="mt-4 inline-flex items-center rounded-md border border-accent/35 bg-accent/10 px-3 py-1 text-xs font-bold tracking-wide text-accent">
            18+
          </span>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
            Explore
          </p>
          <div className="flex flex-col gap-2 text-sm">
            {EXPLORE.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-muted transition-colors hover:text-accent"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
            Legal
          </p>
          <div className="flex flex-col gap-2 text-sm">
            {LEGAL.slice(0, 5).map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-muted transition-colors hover:text-accent"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
            Safety &amp; help
          </p>
          <div className="flex flex-col gap-2 text-sm">
            {LEGAL.slice(5).map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-muted transition-colors hover:text-accent"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/policy"
              className="text-muted transition-colors hover:text-accent"
            >
              Report illegal content
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-border px-4 py-5 text-center text-xs text-muted">
        <p>
          © {new Date().getFullYear()} {SITE_NAME}. Adults only (18+). All rights
          reserved.
        </p>
        <p className="mx-auto mt-2 max-w-3xl leading-relaxed">
          By entering you confirm you are of legal age. We prohibit underage
          content.{" "}
          <Link href="/2257" className="text-accent hover:underline">
            2257 Notice
          </Link>
          {" · "}
          <Link href="/parental-controls" className="text-accent hover:underline">
            Parental Controls
          </Link>
          {" · "}
          <Link href="/addiction-help" className="text-accent hover:underline">
            Addiction Help
          </Link>
        </p>
      </div>
    </footer>
  );
}
