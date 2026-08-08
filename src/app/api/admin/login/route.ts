import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  checkCredentials,
  checkLoginRateLimit,
  createSessionToken,
} from "@/lib/auth";
import { clientIp } from "@/lib/security";

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (!checkLoginRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again in 15 minutes." },
      { status: 429 }
    );
  }
  const body = await req.json().catch(() => ({}));
  const { username, password } = body as {
    username?: string;
    password?: string;
  };
  if (!checkCredentials(username ?? "", password ?? "")) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 86400,
  });
  return res;
}
