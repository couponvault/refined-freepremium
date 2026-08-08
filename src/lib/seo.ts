import type { Metadata } from "next";
import type { Category, Performer, Video } from "@prisma/client";
import {
  DEFAULT_ADULT_KEYWORDS,
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SITE_TITLE,
} from "@/lib/adult-seo";

export const SITE_NAME = "FreePremium";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Google SafeSearch / parental filters — required for explicit sites. */
export const ADULT_RATING_META = {
  rating: "adult",
  RATING: "RTA-5042-1996-1400-1577-RTA",
} as const;

interface SeoInput {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "video.other";
  keywords?: string | string[];
  /** Default: index + follow. Pass false for thin/private pages. */
  index?: boolean;
  follow?: boolean;
}

export function buildMetadata({
  title,
  description,
  path,
  image,
  type = "website",
  keywords,
  index = true,
  follow = true,
}: SeoInput): Metadata {
  const canonical = `${SITE_URL}${path}`;
  const kw = keywords ?? DEFAULT_ADULT_KEYWORDS;
  return {
    // Absolute so page titles are not double-suffixed with "| FreePremium"
    title: { absolute: title },
    description,
    keywords: kw,
    alternates: { canonical },
    robots: {
      index,
      follow,
      googleBot: {
        index,
        follow,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: "en_US",
      type,
      images: [{ url: image || `${SITE_URL}/logo.png`, alt: title }],
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: [image || `${SITE_URL}/logo.png`],
    },
    other: { ...ADULT_RATING_META },
  };
}

function isoDuration(seconds: number): string | undefined {
  if (!seconds || seconds < 1) return undefined;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  let out = "PT";
  if (h) out += `${h}H`;
  if (m) out += `${m}M`;
  if (s || (!h && !m)) out += `${s}S`;
  return out;
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: DEFAULT_SITE_DESCRIPTION,
  };
}

/** Helps Google understand sitewide search (Search Console / sitelinks). */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: ["Free Premium Porn", "FreePremium XXX"],
    url: SITE_URL,
    description: DEFAULT_SITE_DESCRIPTION,
    inLanguage: "en-US",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function videoJsonLd(
  video: Video & { category: Category | null },
  extras?: {
    performers?: Pick<Performer, "name" | "slug" | "imageUrl">[];
    categoryNames?: string[];
  }
) {
  const duration = isoDuration(video.duration);
  const pageUrl = `${SITE_URL}/video/${video.slug}`;
  const description = (
    video.seoDescription ||
    video.description ||
    video.title
  ).slice(0, 5000);
  const actors = (extras?.performers ?? []).map((p) => ({
    "@type": "Person" as const,
    name: p.name,
    url: `${SITE_URL}/performer/${p.slug}`,
    ...(p.imageUrl ? { image: p.imageUrl } : {}),
  }));
  const genres =
    extras?.categoryNames?.length
      ? extras.categoryNames
      : video.category
        ? [video.category.name]
        : [];

  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.seoTitle || video.title,
    description,
    thumbnailUrl: [video.thumbnail],
    uploadDate: video.createdAt.toISOString(),
    datePublished: video.createdAt.toISOString(),
    dateModified: video.updatedAt.toISOString(),
    embedUrl: video.embedUrl,
    contentUrl: pageUrl,
    url: pageUrl,
    mainEntityOfPage: pageUrl,
    isFamilyFriendly: false,
    ...(duration ? { duration } : {}),
    contentRating: "adult",
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: { "@type": "WatchAction" },
      userInteractionCount: video.views,
    },
    potentialAction: {
      "@type": "WatchAction",
      target: pageUrl,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    ...(genres.length ? { genre: genres } : {}),
    ...(actors.length ? { actor: actors } : {}),
    ...(video.tags
      ? {
          keywords: video.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
            .join(", "),
        }
      : {}),
  };
}

export function personJsonLd(
  performer: Pick<Performer, "name" | "slug" | "imageUrl" | "description">
) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: performer.name,
    url: `${SITE_URL}/performer/${performer.slug}`,
    jobTitle: "Adult Performer",
    ...(performer.imageUrl ? { image: performer.imageUrl } : {}),
    ...(performer.description
      ? { description: performer.description.slice(0, 5000) }
      : {
          description: `Free ${performer.name} porn videos and XXX scenes on ${SITE_NAME}.`,
        }),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

/** Collection / category / tag listing for Google item lists. */
export function itemListJsonLd(
  name: string,
  path: string,
  items: { name: string; path: string; image?: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    url: `${SITE_URL}${path}`,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}${item.path}`,
        name: item.name,
        ...(item.image ? { image: item.image } : {}),
      })),
    },
  };
}

/** Safe JSON-LD script payload (escapes </script>). */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export { DEFAULT_SITE_TITLE, DEFAULT_SITE_DESCRIPTION, DEFAULT_ADULT_KEYWORDS };
