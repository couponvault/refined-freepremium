import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isSafeUrl } from "@/lib/utils";
import { clientIp, rateLimit } from "@/lib/security";

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (!rateLimit(`dmca:${ip}`, 8, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 }
    );
  }

  let body: {
    name?: string;
    email?: string;
    url?: string;
    company?: string;
    details?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = (body.name ?? "").trim().slice(0, 200);
  const email = (body.email ?? "").trim().slice(0, 200);
  const url = (body.url ?? "").trim().slice(0, 500);
  const company = (body.company ?? "").trim().slice(0, 200);
  const details = (body.details ?? "").trim().slice(0, 5000);

  if (!name) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }
  if (!url || !isSafeUrl(url)) {
    return NextResponse.json({ error: "Valid URL required" }, { status: 400 });
  }

  await db.dmcaRequest.create({
    data: { name, email, url, company, details },
  });

  return NextResponse.json({ ok: true });
}
