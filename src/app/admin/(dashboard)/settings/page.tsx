"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Toggle from "@/components/admin/Toggle";
import {
  SITE_THEMES,
  CUSTOM_THEME_FIELDS,
  DEFAULT_CUSTOM_THEME,
  type SiteThemeId,
  type CustomThemeColors,
  type CustomThemeKey,
  normalizeSiteTheme,
  parseCustomTheme,
  serializeCustomTheme,
  applyCustomThemeToDocument,
  clearCustomThemeFromDocument,
} from "@/lib/themes";
import { isAdsDemoMode } from "@/lib/demo-ads";

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/50";

export default function SettingsPage() {
  const router = useRouter();
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [googleSiteVerification, setGoogleSiteVerification] = useState("");
  const [bingVerification, setBingVerification] = useState("");
  const [siteTheme, setSiteTheme] = useState<SiteThemeId>("neon-rose");
  const [customColors, setCustomColors] =
    useState<CustomThemeColors>(DEFAULT_CUSTOM_THEME);
  const [unlockCode, setUnlockCode] = useState("");
  const [adsDemoMode, setAdsDemoMode] = useState(false);
  const [adsHeaderHtml, setAdsHeaderHtml] = useState("");
  const [adsSidebarHtml, setAdsSidebarHtml] = useState("");
  const [adsHomeHtml, setAdsHomeHtml] = useState("");
  const [adsFooterHtml, setAdsFooterHtml] = useState("");
  const [adsGridHtml, setAdsGridHtml] = useState("");
  const [adsPopunderHtml, setAdsPopunderHtml] = useState("");
  const [adsNativeHtml, setAdsNativeHtml] = useState("");
  const [adsInterstitialEnabled, setAdsInterstitialEnabled] = useState(true);
  const [adsInterstitialSeconds, setAdsInterstitialSeconds] = useState("5");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        setSeoTitle(d.seoTitle ?? "");
        setSeoDescription(d.seoDescription ?? "");
        setSeoKeywords(d.seoKeywords ?? "");
        setGoogleSiteVerification(d.googleSiteVerification ?? "");
        setBingVerification(d.bingVerification ?? "");
        setSiteTheme(normalizeSiteTheme(d.siteTheme));
        setCustomColors(parseCustomTheme(d.siteThemeCustom));
        setUnlockCode(d.unlockCode ?? "");
        setAdsDemoMode(isAdsDemoMode(d.adsDemoMode));
        setAdsHeaderHtml(d.adsHeaderHtml ?? "");
        setAdsSidebarHtml(d.adsSidebarHtml ?? "");
        setAdsHomeHtml(d.adsHomeHtml ?? "");
        setAdsFooterHtml(d.adsFooterHtml ?? "");
        setAdsGridHtml(d.adsGridHtml ?? "");
        setAdsPopunderHtml(d.adsPopunderHtml ?? "");
        setAdsNativeHtml(d.adsNativeHtml ?? "");
        setAdsInterstitialEnabled(d.adsInterstitialEnabled !== "0");
        setAdsInterstitialSeconds(d.adsInterstitialSeconds ?? "5");
        setLoading(false);
      });
  }, []);

  function previewTheme(id: SiteThemeId) {
    setSiteTheme(id);
    if (id === "custom") {
      applyCustomThemeToDocument(customColors);
    } else {
      clearCustomThemeFromDocument();
      document.documentElement.setAttribute("data-skin", id);
    }
  }

  function updateCustom(key: CustomThemeKey, value: string) {
    setCustomColors((prev) => {
      const next = { ...prev, [key]: value };
      if (siteTheme === "custom") applyCustomThemeToDocument(next);
      return next;
    });
  }

  async function persistSettings(overrides: Record<string, string> = {}) {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seoTitle,
        seoDescription,
        seoKeywords,
        googleSiteVerification,
        bingVerification,
        siteTheme,
        siteThemeCustom: serializeCustomTheme(customColors),
        unlockCode,
        adsDemoMode: adsDemoMode ? "1" : "0",
        adsHeaderHtml,
        adsSidebarHtml,
        adsHomeHtml,
        adsFooterHtml,
        adsGridHtml,
        adsPopunderHtml,
        adsNativeHtml,
        adsInterstitialEnabled: adsInterstitialEnabled ? "1" : "0",
        adsInterstitialSeconds,
        ...overrides,
      }),
    });
    setSaving(false);
    if (res.ok) {
      if (siteTheme === "custom") applyCustomThemeToDocument(customColors);
      else {
        clearCustomThemeFromDocument();
        document.documentElement.setAttribute("data-skin", siteTheme);
      }
      router.refresh();
      setMessage("Settings saved.");
      setTimeout(() => setMessage(""), 3000);
      return true;
    }
    setMessage("Save failed.");
    return false;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await persistSettings();
  }

  async function setAdsDemoModeAndSave(next: boolean) {
    setAdsDemoMode(next);
    await persistSettings({ adsDemoMode: next ? "1" : "0" });
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-8 font-display text-2xl font-extrabold tracking-tight text-foreground">
        Settings
      </h1>
      {loading ? (
        <div className="space-y-3">
          <div className="skeleton h-10 rounded-lg" />
          <div className="skeleton h-24 rounded-lg" />
        </div>
      ) : (
        <form
          onSubmit={save}
          className="glass card-shadow space-y-6 rounded-2xl border border-border p-6"
        >
          <div className="rounded-xl border-2 border-accent/40 bg-accent/10 p-4">
            <p className="mb-1 text-sm font-bold text-foreground">
              Ad preview mode
            </p>
            <p className="mb-3 text-xs text-muted">
              Saves instantly when you flip the switch. Then open/refresh the
              public site — labeled demo ads mark every slot.
            </p>
            <Toggle
              checked={adsDemoMode}
              onChange={setAdsDemoModeAndSave}
              label={adsDemoMode ? "ON — demo ads visible on site" : "OFF — normal (ads hidden if empty)"}
            />
            {adsDemoMode && (
              <Link
                href="/"
                target="_blank"
                className="mt-3 inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-2 text-xs font-bold text-white hover:opacity-90"
              >
                Open site to see ad slots ↗
              </Link>
            )}
          </div>

          <div className="border-b border-border pb-6">
            <p className="mb-1 text-sm font-semibold text-foreground">
              Site theme
            </p>
            <p className="mb-4 text-xs text-muted">
              Switch the public look anytime — click a mood, then Save. Preview
              applies instantly in this panel.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {SITE_THEMES.map((t) => {
                const on = siteTheme === t.id;
                const swatches =
                  t.id === "custom"
                    ? [
                        customColors.background,
                        customColors.accent,
                        customColors.gold,
                      ]
                    : t.swatches;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => previewTheme(t.id)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      on
                        ? "border-accent bg-accent/10"
                        : "border-border bg-background hover:border-accent/40"
                    }`}
                  >
                    <span className="mb-2 flex gap-1.5">
                      {swatches.map((c) => (
                        <span
                          key={`${t.id}-${c}`}
                          className="h-5 w-5 rounded-md border border-white/10"
                          style={{ background: c }}
                        />
                      ))}
                    </span>
                    <span className="block text-sm font-semibold text-foreground">
                      {t.name}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted">
                      {t.blurb}
                    </span>
                  </button>
                );
              })}
            </div>

            {siteTheme === "custom" && (
              <div className="mt-5 rounded-xl border border-border bg-background/60 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                  Custom colors
                </p>
                <p className="mb-4 text-[11px] text-muted">
                  Adjust any color — preview updates live. Click Save to apply
                  site-wide.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {CUSTOM_THEME_FIELDS.map((f) => (
                    <label
                      key={f.key}
                      className="flex items-center gap-3 rounded-lg border border-border/80 px-3 py-2"
                    >
                      <input
                        type="color"
                        value={
                          /^#[0-9a-fA-F]{6}$/.test(customColors[f.key])
                            ? customColors[f.key]
                            : "#000000"
                        }
                        onChange={(e) => updateCustom(f.key, e.target.value)}
                        className="h-9 w-10 cursor-pointer rounded border-0 bg-transparent"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-medium text-foreground">
                          {f.label}
                        </span>
                        <span className="block text-[10px] text-muted">
                          {f.hint}
                        </span>
                      </span>
                      <input
                        type="text"
                        value={customColors[f.key]}
                        onChange={(e) => updateCustom(f.key, e.target.value)}
                        className="w-[5.5rem] rounded-md border border-border bg-surface px-2 py-1 font-mono text-[11px] text-foreground"
                        spellCheck={false}
                      />
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCustomColors(DEFAULT_CUSTOM_THEME);
                    applyCustomThemeToDocument(DEFAULT_CUSTOM_THEME);
                  }}
                  className="mt-4 text-xs text-muted underline-offset-2 hover:text-accent hover:underline"
                >
                  Reset custom colors to Neon Rose defaults
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">
              Site SEO Title
            </label>
            <input
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              className={inputCls}
              placeholder="FreePremium – Free HD Porn Videos & XXX Sex Videos Online"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">
              Site SEO Description
            </label>
            <textarea
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              rows={3}
              className={inputCls}
              placeholder="Watch free HD porn videos and XXX sex videos online…"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">
              Site SEO Keywords
            </label>
            <textarea
              value={seoKeywords}
              onChange={(e) => setSeoKeywords(e.target.value)}
              rows={3}
              className={inputCls}
              placeholder="free porn, porn videos, xxx videos, HD porn, pornstars…"
            />
            <p className="mt-1 text-[11px] text-muted">
              Comma-separated adult keywords for the homepage. Leave blank to
              use built-in Tier‑1 defaults (free porn, xxx, HD porn, etc.).
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">
              Google Search Console verification
            </label>
            <input
              value={googleSiteVerification}
              onChange={(e) => setGoogleSiteVerification(e.target.value)}
              className={inputCls}
              placeholder="Content value from google-site-verification meta tag"
            />
            <p className="mt-1 text-[11px] text-muted">
              Paste only the verification code. XML sitemaps for Google:{" "}
              <code className="text-foreground">/sitemap.xml</code> and{" "}
              <code className="text-foreground">/sitemap-videos.xml</code>. Full
              page index:{" "}
              <Link href="/admin/site-map" className="text-accent hover:underline">
                Admin → Sitemap
              </Link>
              .
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">
              Bing / Microsoft Webmaster Tools verification
            </label>
            <input
              value={bingVerification}
              onChange={(e) => setBingVerification(e.target.value)}
              className={inputCls}
              placeholder="Content value from msvalidate.01 meta tag"
            />
            <p className="mt-1 text-[11px] text-muted">
              Go to{" "}
              <a
                href="https://www.bing.com/webmasters"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                bing.com/webmasters
              </a>
              , add your site, choose &quot;Meta Tag&quot; verification, and paste
              only the{" "}
              <code className="text-foreground">content</code> value here.
              Covers Bing, Yahoo &amp; DuckDuckGo.
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">
              Unlock Code
            </label>
            <input
              value={unlockCode}
              onChange={(e) => setUnlockCode(e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="border-t border-border pt-4">
            <p className="mb-4 text-sm font-semibold text-foreground">Ad spaces</p>
            <p className="mb-4 text-xs text-muted">
              Paste adult-network ad HTML/iframe codes (ExoClick, TrafficStars,
              etc.). Empty slots stay hidden unless{" "}
              <span className="text-foreground">Ad preview mode</span> (top of
              this page) is on. Popunders do not fire while preview is on.
            </p>
            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">
                  Home page banner (~728×90)
                </label>
                <textarea
                  value={adsHomeHtml}
                  onChange={(e) => setAdsHomeHtml(e.target.value)}
                  rows={3}
                  className={`${inputCls} font-mono text-xs`}
                  placeholder="HTML for homepage under filter chips"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">
                  Video page header (~728×90)
                </label>
                <textarea
                  value={adsHeaderHtml}
                  onChange={(e) => setAdsHeaderHtml(e.target.value)}
                  rows={3}
                  className={`${inputCls} font-mono text-xs`}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">
                  Video sidebar (~300×250)
                </label>
                <textarea
                  value={adsSidebarHtml}
                  onChange={(e) => setAdsSidebarHtml(e.target.value)}
                  rows={3}
                  className={`${inputCls} font-mono text-xs`}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">
                  In-grid / mid-page (~728×90)
                </label>
                <textarea
                  value={adsGridHtml}
                  onChange={(e) => setAdsGridHtml(e.target.value)}
                  rows={3}
                  className={`${inputCls} font-mono text-xs`}
                  placeholder="Shown mid homepage video list"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">
                  Footer banner (~728×90)
                </label>
                <textarea
                  value={adsFooterHtml}
                  onChange={(e) => setAdsFooterHtml(e.target.value)}
                  rows={3}
                  className={`${inputCls} font-mono text-xs`}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">
                  Native / in-feed HTML
                </label>
                <textarea
                  value={adsNativeHtml}
                  onChange={(e) => setAdsNativeHtml(e.target.value)}
                  rows={3}
                  className={`${inputCls} font-mono text-xs`}
                  placeholder="Native ad unit HTML shown on homepage"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">
                  Popunder (URL or HTML)
                </label>
                <textarea
                  value={adsPopunderHtml}
                  onChange={(e) => setAdsPopunderHtml(e.target.value)}
                  rows={3}
                  className={`${inputCls} font-mono text-xs`}
                  placeholder="https://... or script HTML — fires once per session on first click"
                />
                <p className="mt-1 text-[11px] text-muted">
                  Use adult-network popunder codes carefully; may be blocked by
                  browsers.
                </p>
              </div>

              <div className="rounded-xl border border-border/80 bg-surface/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-foreground">
                      5-Second Video Loading Ad Page (Interstitial)
                    </span>
                    <p className="text-[11px] text-muted">
                      Shows a 5-second countdown timer page with top &amp; bottom ads when a user clicks a video, before revealing the stream.
                    </p>
                  </div>
                  <Toggle
                    checked={adsInterstitialEnabled}
                    onChange={(checked) => setAdsInterstitialEnabled(checked)}
                  />
                </div>
                {adsInterstitialEnabled && (
                  <div className="mt-3 flex items-center gap-3">
                    <label className="text-xs text-muted">Countdown Seconds:</label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={adsInterstitialSeconds}
                      onChange={(e) => setAdsInterstitialSeconds(e.target.value)}
                      className={`${inputCls} w-24 text-center font-bold`}
                    />
                    <span className="text-xs text-muted">seconds (default: 5)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="glow rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            {message && (
              <span
                className={`text-sm ${
                  message.includes("failed") ? "text-red-400" : "text-green-400"
                }`}
              >
                {message}
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
