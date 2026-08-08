"use client";

import { AD_SLOT_LABELS, type AdSlotId } from "@/lib/demo-ads";

const SLOT_CLASS: Record<AdSlotId, string> = {
  header: "my-4 min-h-[90px] overflow-hidden rounded-xl",
  sidebar: "mb-4 min-h-[250px] overflow-hidden rounded-xl",
  home: "my-6 min-h-[120px] overflow-hidden rounded-xl sm:min-h-[160px]",
  footer: "my-4 min-h-[90px] overflow-hidden rounded-xl",
  grid: "my-4 min-h-[90px] overflow-hidden rounded-xl",
  native: "my-6 min-h-[100px] overflow-hidden rounded-xl",
};

export default function AdSlot({
  slot,
  html,
  demoMode = false,
}: {
  slot: Exclude<AdSlotId, "native">;
  html?: string;
  /** When true, show labeled slot + demo creative if empty. */
  demoMode?: boolean;
}) {
  const content = (html ?? "").trim();
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
        <div
          className="h-full w-full"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ) : (
        <div className="flex h-full min-h-[inherit] items-center justify-center border border-dashed border-accent/40 bg-accent/5 text-xs text-muted">
          {AD_SLOT_LABELS[slot]}
        </div>
      )}
    </div>
  );
}
