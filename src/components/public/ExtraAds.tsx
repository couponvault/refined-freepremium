"use client";

import { useEffect, useRef } from "react";
import { AD_SLOT_LABELS } from "@/lib/demo-ads";

/**
 * Loads social bar script sitewide and injects native ad HTML into reserved slot.
 */
export default function ExtraAds({
  popunderHtml,
  nativeHtml,
  demoMode = false,
  popunderPreview = false,
}: {
  popunderHtml?: string;
  nativeHtml?: string;
  demoMode?: boolean;
  popunderPreview?: boolean;
}) {
  const nativeRef = useRef<HTMLDivElement>(null);

  // Load Social Bar Script lazily during idle frames to prevent blocking main thread
  useEffect(() => {
    const SOCIAL_BAR_SRC =
      "https://pl30448437.effectivecpmnetwork.com/f9/6b/46/f96b46e79f041ce3076b315113015169.js";
    if (document.querySelector(`script[src="${SOCIAL_BAR_SRC}"]`)) return;

    const loadScript = () => {
      const s = document.createElement("script");
      s.src = SOCIAL_BAR_SRC;
      s.async = true;
      document.body.appendChild(s);
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).requestIdleCallback(loadScript, { timeout: 1500 });
    } else {
      setTimeout(loadScript, 800);
    }
  }, []);

  // Execute Native Ad scripts dynamically
  const native = (nativeHtml ?? "").trim();
  useEffect(() => {
    if (!nativeRef.current || !native) return;

    const container = nativeRef.current;
    container.innerHTML = native;

    const scripts = Array.from(container.querySelectorAll("script"));
    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
  }, [native]);

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
        <div data-ad="native" className="relative my-6 overflow-hidden rounded-xl flex justify-center items-center">
          {demoMode && (
            <div className="pointer-events-none absolute left-2 top-2 z-10 rounded-md bg-accent px-2 py-0.5 text-[10px] font-bold tracking-wide text-white shadow-lg">
              AD SLOT · {AD_SLOT_LABELS.native}
              {native.includes("DEMO AD") ? " · demo" : " · live HTML"}
            </div>
          )}
          <div ref={nativeRef} className="w-full flex justify-center items-center overflow-x-auto min-h-[100px]" />
        </div>
      ) : null}
    </>
  );
}
