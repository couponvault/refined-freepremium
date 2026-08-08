/**
 * Fresh port of Desktop "Link Meta Extractor" (new csv tool/server.js).
 * Uses local Chrome/Edge headless — for admin CSV Maker on this machine only.
 */
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

export type LinkMetaPornstar = {
  name: string;
  imageUrl: string;
  profileUrl: string;
};

export type LinkMetaResult = {
  title: string;
  imageUrl: string;
  embedUrl: string;
  pornstars: LinkMetaPornstar[];
  pornstarsText: string;
  categories: string[];
  categoriesText: string;
  tags: string[];
  tagsText: string;
  views: string;
  length: string;
  pageUrl: string;
};

const JUNK_LABEL =
  /^(suggest|add|more|\+|show all|see all|show more|less|edit)$/i;

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractMeta(html: string, property: string): string {
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`,
      "i"
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtml(match[1].trim());
  }
  return "";
}

function cleanLabels(labels: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of labels) {
    const label = raw.trim();
    if (!label || label.length < 2 || JUNK_LABEL.test(label)) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(label);
  }
  return out;
}

function extractPornstars(
  html: string,
  origin: string
): LinkMetaPornstar[] {
  const sectionMatch = html.match(
    /<div class="pornstarsWrapper[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<script/i
  );
  const section = sectionMatch?.[1] || "";
  if (!section) {
    const namesMatch = html.match(
      /['"]pornstars_in_video['"]\s*:\s*['"]([^'"]+)['"]/i
    );
    if (!namesMatch?.[1]) return [];
    return namesMatch[1]
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => ({ name, imageUrl: "", profileUrl: "" }));
  }

  const pornstars: LinkMetaPornstar[] = [];
  const linkRe =
    /<a[^>]*class="[^"]*pstar-list-btn[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = linkRe.exec(section)) !== null) {
    const href = match[1];
    const inner = match[2];
    const imageUrl =
      (inner.match(/<img[^>]+src=["']([^"']+)["']/i) || [])[1] || "";
    const name = decodeHtml(
      inner
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    );
    if (!name) continue;
    let profileUrl = href;
    try {
      profileUrl = new URL(href, origin).toString();
    } catch {
      /* keep raw */
    }
    pornstars.push({ name, imageUrl, profileUrl });
  }
  return pornstars;
}

function extractLabelList(
  html: string,
  wrapperClass: string,
  fallbackKey: string
): string[] {
  const sectionMatch = html.match(
    new RegExp(
      `<div class="${wrapperClass}[^"]*"[^>]*>([\\s\\S]*?)<\\/div>`,
      "i"
    )
  );
  const section = sectionMatch?.[1] || "";
  const labels: string[] = [];

  if (section) {
    const linkRe = /<a\b[^>]*>([\s\S]*?)<\/a>/gi;
    let match: RegExpExecArray | null;
    while ((match = linkRe.exec(section)) !== null) {
      const label = decodeHtml(
        match[1]
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
      );
      if (label) labels.push(label);
    }
  }

  if (!labels.length && fallbackKey) {
    const fallbackMatch = html.match(
      new RegExp(`['"]${fallbackKey}['"]\\s*:\\s*['"]([^'"]+)['"]`, "i")
    );
    if (fallbackMatch?.[1]) {
      return cleanLabels(
        fallbackMatch[1]
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      );
    }
  }

  return cleanLabels(labels);
}

function joinNoSpaces(list: string[]): string {
  return (list || []).filter(Boolean).join(",");
}

function formatDuration(totalSeconds: number): string {
  const seconds = Number(totalSeconds);
  if (!Number.isFinite(seconds) || seconds < 0) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

function parseIsoDuration(value: string): string {
  const match = String(value || "").match(
    /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i
  );
  if (!match) return "";
  const h = Number(match[1] || 0);
  const m = Number(match[2] || 0);
  const s = Number(match[3] || 0);
  return formatDuration(h * 3600 + m * 60 + s);
}

function extractViews(html: string): string {
  const displayMatch = html.match(
    /<div class="ratingInfo"[\s\S]*?<div class="views">\s*<span class="count">([^<]+)<\/span>\s*Views\s*<\/div>/i
  );
  if (displayMatch?.[1]) {
    return `${displayMatch[1].trim()} Views`;
  }

  const jsonLdMatch = html.match(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i
  );
  if (jsonLdMatch?.[1]) {
    try {
      const data = JSON.parse(jsonLdMatch[1]) as {
        interactionStatistic?: {
          interactionType?: string;
          userInteractionCount?: number | string;
        }[];
      };
      const stats = Array.isArray(data.interactionStatistic)
        ? data.interactionStatistic
        : [];
      const watch = stats.find((item) =>
        String(item.interactionType || "").includes("WatchAction")
      );
      if (watch?.userInteractionCount) {
        return `${String(watch.userInteractionCount).trim()} Views`;
      }
    } catch {
      /* ignore */
    }
  }
  return "";
}

function extractLength(html: string): string {
  const secondsMeta = extractMeta(html, "video:duration");
  if (secondsMeta) {
    const formatted = formatDuration(Number(secondsMeta));
    if (formatted) return formatted;
  }
  const isoMatch = html.match(/"duration"\s*:\s*"(PT[^"]+)"/i);
  if (isoMatch?.[1]) {
    const formatted = parseIsoDuration(isoMatch[1]);
    if (formatted) return formatted;
  }
  const minutesMatch = html.match(
    /['"]video_duration['"]\s*:\s*['"](\d+)['"]/i
  );
  if (minutesMatch?.[1]) {
    return formatDuration(Number(minutesMatch[1]) * 60);
  }
  return "";
}

function findChrome(): string | null {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    path.join(
      process.env.LOCALAPPDATA || "",
      "Google\\Chrome\\Application\\chrome.exe"
    ),
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) return candidate;
    } catch {
      /* ignore */
    }
  }
  return null;
}

function parsePornhubUrl(inputUrl: string): {
  viewkey: string;
  pageUrl: string;
  embedUrl: string;
} | null {
  let url: URL;
  try {
    url = new URL(inputUrl.trim());
  } catch {
    return null;
  }

  const bareHost = url.hostname.toLowerCase().replace(/^www\./, "");
  if (!bareHost.includes("pornhub.")) return null;

  let viewkey = url.searchParams.get("viewkey");
  if (!viewkey) {
    const embedMatch = url.pathname.match(/\/embed\/([^/?#]+)/i);
    if (embedMatch) viewkey = embedMatch[1];
  }
  if (!viewkey) {
    const pathMatch = url.pathname.match(
      /\/(?:video|view_video)\/([^/?#]+)/i
    );
    if (pathMatch) viewkey = pathMatch[1];
  }
  if (!viewkey) return null;

  const origin = `${url.protocol}//${url.hostname}`;
  return {
    viewkey,
    pageUrl: `${origin}/view_video.php?viewkey=${encodeURIComponent(viewkey)}`,
    embedUrl: `${origin}/embed/${viewkey}`,
  };
}

function fetchWithChrome(pageUrl: string): Promise<string> {
  const chromePath = findChrome();
  if (!chromePath) {
    return Promise.reject(
      new Error(
        "Chrome/Edge not found. Install Chrome or set CHROME_PATH to chrome.exe"
      )
    );
  }

  return new Promise((resolve, reject) => {
    const child = spawn(
      chromePath,
      [
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-extensions",
        "--disable-background-networking",
        "--virtual-time-budget=20000",
        "--timeout=45000",
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "--dump-dom",
        pageUrl,
      ],
      { windowsHide: true }
    );

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill();
      reject(new Error("Chrome timed out while loading the page"));
    }, 60000);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (!stdout || stdout.length < 500) {
        reject(
          new Error(
            `Chrome returned little/no HTML (code ${code}). ${stderr
              .split("\n")
              .slice(-3)
              .join(" ")
              .trim()}`
          )
        );
        return;
      }
      resolve(stdout);
    });
  });
}

/** Extract one Pornhub video page via local Chrome/Edge (same as Desktop tool). */
export async function extractVideoLinkMeta(
  rawUrl: string
): Promise<LinkMetaResult> {
  const parsed = parsePornhubUrl(rawUrl);
  if (!parsed) {
    throw new Error("That does not look like a valid Pornhub video link.");
  }

  const { pageUrl, embedUrl } = parsed;
  const origin = new URL(pageUrl).origin;
  const html = await fetchWithChrome(pageUrl);

  const title =
    extractMeta(html, "og:title") ||
    extractMeta(html, "twitter:title") ||
    (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "")
      .replace(/\s*[-|].*$/, "")
      .trim();

  const imageUrl =
    extractMeta(html, "og:image") ||
    extractMeta(html, "twitter:image") ||
    extractMeta(html, "twitter:image:src");

  if (/page not found/i.test(title) && !imageUrl) {
    throw new Error("Video page not found (bad link or removed video).");
  }

  const pornstars = extractPornstars(html, origin);
  const categories = extractLabelList(
    html,
    "categoriesWrapper",
    "categories_in_video"
  );
  const tags = extractLabelList(html, "tagsWrapper", "tags_in_video");

  if (!title && !imageUrl) {
    throw new Error(
      "Loaded the page, but title/thumbnail meta tags were missing (age wall or blocked page)."
    );
  }

  return {
    title: title || "",
    imageUrl: imageUrl || "",
    embedUrl,
    pornstars,
    pornstarsText: pornstars.map((p) => p.name).join(","),
    categories,
    categoriesText: joinNoSpaces(categories),
    tags,
    tagsText: joinNoSpaces(tags),
    views: extractViews(html),
    length: extractLength(html),
    pageUrl,
  };
}
