import type { NextConfig } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
const enableUpgradeInsecure =
  process.env.NODE_ENV === "production" && siteUrl.startsWith("https://");

const csp = [
  "default-src 'self'",
  // Ad networks need broad script/https; only paste trusted ad codes in admin
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
  "style-src 'self' 'unsafe-inline' https:",
  "img-src 'self' data: blob: https: http:",
  "font-src 'self' data: https:",
  "media-src 'self' https: blob:",
  "frame-src 'self' https: http:",
  "connect-src 'self' https: http: ws: wss:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
];
// Never force https upgrade on localhost (breaks CSS/JS when testing with next start)
if (enableUpgradeInsecure) {
  csp.push("upgrade-insecure-requests");
}

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Content-Security-Policy", value: csp.join("; ") },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
