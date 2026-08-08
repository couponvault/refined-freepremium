"use client";

import { useEffect, useRef } from "react";
import { AD_SLOT_LABELS } from "@/lib/demo-ads";

/**
 * Loads popunder once per browser session on first click,
 * and injects native ad HTML into a reserved slot when provided.
 */
export default function ExtraAds({
  popunderHtml,
  nativeHtml,
  demoMode = false,
  /** When true (and demoMode), show the fixed popunder location marker. */
  popunderPreview = false,
}: {
  popunderHtml?: string;
  nativeHtml?: string;
  demoMode?: boolean;
  popunderPreview?: boolean;
}) {
  const armed = useRef(false);

  useEffect(() => {
    if (demoMode) return; // never fire real popunders in preview mode
    if (!popunderHtml?.trim()) return;
    if (sessionStorage.getItem("fp_popunder_done") === "1") return;

    const onClick = () => {
      if (armed.current) return;
      armed.current = true;
      try {
        sessionStorage.setItem("fp_popunder_done", "1");
        const trimmed = popunderHtml.trim();
        if (/^https?:\/\//i.test(trimmed)) {
          window.open(trimmed, "_blank", "noopener,noreferrer");
        } else {
          const w = window.open("about:blank", "_blank");
          if (w) {
            w.document.open();
            w.document.write(trimmed);
            w.document.close();
          }
        }
      } catch {
        /* blocked by popup blocker — ignore */
      }
      document.removeEventListener("click", onClick, true);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [popunderHtml, demoMode]);

  const native = (nativeHtml ?? "").trim();

  return (
    <>
      {demoMode && popunderPreview && (
        <div className="pointer-events-none fixed bottom-24 left-3 z-[60] max-w-[220px] rounded-xl border border-accent/50 bg-surface/95 px-3 py-2 text-[11px] shadow-xl backdrop-blur md:bottom-6">
          <p className="font-bold tracking-wide text-accent">
            AD SLOT · {AD_SLOT_LABELS.popunder}
          </p>
          <p className="mt-1 text-muted">
            {popunderHtml?.trim()
              ? "Configured — would open on first click (disabled in preview)."
              : "Empty — paste popunder URL/HTML in Settings."}
          </p>
        </div>
      )}
      {native ? (
        <div data-ad="native" className="relative my-6 overflow-hidden rounded-xl">
          {demoMode && (
            <div className="pointer-events-none absolute left-2 top-2 z-10 rounded-md bg-accent px-2 py-0.5 text-[10px] font-bold tracking-wide text-white shadow-lg">
              AD SLOT · {AD_SLOT_LABELS.native}
              {native.includes("DEMO AD") ? " · demo" : " · live HTML"}
            </div>
          )}
          <div dangerouslySetInnerHTML={{ __html: native }} />
        </div>
      ) : null}
    </>
  );
}
