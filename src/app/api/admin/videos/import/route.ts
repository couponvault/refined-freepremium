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
import { validateVideo } from "../validate";

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

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];

    let categoryIds: number[] = [];
    if (raw.categoryIds?.length) {
      const resolved = await resolveCategoryIds(raw.categoryIds);
      if ("error" in resolved) {
        errors.push({ row: i + 1, error: resolved.error });
        continue;
      }
      categoryIds = resolved;
    } else {
      const cSlugs = parseCategorySlugs(
        raw.categorySlugs || raw.categorySlug || ""
      );
      if (cSlugs.length) {
        const resolved = await resolveCategoryIdsFromSlugs(cSlugs);
        if ("error" in resolved) {
          errors.push({ row: i + 1, error: resolved.error });
          continue;
        }
        categoryIds = resolved;
      } else if (raw.categoryId != null) {
        categoryIds = [Number(raw.categoryId)];
      }
    }

    let performerIds: number[] = [];
    if (raw.performerIds?.length) {
      const resolved = await resolvePerformerIds(raw.performerIds);
      if ("error" in resolved) {
        errors.push({ row: i + 1, error: resolved.error });
        continue;
      }
      performerIds = resolved;
    } else {
      const pSlugs = parsePerformerSlugs(raw.performerSlugs);
      if (pSlugs.length) {
        const resolved = await resolvePerformerIdsFromSlugs(pSlugs);
        if ("error" in resolved) {
          errors.push({ row: i + 1, error: resolved.error });
          continue;
        }
        performerIds = resolved;
      }
    }

    const input: VideoInput = {
      ...raw,
      categoryId: categoryIds[0] ?? null,
    };
    const result = await validateVideo(input);
    if ("error" in result) {
      if (result.error.startsWith("Duplicate embed URL")) {
        skipped++;
        continue;
      }
      errors.push({ row: i + 1, error: result.error });
      continue;
    }
    const video = await db.video.create({
      data: { ...result.data, categoryId: categoryIds[0] ?? null },
    });
    await syncVideoCategories(video.id, categoryIds);
    await syncVideoPerformers(video.id, performerIds);
    created++;
  }

  if (created > 0) {
    await enforceFeaturedLimit();
    const { pingSitemap } = await import("@/lib/site");
    void pingSitemap();
  }

  return NextResponse.json({ created, skipped, errors });
}
