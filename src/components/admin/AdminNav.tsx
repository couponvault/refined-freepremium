"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";

const links = [
  { href: "/admin", label: "Dashboard", icon: "◈" },
  { href: "/admin/videos", label: "Videos", icon: "▶" },
  { href: "/admin/videos/new", label: "Add Video", icon: "+" },
  { href: "/admin/videos/csv-maker", label: "CSV Maker", icon: "▤" },
  { href: "/admin/categories", label: "Categories", icon: "❖" },
  { href: "/admin/performers", label: "Performers", icon: "☺" },
  { href: "/admin/reports", label: "Reports", icon: "⚑" },
  { href: "/admin/dmca", label: "DMCA", icon: "⚖" },
  { href: "/admin/site-map", label: "Sitemap", icon: "☰" },
  { href: "/admin/settings", label: "Settings", icon: "✦" },
] as const;

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const nav = (
    <nav className="flex flex-col gap-1">
      {links.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setOpen(false)}
            className={`relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-accent/15 text-foreground"
                : "text-muted hover:bg-surface-hover hover:text-foreground"
            }`}
          >
            {active && (
              <span className="absolute top-2 bottom-2 left-0 w-0.5 rounded-full bg-accent" />
            )}
            <span className={`w-4 text-center text-xs ${active ? "text-accent" : ""}`}>
              {l.icon}
            </span>
            {l.label}
          </Link>
        );
      })}
      <hr className="my-3 border-border" />
      <Link
        href="/"
        className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
      >
        <span className="w-4 text-center text-xs">↗</span>
        View site
      </Link>
      <button
        onClick={logout}
        className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
      >
        <span className="w-4 text-center text-xs">⏻</span>
        Logout
      </button>
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="glass sticky top-0 z-20 flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
        <BrandLogo size="sm" href="/admin" />
        <button
          onClick={() => setOpen(!open)}
          aria-label="Menu"
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-surface-hover"
        >
          ☰
        </button>
      </header>
      {open && (
        <div className="glass border-b border-border p-3 md:hidden">{nav}</div>
      )}
      {/* Desktop sidebar */}
      <aside className="glass sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border p-5 md:flex">
        <div className="mb-8 px-2">
          <BrandLogo size="md" href="/admin" withWordmark />
        </div>
        {nav}
        <p className="mt-auto px-2 text-[11px] tracking-wide text-muted/60 uppercase">
          Admin panel
        </p>
      </aside>
    </>
  );
}
