import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clientIp, rateLimit, safeEqualString } from "@/lib/security";

/** Whether an unlock code is configured (no secret leaked). */
export async function GET() {
  const setting = await db.setting.findUnique({ where: { key: "unlockCode" } });
  const configured = !!(setting?.value?.trim());
  return NextResponse.json({ configured });
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (!rateLimit(`unlock:${ip}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const setting = await db.setting.findUnique({ where: { key: "unlockCode" } });
  const expected = setting?.value?.trim() ?? "";

  if (!expected) {
    return NextResponse.json(
      { error: "Unlock code is not configured" },
      { status: 503 }
    );
  }

  const code = (body.code ?? "").trim();
  if (safeEqualString(code, expected)) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid code" }, { status: 401 });
}
