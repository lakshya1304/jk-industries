import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

/**
 * robots.txt.
 *
 * The allow-list is explicit so no crawler has to guess, and every private
 * route is disallowed at the file level as well as via page metadata. Both
 * layers matter: `robots.txt` stops the request before it is made (cheap for
 * crawlers, and it keeps private URLs out of crawl queues), while the
 * `noindex` metadata on those pages stops a URL being listed if it is reached
 * through an external link.
 *
 * `/bill/` and `/order-confirmation/` are trailing-slashed on purpose — that
 * pattern matches only the dynamic route, not any future sibling page.
 */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();

  // Paths that must never be crawled or indexed.
  const privatePaths = [
    "/admin",
    "/admin/",
    "/api/",
    "/cart",
    "/order-confirmation/",
    "/bill/",
    "/login",
    // Next.js internal and build-output routes.
    "/_next/",
  ];

  return {
    rules: [
      // General crawlers: full public access, private paths excluded.
      {
        userAgent: "*",
        allow: "/",
        disallow: privatePaths,
      },
      // Google's image crawler indexes product photos for Images search, so it
      // is allowed broadly but still kept out of the private routes.
      {
        userAgent: "Googlebot-Image",
        allow: ["/", "/brand/", "/*.jpg$", "/*.jpeg$", "/*.png$", "/*.webp$", "/*.avif$", "/*.svg$"],
        disallow: privatePaths,
      },
      // Aggressive SEO crawlers that provide no traffic. Blocking them avoids
      // wasting crawl budget on the real search engine, which matters while the
      // domain is new and has a limited budget.
      {
        userAgent: [
          "AhrefsBot",
          "SemrushBot",
          "MJ12bot",
          "DotBot",
          "DataForSeoBot",
          "BLEXBot",
          "PetalBot",
        ],
        disallow: "/",
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
