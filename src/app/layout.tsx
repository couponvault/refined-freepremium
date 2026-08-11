import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";
import { db } from "@/lib/db";
import { unstable_cache } from "next/cache";
import {
  ADULT_RATING_META,
  DEFAULT_ADULT_KEYWORDS,
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SITE_TITLE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";
import {
  customThemeStyle,
  normalizeSiteTheme,
  parseCustomTheme,
} from "@/lib/themes";
import "./globals.css";

const display = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const body = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const getGoogleSiteVerification = unstable_cache(
  async () => {
    return db.setting.findUnique({
      where: { key: "googleSiteVerification" },
    });
  },
  ["layout-google-site-verification"],
  { tags: ["settings"] }
);

const getBingVerification = unstable_cache(
  async () => {
    return db.setting.findUnique({
      where: { key: "bingVerification" },
    });
  },
  ["layout-bing-verification"],
  { tags: ["settings"] }
);

export async function generateMetadata(): Promise<Metadata> {
  let google: string | undefined;
  let bing: string | undefined;
  try {
    const [googleRow, bingRow] = await Promise.all([
      getGoogleSiteVerification(),
      getBingVerification(),
    ]);
    google = googleRow?.value?.trim();
    bing = bingRow?.value?.trim();
  } catch {
    // fall back to no verification tags if DB unavailable during build
  }
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: DEFAULT_SITE_TITLE,
      template: `%s | ${SITE_NAME}`,
    },
    description: DEFAULT_SITE_DESCRIPTION,
    keywords: DEFAULT_ADULT_KEYWORDS,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    icons: {
      icon: [{ url: "/logo.png", type: "image/png", sizes: "any" }],
      apple: [{ url: "/logo.png", type: "image/png" }],
      shortcut: "/logo.png",
    },
    openGraph: {
      siteName: SITE_NAME,
      locale: "en_US",
      type: "website",
      images: [{ url: "/logo.png", alt: `${SITE_NAME} logo` }],
    },
    twitter: {
      card: "summary",
      images: ["/logo.png"],
    },
    other: {
      ...ADULT_RATING_META,
      ...(bing ? { "msvalidate.01": bing } : {}),
    },
    ...(google || bing
      ? {
          verification: {
            ...(google ? { google } : {}),
            ...(bing ? { other: { "msvalidate.01": bing } } : {}),
          },
        }
      : {}),
  };
}

const getSiteThemeSettings = unstable_cache(
  async () => {
    return db.setting.findMany({
      where: { key: { in: ["siteTheme", "siteThemeCustom"] } },
    });
  },
  ["layout-site-theme-settings"],
  { tags: ["settings"] }
);

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // try/catch: prevents build crash if Neon connection pool is exhausted
  // during concurrent static page generation. Falls back to default theme.
  let themeRows: { key: string; value: string }[] = [];
  try {
    themeRows = await getSiteThemeSettings();
  } catch {
    // use default theme during build if DB is temporarily unavailable
  }
  const map = Object.fromEntries(themeRows.map((r) => [r.key, r.value]));
  const skin = normalizeSiteTheme(map.siteTheme);
  const custom =
    skin === "custom" ? parseCustomTheme(map.siteThemeCustom) : null;

  return (
    <html
      lang="en"
      data-skin={skin}
      className={`${display.variable} ${body.variable} h-full antialiased`}
      style={
        custom ? (customThemeStyle(custom) as CSSProperties) : undefined
      }
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("theme");if(t==="light")document.documentElement.setAttribute("data-theme","light")}catch(e){}`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
