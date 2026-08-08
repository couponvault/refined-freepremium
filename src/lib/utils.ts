export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Basic http(s) check. Prefer isAllowedEmbedUrl / isAllowedMediaUrl for writes. */
export function isSafeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export {
  isAllowedEmbedUrl,
  isAllowedMediaUrl,
} from "@/lib/security";

/**
 * Pull the player URL out of a full embed snippet (iframe HTML, script tags, etc.).
 * If the value is already a bare URL, returns it trimmed.
 */
export function extractEmbedSrc(raw: string): string {
  const input = (raw ?? "").trim();
  if (!input) return "";

  // Already a plain URL
  if (/^https?:\/\//i.test(input) && !/[<>]/.test(input)) {
    return input;
  }

  // <iframe ... src="..."> or src='...' or src=...
  const iframeSrc =
    input.match(/<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i) ||
    input.match(/<iframe\b[^>]*\bsrc\s*=\s*([^\s>]+)/i);
  if (iframeSrc?.[1]) return iframeSrc[1].trim();

  // data-src / data-url fallbacks used by some players
  const dataSrc =
    input.match(/\bdata-src\s*=\s*["']([^"']+)["']/i) ||
    input.match(/\bdata-url\s*=\s*["']([^"']+)["']/i);
  if (dataSrc?.[1]) return dataSrc[1].trim();

  // Any https URL inside the blob (last resort)
  const anyUrl = input.match(/https?:\/\/[^\s"'<>]+/i);
  if (anyUrl?.[0]) {
    return anyUrl[0].replace(/[.,;)]+$/, "");
  }

  return input;
}

/**
 * Normalize common watch/share URLs into iframe-safe embed URLs.
 * Also accepts full iframe embed HTML and extracts the src first.
 * Fixes YouTube Error 153 when a /watch?v= link was pasted instead of /embed/.
 */
export function toEmbedUrl(url: string): string {
  const extracted = extractEmbedSrc(url);
  try {
    const u = new URL(extracted.trim());
    const host = u.hostname.replace(/^www\./, "");
    let id = "";
    if (host === "youtu.be") {
      id = u.pathname.split("/").filter(Boolean)[0] || "";
    } else if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      if (u.pathname.startsWith("/embed/"))
        id = u.pathname.split("/")[2] || "";
      else if (u.pathname.startsWith("/shorts/"))
        id = u.pathname.split("/")[2] || "";
      else if (u.pathname.startsWith("/live/"))
        id = u.pathname.split("/")[2] || "";
      else id = u.searchParams.get("v") || "";
    }
    if (id) {
      // nocookie + referrer-friendly embed avoids Error 153 for many hosts
      return `https://www.youtube-nocookie.com/embed/${id}`;
    }
  } catch {
    /* keep extracted */
  }
  return extracted.trim();
}

export function parseTags(tags: string): string[] {
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
  return String(views);
}

/** Parse views like "12k", "1.5M", "1500" → integer. */
/** Parse "12:34" or "1:02:03" into minutes + seconds for admin forms. */
export function parseClockToParts(length: string): {
  minutes: string;
  seconds: string;
} {
  const parts = String(length || "")
    .trim()
    .split(":")
    .map((p) => Number(p));
  if (!parts.length || parts.some((n) => !Number.isFinite(n))) {
    return { minutes: "0", seconds: "0" };
  }
  let total = 0;
  if (parts.length === 3) total = parts[0] * 3600 + parts[1] * 60 + parts[2];
  else if (parts.length === 2) total = parts[0] * 60 + parts[1];
  else total = parts[0];
  const m = Math.floor(Math.max(0, total) / 60);
  const s = Math.max(0, total) % 60;
  return { minutes: String(m), seconds: String(s) };
}

export function parseViewsInput(raw: string | number | undefined | null): number {
  if (raw === undefined || raw === null || raw === "") return 0;
  if (typeof raw === "number") return Math.max(0, Math.floor(raw));
  const s = String(raw).trim().toLowerCase().replace(/,/g, "");
  const m = s.match(/^(\d+(?:\.\d+)?)\s*([km])?$/i);
  if (!m) {
    const n = Number(s);
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  }
  const n = parseFloat(m[1]);
  const suffix = (m[2] || "").toLowerCase();
  if (suffix === "k") return Math.max(0, Math.floor(n * 1_000));
  if (suffix === "m") return Math.max(0, Math.floor(n * 1_000_000));
  return Math.max(0, Math.floor(n));
}

/** Total seconds from minutes + seconds fields. */
export function durationFromParts(minutes: number, seconds: number): number {
  const m = Math.max(0, Math.floor(Number(minutes) || 0));
  const s = Math.min(59, Math.max(0, Math.floor(Number(seconds) || 0)));
  return m * 60 + s;
}

export function durationToParts(totalSeconds: number): {
  minutes: number;
  seconds: number;
} {
  const t = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  return { minutes: Math.floor(t / 60), seconds: t % 60 };
}

/** Accept seconds number, "mm:ss", or "Xm Ys". */
export function parseDurationInput(raw: string | number | undefined | null): number {
  if (raw === undefined || raw === null || raw === "") return 0;
  if (typeof raw === "number") return Math.max(0, Math.floor(raw));
  const s = String(raw).trim().toLowerCase();
  if (/^\d+$/.test(s)) return Math.max(0, parseInt(s, 10));
  const colon = s.match(/^(\d+)\s*:\s*(\d{1,2})$/);
  if (colon) return durationFromParts(Number(colon[1]), Number(colon[2]));
  const parts = s.match(/^(?:(\d+)\s*m(?:in(?:ute)?s?)?)?\s*(?:(\d+)\s*s(?:ec(?:ond)?s?)?)?$/);
  if (parts && (parts[1] || parts[2]))
    return durationFromParts(Number(parts[1] || 0), Number(parts[2] || 0));
  return 0;
}

/** Normalize a tag for URLs: "Short Film" → "short-film". */
export function tagSlug(tag: string): string {
  return slugify(tag);
}
