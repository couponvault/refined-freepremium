"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import RandomVideoButton from "@/components/public/RandomVideoButton";
import SearchSuggest from "@/components/public/SearchSuggest";

interface Cat {
  name: string;
  slug: string;
  icon: string;
}

/** Categories that stay as top-level nav links (Sports lives under Categories). */
const PINNED_SLUGS = new Set(["movies", "anime", "music"]);

function ThemeToggle() {
  const [light, setLight] = useState(false);
  useEffect(() => {
    setLight(document.documentElement.getAttribute("data-theme") === "light");
  }, []);
  const toggle = () => {
    const next = !light;
    setLight(next);
    if (next) document.documentElement.setAttribute("data-theme", "light");
    else document.documentElement.removeAttribute("data-theme");
    try {
      localStorage.setItem("theme", next ? "light" : "dark");
    } catch {}
  };
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="rounded-full p-2 text-muted transition-colors hover:text-foreground hover:bg-surface-hover"
    >
      {light ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
        </svg>
      )}
    </button>
  );
}

export default function Navbar({ categories }: { categories: Cat[] }) {
  const [open, setOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pinned = categories.filter((c) => PINNED_SLUGS.has(c.slug));
  const extra = categories.filter((c) => !PINNED_SLUGS.has(c.slug));

  useEffect(() => {
    if (!catOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setCatOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCatOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [catOpen]);

  const linkCls =
    "rounded-lg px-3 py-1.5 text-muted transition-colors hover:text-foreground hover:bg-surface-hover";

  return (
    <header className="glass sticky top-0 z-50">
      <nav className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <BrandLogo size="md" priority />

        <div className="hidden md:flex items-center gap-0.5 text-sm">
          <Link href="/" className={linkCls}>
            Home
          </Link>
          {pinned.map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`} className={linkCls}>
              {c.icon} {c.name}
            </Link>
          ))}
          <Link href="/performers" className={linkCls}>
            Pornstars
          </Link>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setCatOpen((v) => !v)}
              className={`${linkCls} inline-flex items-center gap-1`}
              aria-expanded={catOpen}
            >
              Categories
              <span className="text-[10px] opacity-70">▾</span>
            </button>
            {catOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 max-h-[70vh] min-w-[220px] overflow-y-auto rounded-2xl border border-border bg-surface py-1 shadow-2xl">
                <Link
                  href="/categories"
                  onClick={() => setCatOpen(false)}
                  className="block px-3.5 py-2.5 text-sm font-medium text-accent hover:bg-surface-hover"
                >
                  Browse all
                </Link>
                {(extra.length > 0 ? extra : categories).map((c) => (
                  <Link
                    key={c.slug}
                    href={`/category/${c.slug}`}
                    onClick={() => setCatOpen(false)}
                    className="flex items-center gap-2 px-3.5 py-2.5 text-sm text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                  >
                    <span>{c.icon}</span>
                    <span>{c.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <SearchSuggest className="ml-auto flex-1 max-w-xs" />

        <RandomVideoButton
          label="🎲"
          className="hidden sm:inline-flex rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent/40 hover:text-accent"
        />
        <Link
          href="/watch-later"
          className="hidden sm:inline-flex rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent/40 hover:text-accent"
          title="Watch later"
        >
          Later
        </Link>

        <ThemeToggle />

        <button
          onClick={() => setOpen(!open)}
          aria-label="Menu"
          className="md:hidden rounded-full p-2 text-muted transition-colors hover:text-foreground hover:bg-surface-hover"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-border px-4 py-3 space-y-0.5">
          <div className="px-1 pb-3">
            <SearchSuggest onNavigate={() => setOpen(false)} />
          </div>
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="block rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:text-foreground hover:bg-surface-hover"
          >
            Home
          </Link>
          <Link
            href="/watch-later"
            onClick={() => setOpen(false)}
            className="block rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:text-foreground hover:bg-surface-hover"
          >
            Watch later
          </Link>
          <Link
            href="/tags"
            onClick={() => setOpen(false)}
            className="block rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:text-foreground hover:bg-surface-hover"
          >
            Tags
          </Link>
          <div className="px-3 py-2">
            <RandomVideoButton
              label="Random video"
              className="w-full rounded-xl border border-border px-3 py-2 text-sm text-muted hover:text-foreground"
            />
          </div>
          {pinned.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:text-foreground hover:bg-surface-hover"
            >
              {c.icon} {c.name}
            </Link>
          ))}
          <Link
            href="/performers"
            onClick={() => setOpen(false)}
            className="block rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:text-foreground hover:bg-surface-hover"
          >
            Pornstars
          </Link>
          <p className="px-3 pt-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted">
            Categories
          </p>
          <Link
            href="/categories"
            onClick={() => setOpen(false)}
            className="block rounded-xl px-3 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-surface-hover"
          >
            Browse all
          </Link>
          {(extra.length > 0 ? extra : categories).map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:text-foreground hover:bg-surface-hover"
            >
              {c.icon} {c.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
