
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

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const [categories, adSettings] = await Promise.all([
    db.category.findMany({
      where: { enabled: true },
      orderBy: { name: "asc" },
      select: { name: true, slug: true, icon: true },
    }),
    db.setting.findMany({
      where: {
        key: {
          in: [
            "adsFooterHtml",
            "adsPopunderHtml",
            "adsNativeHtml",
            "adsDemoMode",
          ],
        },
      },
    }),
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
