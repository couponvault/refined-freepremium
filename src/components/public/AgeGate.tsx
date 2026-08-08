"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BrandLogo from "@/components/BrandLogo";

type State = "unknown" | "blocked" | "verified";

/** Known crawlers should see page HTML without the age overlay. */
function isSearchBot(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Googlebot|Google-InspectionTool|bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|facebookexternalhit|Twitterbot|LinkedInBot|Applebot|SemrushBot|AhrefsBot/i.test(
    navigator.userAgent
  );
}

export default function AgeGate() {
  const [state, setState] = useState<State>("unknown");

  useEffect(() => {
    if (isSearchBot()) {
      setState("verified");
      return;
    }
    try {
      setState(
        localStorage.getItem("age_verified") === "1" ? "verified" : "blocked"
      );
    } catch {
      setState("blocked");
    }
  }, []);

  useEffect(() => {
    if (state === "verified" || state === "unknown") return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [state]);

  if (state === "verified" || state === "unknown") return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Age verification"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-xl px-4"
    >
      <div className="w-full max-w-md rounded-2xl border border-accent/25 bg-surface/95 p-8 text-center shadow-2xl shadow-accent/10 backdrop-blur-xl">
        <div className="flex justify-center">
          <BrandLogo size="xl" href={null} priority />
        </div>
        <h2 className="font-display mt-5 text-2xl font-extrabold tracking-tight">
          Adults Only
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          This website contains age-restricted content intended for adults
          only. By entering you confirm that you are at least 18 years old
          (or the age of majority where you live), that adult content is legal
          for you to view, and that you agree to our{" "}
          <Link href="/terms" className="text-accent hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-accent hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="mt-7 flex flex-col gap-3">
          <button
            onClick={() => {
              try {
                localStorage.setItem("age_verified", "1");
              } catch {}
              setState("verified");
            }}
            className="glow rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            I am 18 or older — Enter
          </button>
          <button
            onClick={() => window.location.replace("https://www.google.com")}
            className="rounded-xl border border-border px-5 py-3 text-sm font-medium text-muted transition-colors hover:border-accent/30 hover:text-foreground"
          >
            I am under 18 — Exit
          </button>
        </div>
        <p className="mt-5 text-[11px] leading-relaxed text-muted">
          Parents:{" "}
          <Link
            href="/parental-controls"
            className="text-accent hover:underline"
          >
            block adult sites
          </Link>
          . Need help with compulsive use?{" "}
          <Link href="/addiction-help" className="text-accent hover:underline">
            Addiction help
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
