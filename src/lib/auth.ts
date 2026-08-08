import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import {
  getSessionSecret,
  rateLimit,
  safeEqualString,
} from "@/lib/security";
import { SESSION_COOKIE } from "@/lib/session-edge";

export { SESSION_COOKIE };
const SESSION_TTL_MS = 1000 * 60 * 60 * 24; // 24h

function sign(payload: string): string {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
}

/** Returns a signed session token valid for 24h. */
export function createSessionToken(): string {
  const exp = Date.now() + SESSION_TTL_MS;
  return `${exp}.${sign(String(exp))}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const expected = sign(exp);
  if (sig.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

/** True if the current request carries a valid admin session cookie. */
export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export function checkCredentials(username: string, password: string): boolean {
  // Credentials come only from environment — never hardcode passwords in source.
  const expectedUser = process.env.ADMIN_USERNAME?.trim() ?? "";
  const expectedPass = process.env.ADMIN_PASSWORD ?? "";
  if (!expectedUser || !expectedPass) return false;
  return (
    safeEqualString(username, expectedUser) &&
    safeEqualString(password, expectedPass)
  );
}

/** @returns true if login attempt is allowed */
export function checkLoginRateLimit(ip: string): boolean {
  return rateLimit(`login:${ip}`, 5, 1000 * 60 * 15);
}
