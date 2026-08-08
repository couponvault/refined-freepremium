/**
 * Adult / Tier-1 keyword SEO helpers.
 * Titles & descriptions stay natural — no stuffing — while targeting
 * high-intent US/UK/CA/AU/EU search phrasing.
 */

export const DEFAULT_SITE_TITLE =
  "FreePremium – Free HD Porn Videos & XXX Sex Videos Online";

export const DEFAULT_SITE_DESCRIPTION =
  "Watch free HD porn videos and XXX sex videos online. Stream premium adult videos with top pornstars — fast, free, no sign-up required. Updated daily.";

/** Core sitewide keywords (meta + admin default). */
export const DEFAULT_ADULT_KEYWORDS: string[] = [
  "free porn",
  "porn videos",
  "xxx videos",
  "free sex videos",
  "HD porn",
  "adult videos",
  "pornstars",
  "free xxx",
  "sex videos",
  "porn tube",
  "premium porn free",
  "free HD porn",
  "xxx tube",
  "adult tube",
  "watch porn free",
  "freepremium",
];

export function parseKeywordList(raw?: string | null): string[] {
  if (!raw?.trim()) return [...DEFAULT_ADULT_KEYWORDS];
  const parts = raw
    .split(/[,;\n]+/)
    .map((k) => k.trim())
    .filter((k) => k.length > 1);
  return parts.length ? parts : [...DEFAULT_ADULT_KEYWORDS];
}

export function mergeKeywords(...lists: (string[] | undefined)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of lists) {
    if (!list) continue;
    for (const k of list) {
      const key = k.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(k.trim());
    }
  }
  return out.slice(0, 40);
}

export function categorySeo(name: string, description?: string | null) {
  const lower = name.toLowerCase();
  return {
    title: `Free ${name} Porn Videos HD`,
    description:
      description?.trim() ||
      `Watch free ${lower} porn videos in HD. Stream ${lower} XXX sex videos online on FreePremium — no sign-up, updated daily.`,
    keywords: mergeKeywords(
      [`${lower} porn`, `free ${lower} porn`, `${lower} sex videos`, `${lower} xxx`],
      DEFAULT_ADULT_KEYWORDS
    ),
  };
}

export function performerSeo(name: string, description?: string | null) {
  return {
    title: `${name} Porn Videos – Free HD`,
    description:
      description?.trim() ||
      `Watch free ${name} porn videos in HD. Stream ${name} XXX sex videos and scenes online on FreePremium — no sign-up required.`,
    keywords: mergeKeywords(
      [
        `${name} porn`,
        `${name} videos`,
        `${name} sex`,
        `${name} xxx`,
        "pornstars",
        "free porn",
      ],
      DEFAULT_ADULT_KEYWORDS
    ),
  };
}

export function tagSeo(label: string) {
  const lower = label.toLowerCase();
  return {
    title: `Free ${label} Porn Videos`,
    description: `Watch free ${lower} porn videos and XXX clips tagged ${lower}. Stream HD adult videos online on FreePremium.`,
    keywords: mergeKeywords(
      [`${lower} porn`, `free ${lower}`, `${lower} sex videos`, `${lower} xxx`],
      DEFAULT_ADULT_KEYWORDS
    ),
  };
}

export function videoSeoTitle(
  title: string,
  opts?: { seoTitle?: string | null; categoryName?: string | null }
) {
  if (opts?.seoTitle?.trim()) return opts.seoTitle.trim();
  const cat = opts?.categoryName?.trim();
  if (cat && !title.toLowerCase().includes(cat.toLowerCase())) {
    return `${title} – Free ${cat} Porn Video HD`;
  }
  if (!/\b(porn|xxx|sex|nude|nsfw)\b/i.test(title)) {
    return `${title} – Free Porn Video HD`;
  }
  return title;
}

export function videoSeoDescription(
  title: string,
  opts?: {
    seoDescription?: string | null;
    description?: string | null;
    categoryName?: string | null;
    performerNames?: string[];
  }
) {
  if (opts?.seoDescription?.trim()) {
    return opts.seoDescription.trim().slice(0, 160);
  }
  const base = (opts?.description || "").trim();
  if (base.length >= 80) return base.slice(0, 160);

  const who =
    opts?.performerNames && opts.performerNames.length
      ? ` starring ${opts.performerNames.slice(0, 3).join(", ")}`
      : "";
  const cat = opts?.categoryName ? ` ${opts.categoryName}` : "";
  const crafted = `Watch ${title}${who} — free${cat} porn video in HD on FreePremium. Stream XXX sex videos online, no sign-up.`;
  return crafted.slice(0, 160);
}

export function videoKeywords(opts: {
  tags?: string[];
  categoryNames?: string[];
  performerNames?: string[];
}) {
  const fromTags = (opts.tags ?? []).flatMap((t) => {
    const lower = t.toLowerCase();
    return [lower, `${lower} porn`];
  });
  const fromCats = (opts.categoryNames ?? []).flatMap((c) => {
    const lower = c.toLowerCase();
    return [`${lower} porn`, `free ${lower}`];
  });
  const fromStars = (opts.performerNames ?? []).flatMap((n) => [
    `${n} porn`,
    `${n} videos`,
  ]);
  return mergeKeywords(fromStars, fromCats, fromTags, DEFAULT_ADULT_KEYWORDS);
}
