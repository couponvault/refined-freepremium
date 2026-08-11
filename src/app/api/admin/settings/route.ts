import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import {
  normalizeSiteTheme,
  parseCustomTheme,
  serializeCustomTheme,
} from "@/lib/themes";

const KEYS = [
  "seoTitle",
  "seoDescription",
  "seoKeywords",
  "googleSiteVerification",
  "bingVerification",
  "siteTheme",
  "siteThemeCustom",
  "unlockCode",
  "adsDemoMode",
  "adsHeaderHtml",
  "adsSidebarHtml",
  "adsHomeHtml",
  "adsFooterHtml",
  "adsGridHtml",
  "adsPopunderHtml",
  "adsNativeHtml",
] as const;

export async function GET() {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const settings = await db.setting.findMany();
  const map: Record<string, string> = {};
  for (const s of settings) map[s.key] = s.value;
  return NextResponse.json(map);
}

export async function PUT(req: NextRequest) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const entries: [string, string][] = [];
  for (const key of KEYS) {
    if (typeof body[key] !== "string") continue;
    let value = (body[key] as string).trim();
    if (key === "siteTheme") value = normalizeSiteTheme(value);
    if (key === "siteThemeCustom") {
      value = serializeCustomTheme(parseCustomTheme(value));
    }
    entries.push([key, value]);
  }
  if (entries.length === 0)
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  for (const [key, value] of entries) {
    await db.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  return NextResponse.json({ ok: true });
}
