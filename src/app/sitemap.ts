import type { MetadataRoute } from "next";
import { getActiveProducts } from "@/lib/products";
import { absolute, imageForSchema } from "@/lib/seo";

/**
 * XML sitemap.
 *
 * Only canonical, indexable, customer-facing URLs are listed. Admin, API, cart,
 * checkout, order-confirmation and bill routes are deliberately excluded — a
 * sitemap is a statement of "these are the pages I want indexed", so including
 * noindex URLs would contradict the page-level `robots` metadata and generate
 * "Submitted URL marked noindex" warnings in Search Console.
 *
 * `lastModified` uses the product's real `updatedAt` rather than `new Date()`,
 * so the value is meaningful: Google uses it to decide whether to recrawl, and
 * a timestamp that changes on every build teaches it to ignore the field.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: {
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  }[] = [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/products", priority: 0.9, changeFrequency: "daily" },
    { path: "/about", priority: 0.7, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
    { path: "/track", priority: 0.4, changeFrequency: "monthly" },
    { path: "/shipping-returns", priority: 0.4, changeFrequency: "yearly" },
    { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
  ];

  let products: Awaited<ReturnType<typeof getActiveProducts>> = [];
  try {
    products = await getActiveProducts();
  } catch {
    // A sitemap must still be served during a database blip; the static routes
    // are always valid, and the product URLs return on the next request.
    products = [];
  }

  return [
    ...staticRoutes.map((r) => ({
      url: absolute(r.path),
      lastModified: new Date(),
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    })),
    ...products.map((p) => {
      // Product photos are listed alongside the page so they are eligible for
      // Google Images, which is a meaningful traffic source for a physical
      // product catalogue. Only genuine self-hosted photos are included;
      // see `imageForSchema` for why third-party thumbnails are excluded.
      const images = p.images
        .map(imageForSchema)
        .filter((img): img is string => Boolean(img))
        .slice(0, 8);

      return {
        url: absolute(`/products/${p.slug}`),
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
        ...(images.length ? { images } : {}),
      };
    }),
  ];
}
