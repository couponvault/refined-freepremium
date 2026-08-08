import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { extractVideoLinkMeta } from "@/lib/link-meta";
import { applyLinkMetaToCatalog } from "@/lib/link-meta-apply";
import { rateLimit } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Local Chrome extract (Desktop tool) + auto-create missing cats/stars.
 * Run via `npm run dev` on a PC with Chrome/Edge installed.
 */
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "admin";
  if (!rateLimit(`extract-link:${ip}`, 20, 60_000)) {
    return NextResponse.json(
      { error: "Too many extract requests. Wait a minute." },
      { status: 429 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as { url?: string };
  const url = (body.url ?? "").trim();
  if (!url) {
    return NextResponse.json(
      { error: "Paste a Pornhub video link first." },
      { status: 400 }
    );
  }

  try {
    const meta = await extractVideoLinkMeta(url);
    const applied = await applyLinkMetaToCatalog(meta);
    return NextResponse.json(applied);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Extract failed unexpectedly.";
    return NextResponse.json(
      { error: `Extract failed: ${message}` },
      { status: 502 }
    );
  }
}
