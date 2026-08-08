import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionTokenEdge } from "@/lib/session-edge";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminPage =
    pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");
  const isAdminApi =
    pathname.startsWith("/api/admin") && pathname !== "/api/admin/login";

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  // Must match getSessionSecret() in src/lib/security.ts
  const secret =
    process.env.SESSION_SECRET?.trim() ||
    (process.env.NODE_ENV === "production" ? "" : "dev-secret-local-only");
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const ok = await verifySessionTokenEdge(token, secret);

  if (ok) return NextResponse.next();

  if (isAdminApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const login = new URL("/admin/login", req.url);
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
