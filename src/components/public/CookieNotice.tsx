"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const KEY = "fp_cookie_ok";

/** Lightweight consent bar for cookies / local storage / adult ads & embeds. */
export default function CookieNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) !== "1") setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] border-t border-border bg-surface/95 p-4 shadow-2xl backdrop-blur-md md:bottom-4 md:left-4 md:right-auto md:max-w-md md:rounded-2xl md:border">
      <p className="text-sm leading-relaxed text-muted">
        We use cookies and local storage for age verification, preferences, and
        site features. Third-party embeds and ads may set their own cookies. See
        our{" "}
        <Link href="/privacy" className="font-medium text-accent hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-hover"
          onClick={() => {
            try {
              localStorage.setItem(KEY, "1");
            } catch {}
            setShow(false);
          }}
        >
          I understand
        </button>
        <Link
          href="/parental-controls"
          className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted hover:text-foreground"
        >
          Parental controls
        </Link>
      </div>
    </div>
  );
}
