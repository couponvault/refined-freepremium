/** Demo creatives + labels for Admin “Ad preview mode”. */

export type AdSlotId = "home" | "header" | "sidebar" | "footer" | "grid" | "native";

export const AD_SLOT_LABELS: Record<AdSlotId | "popunder", string> = {
  home: "Home banner",
  header: "Video header",
  sidebar: "Video sidebar",
  footer: "Footer banner",
  grid: "In-grid / mid-page",
  native: "Native / in-feed",
  popunder: "Popunder (first click)",
};

function demoBox(opts: {
  title: string;
  size: string;
  h: string;
  accent?: string;
}): string {
  const accent = opts.accent ?? "#ff2d6a";
  return `<div style="display:flex;align-items:center;justify-content:center;width:100%;min-height:${opts.h};background:linear-gradient(135deg,#1a1016 0%,#2a1520 50%,#121018 100%);border:1px solid ${accent}55;border-radius:12px;padding:16px;box-sizing:border-box;font-family:system-ui,sans-serif;text-align:center">
  <div>
    <div style="display:inline-block;padding:4px 10px;border-radius:999px;background:${accent}22;color:${accent};font-size:11px;font-weight:700;letter-spacing:.06em;margin-bottom:8px">DEMO AD</div>
    <div style="color:#faf6f7;font-size:18px;font-weight:800;letter-spacing:-.02em">${opts.title}</div>
    <div style="color:#9a8892;font-size:12px;margin-top:6px">${opts.size} · placeholder creative</div>
  </div>
</div>`;
}

export const DEMO_AD_HTML: Record<AdSlotId, string> = {
  home: demoBox({
    title: "Home page banner",
    size: "~728×180",
    h: "160px",
  }),
  header: demoBox({
    title: "Video page header",
    size: "~728×90",
    h: "90px",
    accent: "#e8a85c",
  }),
  sidebar: demoBox({
    title: "Video sidebar",
    size: "~300×250",
    h: "250px",
    accent: "#7dd3fc",
  }),
  footer: demoBox({
    title: "Footer banner",
    size: "~728×90",
    h: "90px",
    accent: "#c41e3a",
  }),
  grid: demoBox({
    title: "In-grid mid-page",
    size: "~728×90",
    h: "100px",
    accent: "#977eff",
  }),
  native: demoBox({
    title: "Native / in-feed unit",
    size: "Fluid width",
    h: "120px",
    accent: "#f0b89a",
  }),
};

export const DEFAULT_LIVE_ADS: Record<AdSlotId, string> = {
  home: `<script>atOptions={'key':'ea7fc7a87012695922a4920ca9353921','format':'iframe','height':90,'width':728,'params':{}};</script><script src="https://www.highperformanceformat.com/ea7fc7a87012695922a4920ca9353921/invoke.js"></script>`,
  header: `<script>atOptions={'key':'ea7fc7a87012695922a4920ca9353921','format':'iframe','height':90,'width':728,'params':{}};</script><script src="https://www.highperformanceformat.com/ea7fc7a87012695922a4920ca9353921/invoke.js"></script>`,
  sidebar: `<script>atOptions={'key':'062a769776dccb3dfc5fc023c80325f9','format':'iframe','height':250,'width':300,'params':{}};</script><script src="https://www.highperformanceformat.com/062a769776dccb3dfc5fc023c80325f9/invoke.js"></script>`,
  footer: `<script>atOptions={'key':'ea7fc7a87012695922a4920ca9353921','format':'iframe','height':90,'width':728,'params':{}};</script><script src="https://www.highperformanceformat.com/ea7fc7a87012695922a4920ca9353921/invoke.js"></script>`,
  grid: `<script>atOptions={'key':'ea7fc7a87012695922a4920ca9353921','format':'iframe','height':90,'width':728,'params':{}};</script><script src="https://www.highperformanceformat.com/ea7fc7a87012695922a4920ca9353921/invoke.js"></script>`,
  native: `<script async="async" data-cfasync="false" src="https://pl30448436.effectivecpmnetwork.com/856af2dadd676850d875e9bf3398a62f/invoke.js"></script><div id="container-856af2dadd676850d875e9bf3398a62f"></div>`,
};

/** Prefer real admin HTML; fall back to demo creative when preview mode is on, or live defaults. */
export function resolveAdHtml(
  slot: AdSlotId,
  stored: string | undefined,
  demoMode: boolean
): string {
  const real = (stored ?? "").trim();
  if (real) return real;
  if (demoMode) return DEMO_AD_HTML[slot];
  return DEFAULT_LIVE_ADS[slot] ?? "";
}

export function isAdsDemoMode(value: string | undefined): boolean {
  return value === "1" || value === "true" || value === "on";
}
