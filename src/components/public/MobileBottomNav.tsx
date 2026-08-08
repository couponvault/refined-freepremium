"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import RandomVideoButton from "@/components/public/RandomVideoButton";

const items = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/search?sort=views", label: "Hot", icon: "▲" },
  { href: "/watch-later", label: "Later", icon: "☆" },
  { href: "/categories", label: "Browse", icon: "▤" },
] as const;

export default function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-40 border-t border-border md:hidden">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const path = item.href.split("?")[0];
          const active =
            path === "/"
              ? pathname === "/"
              : pathname === path || pathname.startsWith(path + "/");
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium ${
                  active ? "text-accent" : "text-muted"
                }`}
              >
                <span className="text-base leading-none">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          );
        })}
        <li className="flex-1">
          <RandomVideoButton
            label={"🎲\nRandom"}
            className="flex w-full flex-col items-center gap-0.5 whitespace-pre-line py-2.5 text-[10px] font-medium leading-tight text-muted"
          />
        </li>
      </ul>
    </nav>
  );
}
