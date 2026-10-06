import type { NextConfig } from "next";

const isOffline = process.env.OFFLINE_MODE === "true"
const isDev = process.env.NODE_ENV === "development"

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // React dev mode (Fast Refresh, component stacks) needs eval()
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
]

const nextConfig: NextConfig = {
  // Static export for offline builds — no server required
  ...(isOffline ? { output: "export", trailingSlash: true } : { output: "standalone" }),
  // Security headers are only meaningful when running as a server (not static export)
  ...(!isOffline ? {
    async headers() {
      return [{ source: "/(.*)", headers: securityHeaders }]
    },
  } : {}),
};

export default nextConfig;
