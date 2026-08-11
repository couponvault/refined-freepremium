
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import AgeGate from "@/components/public/AgeGate";
import MobileBottomNav from "@/components/public/MobileBottomNav";
import AdSlot from "@/components/public/AdSlot";
import ExtraAds from "@/components/public/ExtraAds";
import SeoExtras from "@/components/public/SeoExtras";
import CookieNotice from "@/components/public/CookieNotice";
import { isAdsDemoMode, resolveAdHtml } from "@/lib/demo-ads";

export const revalidate = 60;

// Cache these globally during build — shared across all 44 static pages
// so Neon's 3-connection pool never gets overwhelmed.
const getNavCategories = unstable_cache(
  () =>
    db.category.findMany({
      where: { enabled: true },
      orderBy: { name: "asc" },
      select: { name: true, slug: true, icon: true },
    }),
  ["public-layout-nav-categories"],
  { revalidate: 60, tags: ["categories"] }
);

const getLayoutAdSettings = unstable_cache(
  () =>
    db.setting.findMany({
      where: {
        key: { in: ["adsFooterHtml", "adsPopunderHtml", "adsNativeHtml", "adsDemoMode"] },
      },
    }),
  ["public-layout-ad-settings"],
  { revalidate: 60, tags: ["settings"] }
);

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const [categories, adSettings] = await Promise.all([
    getNavCategories(),
    getLayoutAdSettings(),
  ]);
  const ads = Object.fromEntries(adSettings.map((s) => [s.key, s.value]));
  const demoMode = isAdsDemoMode(ads.adsDemoMode);
  const footerHtml = resolveAdHtml("footer", ads.adsFooterHtml, demoMode);
  const nativeHtml = resolveAdHtml("native", ads.adsNativeHtml, demoMode);

  return (
    <>
      <SeoExtras />
      <AgeGate />
      <ExtraAds
        popunderHtml={ads.adsPopunderHtml}
        demoMode={demoMode}
        popunderPreview
      />
      <Navbar categories={categories} />
      <main className="flex-1 pb-20 md:pb-0">
        {children}
        {nativeHtml ? (
          <div className="mx-auto max-w-7xl px-4">
            <ExtraAds nativeHtml={nativeHtml} demoMode={demoMode} />
          </div>
        ) : null}
      </main>
      <div className="mx-auto max-w-7xl px-4">
        <AdSlot slot="footer" html={footerHtml} demoMode={demoMode} />
      </div>
      <Footer />
      <MobileBottomNav />
      <CookieNotice />
    </>
  );
}
