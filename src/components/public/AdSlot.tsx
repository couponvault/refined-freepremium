"use client";

import { useEffect, useRef } from "react";
import { AD_SLOT_LABELS, type AdSlotId } from "@/lib/demo-ads";

const SLOT_CLASS: Record<AdSlotId, string> = {
  header: "my-4 min-h-[90px] w-full overflow-x-auto rounded-xl flex justify-center items-center",
  sidebar: "mb-4 min-h-[250px] w-full overflow-x-auto rounded-xl flex justify-center items-center",
  home: "my-6 min-h-[100px] sm:min-h-[120px] w-full overflow-x-auto rounded-xl flex justify-center items-center",
  footer: "my-4 min-h-[90px] w-full overflow-x-auto rounded-xl flex justify-center items-center",
  grid: "my-4 min-h-[90px] w-full overflow-x-auto rounded-xl flex justify-center items-center",
  native: "my-6 min-h-[100px] w-full overflow-x-auto rounded-xl flex justify-center items-center",
};

export default function AdSlot({
  slot,
  html,
  demoMode = false,
}: {
  slot: Exclude<AdSlotId, "native">;
  html?: string;
  demoMode?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const content = (html ?? "").trim();

  useEffect(() => {
    if (!containerRef.current || !content) return;

    const container = containerRef.current;
    container.innerHTML = content;

    const scripts = Array.from(container.querySelectorAll("script"));
    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
  }, [content]);

  if (!content && !demoMode) {
    return <div data-ad={slot} className="hidden" aria-hidden />;
  }

  return (
    <div data-ad={slot} className={`relative ${SLOT_CLASS[slot]}`}>
      {demoMode && (
        <div className="pointer-events-none absolute left-2 top-2 z-10 rounded-md bg-accent px-2 py-0.5 text-[10px] font-bold tracking-wide text-white shadow-lg">
          AD SLOT · {AD_SLOT_LABELS[slot]}
          {content && !content.includes("DEMO AD") ? " · live HTML" : " · demo"}
        </div>
      )}
      {content ? (
        <div ref={containerRef} className="flex min-h-[inherit] w-full items-center justify-center overflow-x-auto" />
      ) : (
        <div className="flex h-full min-h-[inherit] items-center justify-center border border-dashed border-accent/40 bg-accent/5 text-xs text-muted">
          {AD_SLOT_LABELS[slot]}
        </div>
      )}
    </div>
  );
}
