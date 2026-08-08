import Link from "next/link";

const RELATED = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/policy", label: "Content Policy" },
  { href: "/dmca", label: "DMCA" },
  { href: "/2257", label: "18 U.S.C. 2257" },
  { href: "/parental-controls", label: "Parental Controls" },
  { href: "/addiction-help", label: "Addiction Help" },
];

export default function LegalDoc({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <article className="glass card-shadow rounded-2xl border border-border p-6 sm:p-10">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle ? (
          <p className="mt-2 text-sm text-muted">{subtitle}</p>
        ) : (
          <p className="mt-2 text-sm text-muted">Last updated: August 2026</p>
        )}
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted">
          {children}
        </div>
        <nav className="mt-10 border-t border-border pt-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
            Related pages
          </p>
          <ul className="flex flex-wrap gap-2">
            {RELATED.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted transition-colors hover:border-accent/40 hover:text-accent"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[11px] text-muted/80">
            These pages support responsible adult-site operation. They are not
            personal legal advice. Customize contact details and have counsel
            review them for your jurisdiction before relying on them in
            production.
          </p>
        </nav>
      </article>
    </div>
  );
}

export function H({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-semibold text-foreground">{children}</h2>
  );
}
