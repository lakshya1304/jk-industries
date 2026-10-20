import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Allow product images served from the Vercel Blob CDN (admin uploads).
    remotePatterns: [
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
    ],
    // Modern formats only: AVIF then WebP. Smaller images directly improve
    // Largest Contentful Paint, which is a Core Web Vitals ranking signal.
    formats: ["image/avif", "image/webp"],
    // Long cache for optimised derivatives; uploads are content-addressed by
    // URL so a changed image always has a new URL.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [360, 420, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [64, 96, 128, 200, 256, 384],
  },
  // Strip the `X-Powered-By` fingerprint (minor hardening, and it keeps the
  // response headers we do send focused).
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [
      {
        /*
          Defense in depth for the private surfaces.
          robots.txt stops the crawl and page metadata stops indexing, but neither
          helps if a URL in one of these segments is linked from elsewhere and
          fetched anyway — this header is the authoritative, per-response signal.

          These use `/:path*` segments rather than one negative-lookahead regex:
          Next.js matches `source` with path-to-regexp, which has no lookahead
          support, so a `(?!admin)` pattern would silently match nothing and the
          public directive below would never apply.
        */
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
      {
        source: "/cart/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/bill/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
      {
        source: "/order-confirmation/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
      {
        source: "/login/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        // Security + privacy headers on everything. `Referrer-Policy` keeps
        // order references out of the `Referer` sent to third parties when a
        // customer opens WhatsApp or Maps from a confirmation page.
        source: "/:path*",
        headers: [
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
