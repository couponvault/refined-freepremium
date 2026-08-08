import { timingSafeEqual } from "crypto";

/** True when running a production Node build/start. */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Fail loud if critical env is missing/weak.
 * Called from instrumentation on server start.
 */
export function assertProductionEnv(): void {
  if (!isProduction()) return;

  const secret = process.env.SESSION_SECRET?.trim() ?? "";
  if (!secret || secret.length < 32 || secret === "dev-secret") {
    throw new Error(
      "[FreePremium] SESSION_SECRET must be a random string of at least 32 characters in production."
    );
  }

  const username = process.env.ADMIN_USERNAME?.trim() ?? "";
  if (!username) {
    throw new Error(
      "[FreePremium] ADMIN_USERNAME must be set in production."
    );
  }

  const password = process.env.ADMIN_PASSWORD?.trim() ?? "";
  if (!password || password.length < 10) {
    throw new Error(
      "[FreePremium] ADMIN_PASSWORD must be set (min 10 characters) in production."
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "";
  if (!siteUrl) {
    throw new Error(
      "[FreePremium] NEXT_PUBLIC_SITE_URL must be set (e.g. https://yourdomain.com)."
    );
  }
  const isLocal =
    /localhost|127\.0\.0\.1/i.test(siteUrl);
  try {
    const u = new URL(siteUrl);
    if (!isLocal && u.protocol !== "https:") {
      throw new Error(
        "[FreePremium] NEXT_PUBLIC_SITE_URL must use https:// in production (localhost http is OK for local testing)."
      );
    }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("[FreePremium]")) throw e;
    throw new Error("[FreePremium] NEXT_PUBLIC_SITE_URL is not a valid URL.");
  }
}

export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim();
  if (isProduction()) {
    if (!secret || secret.length < 32 || secret === "dev-secret") {
      throw new Error("SESSION_SECRET is not configured for production");
    }
    return secret;
  }
  return secret && secret.length > 0 ? secret : "dev-secret-local-only";
}

/** Constant-time string compare (length-mismatched → false). */
export function safeEqualString(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) {
    const dummy = Buffer.alloc(ba.length);
    timingSafeEqual(ba, dummy);
    return false;
  }
  return timingSafeEqual(ba, bb);
}

/** Client IP from common proxy headers. */
export function clientIp(req: {
  headers: { get(name: string): string | null };
}): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

type Bucket = { count: number; reset: number };
const buckets = new Map<string, Bucket>();

/**
 * Sliding fixed-window rate limit.
 * @returns true if the request is allowed
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now > entry.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}

/** Default + env-extended embed host allowlist. */
const DEFAULT_EMBED_HOSTS = [
  "youtube.com",
  "m.youtube.com",
  "youtube-nocookie.com",
  "youtu.be",
  "player.vimeo.com",
  "vimeo.com",
  "dailymotion.com",
  "www.dailymotion.com",
  "geo.dailymotion.com",
  "streamable.com",
  "www.streamable.com",
  "player.twitch.tv",
  "clips.twitch.tv",
  "rumble.com",
  "www.rumble.com",
  "bitchute.com",
  "www.bitchute.com",
  "odysee.com",
  "pornhub.com",
  "www.pornhub.com",
  "pornhub.org",
  "www.pornhub.org",
  "e.pornhub.com",
  "e.pornhub.org",
  "xvideos.com",
  "www.xvideos.com",
  "embed.xvideos.com",
  "xhamster.com",
  "www.xhamster.com",
  "xh.video",
  "redtube.com",
  "www.redtube.com",
  "youporn.com",
  "www.youporn.com",
  "spankbang.com",
  "www.spankbang.com",
  "eporner.com",
  "www.eporner.com",
  "tube8.com",
  "www.tube8.com",
  "xtube.com",
  "www.xtube.com",
  "tnaflix.com",
  "www.tnaflix.com",
  "beeg.com",
  "www.beeg.com",
  "sxyprn.com",
  "www.sxyprn.com",
  "thisvid.com",
  "www.thisvid.com",
  "godtube.com",
];

function hostAllowed(host: string, allowed: Set<string>): boolean {
  const h = host.replace(/^www\./, "").toLowerCase();
  if (allowed.has(h) || allowed.has(`www.${h}`)) return true;
  for (const a of allowed) {
    const base = a.replace(/^www\./, "");
    if (h === base || h.endsWith(`.${base}`)) return true;
  }
  return false;
}

export function getEmbedAllowedHosts(): Set<string> | null {
  if (process.env.EMBED_ALLOW_ANY === "1") return null; // allow any https
  const extra = (process.env.EMBED_ALLOWED_HOSTS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...DEFAULT_EMBED_HOSTS, ...extra]);
}

/** Embed URLs: https (prod), allowlisted host unless EMBED_ALLOW_ANY=1. */
export function isAllowedEmbedUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (isProduction()) {
      if (u.protocol !== "https:") return false;
    } else if (u.protocol !== "https:" && u.protocol !== "http:") {
      return false;
    }
    const allowed = getEmbedAllowedHosts();
    if (allowed === null) return true;
    return hostAllowed(u.hostname, allowed);
  } catch {
    return false;
  }
}

/** Thumbnails / cover images: http(s) only; https required in production. */
export function isAllowedMediaUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (isProduction()) return u.protocol === "https:";
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}
