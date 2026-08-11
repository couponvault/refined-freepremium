/**
 * Adult / Tier-1 keyword SEO helpers.
 * Titles & descriptions stay natural — no stuffing — while targeting
 * high-intent US/UK/CA/AU/EU search phrasing.
 */

export const DEFAULT_SITE_TITLE =
  "FreePremium – Free HD Porn Videos & XXX Sex Videos Online | No Signup";

export const DEFAULT_SITE_DESCRIPTION =
  "Watch free HD porn videos and XXX sex videos online. Stream premium MILF, amateur, teen (18+), lesbian, and anal adult videos with top pornstars — fast, free, no sign-up required. Updated daily.";

/**
 * Tier 1 + Tier 2 sitewide keywords — mega-volume global terms.
 * mergeKeywords() slices to 40 per page, so priority order matters.
 */
export const DEFAULT_ADULT_KEYWORDS: string[] = [
  // Tier 1 — mega volume
  "free porn",
  "porn videos",
  "free sex videos",
  "HD porn",
  "xxx videos",
  "adult videos",
  "free HD porn",
  "watch porn online free",
  "free adult videos",
  "sex videos online",
  "free porn videos no signup",
  "porn tube",
  "xxx tube",
  "adult tube",
  "premium porn free",
  // Tier 2 — top categories (global highest-volume)
  "MILF porn",
  "lesbian porn",
  "amateur porn",
  "teen porn",
  "anal porn",
  "step mom porn",
  "big ass porn",
  "big tits porn",
  "blowjob videos",
  "threesome videos",
  "POV porn",
  "creampie videos",
  "interracial porn",
  "ebony porn",
  "latina porn",
  "asian porn",
  "japanese porn",
  "hentai porn",
  "mature porn",
  "squirting porn",
  "gangbang porn",
  "massage porn",
  "public sex videos",
  "BBW porn",
  // Tier 4 — long-tail / high-intent
  "free porn site no signup",
  "watch free HD porn without account",
  "free premium porn leaked",
  "free xxx streaming no registration",
  "pornstars",
  "freepremium",
];

/**
 * Tier 3 — Indian / Desi keywords (high volume, very low competition globally).
 * Used on Desi-themed category, tag, and performer pages.
 */
export const DESI_KEYWORDS: string[] = [
  "desi sex videos",
  "Indian porn",
  "Indian bhabhi sex",
  "desi bhabhi porn",
  "Indian aunty sex video",
  "desi MMS videos",
  "desi homemade sex",
  "Indian teen sex",
  "desi wife sex video",
  "Indian college girl sex",
  "Tamil sex videos",
  "Telugu sex videos",
  "Malayalam sex videos",
  "Bengali sex video",
  "Pakistani sex video",
  "desi village sex",
  "chudai video",
  "Indian group sex",
  "desi couple sex",
  "Indian bhabhi devar",
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
  // Detect desi/Indian category for extra keyword targeting
  const isDesi = /\b(desi|indian|hindi|tamil|telugu|bengali|pakistan|bhabhi|aunty|chudai)\b/i.test(name);
  return {
    title: `Free ${name} Porn Videos HD | No Signup – FreePremium`,
    description:
      description?.trim() ||
      `Watch free ${lower} porn videos in HD quality. Stream the best ${lower} XXX sex videos online on FreePremium — no sign-up, no ads, updated daily.`,
    keywords: mergeKeywords(
      [
        `${lower} porn`,
        `free ${lower} porn`,
        `${lower} sex videos`,
        `${lower} xxx`,
        `free ${lower} HD`,
        `${lower} videos online`,
        `best ${lower} porn`,
        `${lower} porn tube`,
      ],
      isDesi ? DESI_KEYWORDS : [],
      DEFAULT_ADULT_KEYWORDS
    ),
  };
}

export function performerSeo(name: string, description?: string | null) {
  return {
    title: `${name} Porn Videos – Free HD XXX Scenes | FreePremium`,
    description:
      description?.trim() ||
      `Watch free ${name} porn videos and XXX scenes in HD. Stream every ${name} sex video online on FreePremium — no sign-up required. Updated daily.`,
    keywords: mergeKeywords(
      [
        `${name} porn`,
        `${name} porn videos`,
        `${name} xxx`,
        `${name} sex videos`,
        `${name} free HD`,
        `${name} scenes`,
        `free ${name}`,
        "pornstars",
        "free pornstar porn",
        "free porn",
      ],
      DEFAULT_ADULT_KEYWORDS
    ),
  };
}

export function tagSeo(label: string) {
  const lower = label.toLowerCase();
  const isDesi = /\b(desi|indian|hindi|tamil|telugu|bengali|pakistan|bhabhi|aunty|chudai)\b/i.test(label);
  return {
    title: `Free ${label} Porn Videos – HD XXX | FreePremium`,
    description: `Watch free ${lower} porn videos and XXX clips online. Stream the best HD ${lower} sex videos on FreePremium — no signup, no ads.`,
    keywords: mergeKeywords(
      [
        `${lower} porn`,
        `free ${lower}`,
        `${lower} sex videos`,
        `${lower} xxx`,
        `${lower} HD`,
        `${lower} tube`,
      ],
      isDesi ? DESI_KEYWORDS : [],
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
    return [lower, `${lower} porn`, `free ${lower} video`];
  });
  const fromCats = (opts.categoryNames ?? []).flatMap((c) => {
    const lower = c.toLowerCase();
    return [`${lower} porn`, `free ${lower}`, `${lower} sex videos`, `${lower} HD`];
  });
  const fromStars = (opts.performerNames ?? []).flatMap((n) => [
    `${n} porn`,
    `${n} videos`,
    `free ${n}`,
  ]);
  // Add Desi keywords if any tag/category hints Indian content
  const allLabels = [...(opts.tags ?? []), ...(opts.categoryNames ?? [])].join(" ");
  const isDesi = /\b(desi|indian|hindi|tamil|telugu|bengali|pakistan|bhabhi|aunty|chudai)\b/i.test(allLabels);
  return mergeKeywords(
    fromStars,
    fromCats,
    fromTags,
    isDesi ? DESI_KEYWORDS : [],
    DEFAULT_ADULT_KEYWORDS
  );
}
