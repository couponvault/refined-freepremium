import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import {
  parseCategorySlugs,
  resolveCategoryIds,
  resolveCategoryIdsFromSlugs,
  syncVideoCategories,
} from "@/lib/categories";
import { enforceFeaturedLimit } from "@/lib/featured";
import {
  parsePerformerSlugs,
  resolvePerformerIds,
  resolvePerformerIdsFromSlugs,
  syncVideoPerformers,
} from "@/lib/performers";
import { parseDurationInput, parseViewsInput } from "@/lib/utils";
import type { VideoInput } from "@/types";
import { validateVideoDataSync } from "../validate";

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

function parseBool(v: string | undefined, fallback: boolean): boolean {
  if (v === undefined || v === "") return fallback;
  const s = v.trim().toLowerCase();
  if (["1", "true", "yes", "y"].includes(s)) return true;
  if (["0", "false", "no", "n"].includes(s)) return false;
  return fallback;
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (cols[i] ?? "").trim();
    });
    return row;
  });
}

function rowToInput(row: Record<string, string>): VideoInput {
  return {
    title: row.title ?? "",
    embedUrl: row.embedUrl ?? "",
    thumbnail: row.thumbnail ?? "",
    description: row.description ?? "",
    tags: row.tags ?? "",
    seoTitle: row.seoTitle ?? "",
    seoDescription: row.seoDescription ?? "",
    duration: parseDurationInput(row.duration),
    quality: row.quality || "720p",
    views: parseViewsInput(row.views),
    featured: parseBool(row.featured, false),
    trending: parseBool(row.trending, false),
    published: parseBool(row.published, true),
    exclusive: parseBool(row.exclusive, false),
    categorySlugs: row.categorySlugs || row.categorySlug || "",
    performerSlugs: row.performerSlugs ?? "",
  };
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as {
    rows?: VideoInput[];
    csv?: string;
    text?: string;
  };

  let rows: VideoInput[] = [];
  const csvText = body.csv ?? body.text;
  if (Array.isArray(body.rows) && body.rows.length > 0) {
    rows = body.rows;
  } else if (typeof csvText === "string" && csvText.trim()) {
    rows = parseCsv(csvText).map(rowToInput);
  } else {
    return NextResponse.json(
      { error: "Provide rows[] or csv/text" },
      { status: 400 }
    );
  }

  let created = 0;
  let skipped = 0;
  const errors: { row: number; error: string }[] = [];

  // 1. Bulk validation (memory)
  const validRows: { rowIdx: number; input: VideoInput; data: any }[] = [];
  const embedUrls = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const result = validateVideoDataSync(raw);
    if ("error" in result) {
      errors.push({ row: i + 1, error: result.error });
      continue;
    }
    embedUrls.add(result.data.embedUrl);
    validRows.push({ rowIdx: i, input: raw, data: result.data });
  }

  // 2. Bulk duplicate detection
  const existingDups = await db.video.findMany({
    where: { embedUrl: { in: [...embedUrls] }, deletedAt: null },
    select: { embedUrl: true, title: true, id: true },
  });
  const dupMap = new Map(existingDups.map((v) => [v.embedUrl, v]));

  const nonDupRows = validRows.filter((item) => {
    const dup = dupMap.get(item.data.embedUrl);
    if (dup) {
      skipped++;
      return false;
    }
    return true;
  });

  if (nonDupRows.length === 0) {
    return NextResponse.json({ created, skipped, errors });
  }

  // 3. Collect unique categories & performers
  const allCatSlugs = new Set<string>();
  const allPerfSlugs = new Set<string>();

  nonDupRows.forEach(({ input }) => {
    parseCategorySlugs(input.categorySlugs || input.categorySlug || "").forEach(s => allCatSlugs.add(s));
    parsePerformerSlugs(input.performerSlugs).forEach(s => allPerfSlugs.add(s));
  });

  // 4. Resolve/Create Categories
  const catSlugMap = new Map<string, number>();
  if (allCatSlugs.size > 0) {
    const existingCats = await db.category.findMany({
      where: { slug: { in: [...allCatSlugs] } },
      select: { id: true, slug: true },
    });
    existingCats.forEach(c => catSlugMap.set(c.slug, c.id));
    
    const missingCats = [...allCatSlugs].filter(s => !catSlugMap.has(s));
    if (missingCats.length > 0) {
      await db.category.createMany({
        data: missingCats.map(s => ({
          name: s.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
          slug: s,
          icon: "🎬",
          enabled: true,
          order: 0
        })),
        skipDuplicates: true,
      });
      const newCats = await db.category.findMany({
        where: { slug: { in: missingCats } },
        select: { id: true, slug: true },
      });
      newCats.forEach(c => catSlugMap.set(c.slug, c.id));
    }
  }

  // 5. Resolve/Create Performers
  const perfSlugMap = new Map<string, number>();
  if (allPerfSlugs.size > 0) {
    const existingPerfs = await db.performer.findMany({
      where: { slug: { in: [...allPerfSlugs] } },
      select: { id: true, slug: true },
    });
    existingPerfs.forEach(p => perfSlugMap.set(p.slug, p.id));
    
    const missingPerfs = [...allPerfSlugs].filter(s => !perfSlugMap.has(s));
    if (missingPerfs.length > 0) {
      await db.performer.createMany({
        data: missingPerfs.map(s => ({
          name: s.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
          slug: s,
          enabled: true,
        })),
        skipDuplicates: true,
      });
      const newPerfs = await db.performer.findMany({
        where: { slug: { in: missingPerfs } },
        select: { id: true, slug: true },
      });
      newPerfs.forEach(p => perfSlugMap.set(p.slug, p.id));
    }
  }

  // 6. Generate basic slugs and bulk create videos
  const toInsert = nonDupRows.map((item, idx) => {
    const baseSlug = item.data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'video';
    const uniqueSlug = `${baseSlug}-${Date.now()}-${idx}`; // Fast unique slug to avoid collisions in bulk insert
    
    const cSlugs = parseCategorySlugs(item.input.categorySlugs || item.input.categorySlug || "");
    const primaryCatId = cSlugs.length > 0 ? catSlugMap.get(cSlugs[0]) ?? null : (item.input.categoryId ? Number(item.input.categoryId) : null);

    return {
      ...item.data,
      slug: uniqueSlug,
      categoryId: primaryCatId,
    };
  });

  await db.video.createMany({
    data: toInsert,
    skipDuplicates: true,
  });

  // 7. Fetch inserted videos back to link relations
  const insertedEmbedUrls = toInsert.map(v => v.embedUrl);
  const newVideos = await db.video.findMany({
    where: { embedUrl: { in: insertedEmbedUrls }, deletedAt: null },
    select: { id: true, embedUrl: true },
  });
  const newVideoMap = new Map(newVideos.map(v => [v.embedUrl, v.id]));

  // 8. Bulk insert relations
  const videoCatLinks: { videoId: number; categoryId: number }[] = [];
  const videoPerfLinks: { videoId: number; performerId: number }[] = [];

  nonDupRows.forEach(({ input, data }) => {
    const videoId = newVideoMap.get(data.embedUrl);
    if (!videoId) return;
    
    const cSlugs = parseCategorySlugs(input.categorySlugs || input.categorySlug || "");
    cSlugs.forEach(s => {
      const cid = catSlugMap.get(s);
      if (cid) videoCatLinks.push({ videoId, categoryId: cid });
    });

    const pSlugs = parsePerformerSlugs(input.performerSlugs);
    pSlugs.forEach(s => {
      const pid = perfSlugMap.get(s);
      if (pid) videoPerfLinks.push({ videoId, performerId: pid });
    });
  });

  if (videoCatLinks.length > 0) {
    await db.videoCategory.createMany({ data: videoCatLinks, skipDuplicates: true });
  }
  if (videoPerfLinks.length > 0) {
    await db.videoPerformer.createMany({ data: videoPerfLinks, skipDuplicates: true });
  }

  created += newVideos.length;

  if (created > 0) {
    await enforceFeaturedLimit();
    const { pingSitemap } = await import("@/lib/site");
    void pingSitemap();
  }

  return NextResponse.json({ created, skipped, errors });
}
