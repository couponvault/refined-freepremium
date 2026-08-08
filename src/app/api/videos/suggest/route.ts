import { NextRequest, NextResponse } from "next/server";
import { suggestPublic } from "@/lib/search";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  const data = await suggestPublic(q);
  return NextResponse.json(data);
}
