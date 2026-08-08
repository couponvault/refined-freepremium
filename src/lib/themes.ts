/** Public site skins controlled from Admin → Settings. */

export const CUSTOM_THEME_FIELDS = [
  { key: "background", label: "Background", hint: "Page base" },
  { key: "surface", label: "Surface", hint: "Cards / panels" },
  { key: "surfaceHover", label: "Surface hover", hint: "Hover panels" },
  { key: "border", label: "Border", hint: "Lines / outlines" },
  { key: "foreground", label: "Text", hint: "Main text" },
  { key: "muted", label: "Muted text", hint: "Secondary text" },
  { key: "accent", label: "Accent", hint: "Buttons / links" },
  { key: "accentHover", label: "Accent hover", hint: "Button hover" },
  { key: "gold", label: "Highlight", hint: "Secondary accent / badges" },
] as const;

export type CustomThemeKey = (typeof CUSTOM_THEME_FIELDS)[number]["key"];

export type CustomThemeColors = Record<CustomThemeKey, string>;

export const DEFAULT_CUSTOM_THEME: CustomThemeColors = {
  background: "#0b080a",
  surface: "#151014",
  surfaceHover: "#1f171c",
  border: "#2e242b",
  foreground: "#faf6f7",
  muted: "#9a8892",
  accent: "#ff2d6a",
  accentHover: "#ff4f84",
  gold: "#f0b89a",
};

const CSS_VAR: Record<CustomThemeKey, string> = {
  background: "--background",
  surface: "--surface",
  surfaceHover: "--surface-hover",
  border: "--border",
  foreground: "--foreground",
  muted: "--muted",
  accent: "--accent",
  accentHover: "--accent-hover",
  gold: "--gold",
};

export const SITE_THEMES = [
  {
    id: "neon-rose",
    name: "Neon Rose",
    blurb: "Hot pink nightlife — current default",
    swatches: ["#0b080a", "#ff2d6a", "#f0b89a"],
  },
  {
    id: "velvet",
    name: "Velvet Cinema",
    blurb: "Deep ink + crimson + amber lobby glow",
    swatches: ["#0a0708", "#c41e3a", "#e8a85c"],
  },
  {
    id: "chrome",
    name: "Hot Chrome",
    blurb: "Cool graphite with electric coral",
    swatches: ["#0a0b0e", "#ff4d6d", "#7dd3fc"],
  },
  {
    id: "obsidian",
    name: "Obsidian",
    blurb: "Classic purple / gold dark look",
    swatches: ["#050507", "#7c5cff", "#e6c26e"],
  },
  {
    id: "custom",
    name: "Custom",
    blurb: "Pick your own colors — full control",
    swatches: ["#111111", "#ffffff", "#888888"],
  },
] as const;

export type SiteThemeId = (typeof SITE_THEMES)[number]["id"];

export function normalizeSiteTheme(raw: string | null | undefined): SiteThemeId {
  const id = (raw ?? "").trim();
  if (SITE_THEMES.some((t) => t.id === id)) return id as SiteThemeId;
  return "neon-rose";
}

function isHexColor(v: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(v.trim());
}

export function parseCustomTheme(
  raw: string | null | undefined
): CustomThemeColors {
  const base = { ...DEFAULT_CUSTOM_THEME };
  if (!raw?.trim()) return base;
  try {
    const parsed = JSON.parse(raw) as Partial<Record<string, unknown>>;
    for (const { key } of CUSTOM_THEME_FIELDS) {
      const v = parsed[key];
      if (typeof v === "string" && isHexColor(v)) base[key] = v.trim();
    }
  } catch {
    /* keep defaults */
  }
  return base;
}

export function serializeCustomTheme(colors: CustomThemeColors): string {
  const out: CustomThemeColors = { ...DEFAULT_CUSTOM_THEME };
  for (const { key } of CUSTOM_THEME_FIELDS) {
    const v = colors[key]?.trim() || DEFAULT_CUSTOM_THEME[key];
    out[key] = isHexColor(v) ? v : DEFAULT_CUSTOM_THEME[key];
  }
  return JSON.stringify(out);
}

/** Inline style object for html element when using custom skin. */
export function customThemeStyle(
  colors: CustomThemeColors
): Record<string, string> {
  const style: Record<string, string> = {};
  for (const { key } of CUSTOM_THEME_FIELDS) {
    style[CSS_VAR[key]] = colors[key];
  }
  return style;
}

/** Apply custom CSS variables on documentElement (admin live preview). */
export function applyCustomThemeToDocument(colors: CustomThemeColors): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-skin", "custom");
  for (const { key } of CUSTOM_THEME_FIELDS) {
    root.style.setProperty(CSS_VAR[key], colors[key]);
  }
}

export function clearCustomThemeFromDocument(): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const { key } of CUSTOM_THEME_FIELDS) {
    root.style.removeProperty(CSS_VAR[key]);
  }
}
